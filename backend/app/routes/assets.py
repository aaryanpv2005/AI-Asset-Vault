from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException,
    Query 
)
from fastapi.responses import FileResponse 

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app import models, crud
import app.schemas as schemas
from app.services.pdf_service import extract_text_from_pdf
from app.services.ai_service import generate_summary, generate_tags 
from pydantic import BaseModel
from app.services.ai_service import ask_document 

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
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    extension = os.path.splitext(file.filename)[1]
    stored_name = f"{uuid.uuid4()}{extension}"

    BASE_DIR = os.path.dirname(
        os.path.dirname(
            os.path.dirname(os.path.abspath(__file__))
        )
    )
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    upload_path = os.path.join(UPLOAD_DIR, stored_name)

    with open(upload_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(upload_path)

    text = extract_text_from_pdf(upload_path)
    summary = generate_summary(text)
    tags = generate_tags(text) 

    asset = crud.create_asset(
        db=db,
        current_user=current_user,
        file_name=file.filename,
        stored_name=stored_name,
        file_type=file.content_type,
        file_size=file_size,
        summary=summary,
        document_text=text,
        tags=tags
    ) 

    return {
        "message": "File uploaded successfully",
        "original_name": file.filename,
        "stored_name": stored_name,
        "uploaded_by": current_user.email,
        "summary": summary,
        "tags": tags
    }

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

    BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
    file_path = os.path.join(UPLOAD_DIR, asset.stored_name)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="File not found on server"
        )

    return FileResponse(
        path=file_path,
        filename=asset.file_name,
        media_type=asset.file_type
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

    BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)
    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
    file_path = os.path.join(UPLOAD_DIR, asset.stored_name)

    print("DELETE_DIR:", UPLOAD_DIR)
    print("DELETE_PATH:", file_path)
    print("EXISTS:", os.path.exists(file_path))

    if os.path.exists(file_path):
        os.remove(file_path)

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
    
    BASE_DIR = os.path.dirname(
        os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
        )
    )

    UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
    file_path = os.path.join(UPLOAD_DIR, asset.stored_name)

    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    document_text = extract_text_from_pdf(file_path)

    answer = ask_document(
        document_text,
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

    