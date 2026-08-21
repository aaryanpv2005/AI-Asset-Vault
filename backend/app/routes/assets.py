from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException,
    Query,
    Form
)
from fastapi.responses import FileResponse

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app import models, crud
import app.schemas as schemas
from app.services.pdf_service import extract_text_from_pdf
from app.services.ai_service import generate_summary, generate_tags
from app.services.ai_service import ask_document
from fastapi.responses import FileResponse, Response
from datetime import date

from app.services.supabase_service import (
    supabase,
    SUPABASE_BUCKET
)

import os
import shutil
import uuid

router = APIRouter(
    prefix="/assets",
    tags=["Assets"]
)


@router.post("/upload")
def upload_asset(
    file: UploadFile = File(...),
    expiry_date: date | None = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    extension = os.path.splitext(file.filename)[1]
    stored_name = f"{uuid.uuid4()}{extension}"

    # Temporary local directory
    BASE_DIR = os.path.dirname(
        os.path.dirname(
            os.path.dirname(os.path.abspath(__file__))
        )
    )

    TEMP_DIR = os.path.join(BASE_DIR, "temp_uploads")
    os.makedirs(TEMP_DIR, exist_ok=True)

    temp_path = os.path.join(TEMP_DIR, stored_name)

    try:

        # Save temporarily so PDF processing can happen
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = os.path.getsize(temp_path)

        # Extract document text
        text = extract_text_from_pdf(temp_path)

        # Generate AI summary and tags
        summary = generate_summary(text)
        tags = generate_tags(text)

        # Organize files by user
        storage_path = (
            f"user_{current_user.id}/{stored_name}"
        )

        # Upload file to Supabase Storage
        with open(temp_path, "rb") as uploaded_file:

            supabase.storage.from_(
                SUPABASE_BUCKET
            ).upload(
                storage_path,
                uploaded_file.read(),
                {
                    "content-type": (
                        file.content_type
                        or "application/octet-stream"
                    )
                }
            )

        # Create database record
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

    finally:

        # Always remove temporary local file
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/my-assets")
def get_my_assets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_user_assets(
        db=db,
        current_user=current_user
    )


@router.get("/search")
def search_assets(
    query: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.search_assets(
        db=db,
        current_user=current_user,
        query=query
    )


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_dashboard_stats(
        db=db,
        current_user=current_user
    )

@router.get("/{asset_id}/preview")
def preview_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    asset = crud.get_asset_by_id(db, asset_id)

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    if asset.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    try:

        # First try the path stored in the database
        storage_path = asset.stored_name

        file_data = supabase.storage.from_(
            SUPABASE_BUCKET
        ).download(storage_path)

        return Response(
            content=file_data,
            media_type=(
                asset.file_type
                or "application/octet-stream"
            ),
            headers={
                "Content-Disposition": (
                    f'inline; filename="{asset.file_name}"'
                )
            }
        )

    except Exception as e:

        print(
            f"Preview error for asset {asset_id}:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to preview file"
        )


@router.get("/{asset_id}/download")
def download_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    asset = crud.get_asset_by_id(db, asset_id)

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    if asset.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    try:

        # Use exactly the path stored in the database
        storage_path = asset.stored_name

        file_data = supabase.storage.from_(
            SUPABASE_BUCKET
        ).download(storage_path)

        return Response(
            content=file_data,
            media_type=(
                asset.file_type
                or "application/octet-stream"
            ),
            headers={
                "Content-Disposition": (
                    f'attachment; filename="{asset.file_name}"'
                )
            }
        )

    except Exception as e:

        print(
            f"Download error for asset {asset_id}:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to download file"
        )


@router.delete("/{asset_id}")
def delete_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    asset = crud.get_asset_by_id(db, asset_id)

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    if asset.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    try:

        # Delete the actual file from Supabase Storage
        supabase.storage.from_(
            SUPABASE_BUCKET
        ).remove(
            [asset.stored_name]
        )

    except Exception as e:

        print("Storage delete error:", e)

        raise HTTPException(
            status_code=500,
            detail="Could not delete file from storage"
        )

    # Delete asset record and related chat history from database
    crud.delete_asset(db, asset)

    return {
        "message": "Asset deleted successfully"
    }


@router.post("/{asset_id}/chat")
def chat_with_document(
    asset_id: int,
    request: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    asset = crud.get_asset_by_id(db, asset_id)

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    if asset.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    # Use the document text already stored in PostgreSQL
    if not asset.document_text:
        raise HTTPException(
            status_code=400,
            detail="No document text available for this asset"
        )

    answer = ask_document(
        asset.document_text,
        request.question
    )

    crud.create_chat_history(
        db=db,
        user_id=current_user.id,
        asset_id=asset.id,
        question=request.question,
        answer=answer
    )

    return {
        "question": request.question,
        "answer": answer
    }


@router.get("/{asset_id}/chat-history")
def get_history(
    asset_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    asset = crud.get_asset_by_id(db, asset_id)

    if not asset:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    if asset.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return crud.get_chat_history(
        db=db,
        user_id=current_user.id,
        asset_id=asset_id
    )