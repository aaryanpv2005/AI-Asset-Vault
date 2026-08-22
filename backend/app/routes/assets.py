import os
import shutil
import uuid
from datetime import date
from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException,
    Query,
    Form,
    Response
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app import models, crud
import app.schemas as schemas
from app.services.pdf_service import extract_text_from_pdf
from app.services.ai_service import generate_summary, generate_tags, ask_document
from app.services.supabase_service import supabase, SUPABASE_BUCKET

router = APIRouter(
    prefix="/assets",
    tags=["Assets"]
)


def fetch_file_from_supabase(stored_name: str, user_id: int):
    """Candidate path lookup to resolve legacy vs new storage paths."""
    raw_filename = stored_name.split("/")[-1]
    candidate_paths = [
        stored_name,
        f"user_{user_id}/{raw_filename}",
        raw_filename
    ]

    seen = set()
    unique_paths = [p for p in candidate_paths if not (p in seen or seen.add(p))]

    for path in unique_paths:
        try:
            print(f"[Supabase Storage] Trying download path: '{path}'")
            return supabase.storage.from_(SUPABASE_BUCKET).download(path)
        except Exception as e:
            print(f"[Supabase Storage] Path failed '{path}': {repr(e)}")

    raise HTTPException(status_code=404, detail="File not found in storage bucket")


@router.post("/upload")
def upload_asset(
    file: UploadFile = File(...),
    expiry_date: date | None = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    extension = os.path.splitext(file.filename)[1]
    unique_id = str(uuid.uuid4())
    stored_name = f"{unique_id}{extension}"
    storage_path = f"user_{current_user.id}/{stored_name}"

    temp_path = f"/tmp/{stored_name}"

    try:
        # 1. Save temp file
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(temp_path)

        # 2. Extract PDF text
        text = ""
        try:
            text = extract_text_from_pdf(temp_path) or ""
        except Exception as e:
            print("[PDF Extract Warning]:", repr(e))

        # 3. AI Summary
        summary = "No summary available"
        try:
            if text:
                summary = generate_summary(text)
        except Exception as e:
            print("[AI Summary Warning]:", repr(e))

        # 4. AI Tags
        tags = ["Document"]
        try:
            if text:
                tags = generate_tags(text)
        except Exception as e:
            print("[AI Tags Warning]:", repr(e))

        # 5. Supabase Upload
        with open(temp_path, "rb") as uploaded_file:
            res = supabase.storage.from_(SUPABASE_BUCKET).upload(
                path=storage_path,
                file=uploaded_file.read(),
                file_options={"content-type": file.content_type or "application/octet-stream"}
            )
            print(f"[Supabase Upload Success]: {res}")

        # 6. Database Entry
        asset = crud.create_asset(
            db=db,
            current_user=current_user,
            file_name=file.filename,
            stored_name=storage_path,
            file_type=file.content_type,
            file_size=file_size,
            summary=summary,
            document_text=text,
            tags=tags,
            expiry_date=expiry_date
        )

        return {
            "message": "File uploaded successfully",
            "original_name": file.filename,
            "stored_name": storage_path,
            "uploaded_by": current_user.email,
            "summary": summary,
            "tags": tags,
            "expiry_date": asset.expiry_date
        }

    except Exception as e:
        print(f"[Upload Error Trace]: {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
@router.get("/search")
def search_assets(
    query: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.search_assets(db=db, current_user=current_user, query=query)


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_dashboard_stats(db=db, current_user=current_user)


@router.get("/{asset_id}/preview")
def preview_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    asset = crud.get_asset_by_id(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        file_data = fetch_file_from_supabase(asset.stored_name, current_user.id)
        return Response(
            content=file_data,
            media_type=asset.file_type or "application/octet-stream",
            headers={"Content-Disposition": f'inline; filename="{asset.file_name}"'}
        )
    except HTTPException:
        raise
    except Exception as e:
        print("Preview error:", repr(e))
        raise HTTPException(status_code=404, detail="File not found in storage")


@router.get("/{asset_id}/download")
def download_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    asset = crud.get_asset_by_id(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        file_data = fetch_file_from_supabase(asset.stored_name, current_user.id)
        return Response(
            content=file_data,
            media_type=asset.file_type or "application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{asset.file_name}"'}
        )
    except HTTPException:
        raise
    except Exception as e:
        print("Download error:", repr(e))
        raise HTTPException(status_code=404, detail="File not found in storage")


@router.delete("/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    asset = crud.get_asset_by_id(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    raw_filename = asset.stored_name.split("/")[-1]
    candidate_paths = [
        asset.stored_name,
        f"user_{current_user.id}/{raw_filename}",
        raw_filename
    ]

    try:
        supabase.storage.from_(SUPABASE_BUCKET).remove(candidate_paths)
    except Exception as e:
        print("Storage delete non-fatal error:", repr(e))

    crud.delete_asset(db, asset)
    return {"message": "Asset deleted successfully"}


@router.post("/{asset_id}/chat")
def chat_with_document(
    asset_id: int,
    request: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    asset = crud.get_asset_by_id(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if not asset.document_text:
        raise HTTPException(status_code=400, detail="No document text available")

    answer = ask_document(asset.document_text, request.question)
    crud.create_chat_history(
        db=db, user_id=current_user.id, asset_id=asset.id, question=request.question, answer=answer
    )
    return {"question": request.question, "answer": answer}


@router.get("/{asset_id}/chat-history")
def get_history(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    asset = crud.get_asset_by_id(db, asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    if asset.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return crud.get_chat_history(db=db, user_id=current_user.id, asset_id=asset_id)