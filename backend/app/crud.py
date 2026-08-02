from sqlalchemy.orm import Session
from sqlalchemy import or_ 
from app import models, schemas
from app.auth import hash_password


def create_user(db: Session, user: schemas.UserCreate):
    """
    Create a new user in the database.
    """

    hashed_password = hash_password(user.password)

    db_user = models.User(
        full_name=user.full_name,
        email=user.email, 
        password_hash=hashed_password
    )

    db.add(db_user)

    db.commit()

    db.refresh(db_user)

    return db_user

def authenticate_user(db: Session, email: str, password: str):
    """
    Authenticate a user using email and password.
    """

    user = db.query(models.User).filter(
        models.User.email == email
    ).first()

    if not user:
        return None

    from app.auth import verify_password

    if not verify_password(password, user.password_hash):
        return None

    return user

def create_asset(
    db: Session,
    current_user: models.User,
    file_name: str,
    stored_name: str,
    file_type: str,
    file_size: int,
    summary: str,
    document_text: str,
    tags: str
):
    asset = models.Asset(
        user_id=current_user.id,
        file_name=file_name,
        stored_name=stored_name,
        file_type=file_type,
        file_size=file_size,
        summary=summary,
        document_text=document_text,
        tags=tags
    )

    db.add(asset)
    db.commit()
    db.refresh(asset)

    return asset

def get_user_assets(
    db: Session,
    current_user: models.User
):
    return (
        db.query(models.Asset)
        .filter(models.Asset.user_id == current_user.id)
        .all()
    )
def get_asset_by_id(
    db: Session,
    asset_id: int
):
    return (
        db.query(models.Asset)
        .filter(models.Asset.id == asset_id)
        .first()
    )
def delete_asset(
    db: Session,
    asset: models.Asset
):
    db.delete(asset)
    db.commit()

def search_assets(
    db: Session,
    current_user: models.User,
    query: str
):
    return (
        db.query(models.Asset)
        .filter(
            models.Asset.user_id == current_user.id,
            or_(
                models.Asset.file_name.ilike(f"%{query}%"),
                models.Asset.summary.ilike(f"%{query}%"),
                models.Asset.tags.ilike(f"%{query}%")
            )
        )
        .all()
    )

def get_dashboard_stats(
    db: Session,
    current_user: models.User
):
    assets = (
        db.query(models.Asset)
        .filter(models.Asset.user_id == current_user.id)
        .all()
    )

    total_files = len(assets)

    total_storage = sum(asset.file_size for asset in assets)

    pdf_files = sum(
        1 for asset in assets
        if asset.file_type == "application/pdf"
    )

    image_files = sum(
        1 for asset in assets
        if asset.file_type.startswith("image/")
    )

    other_files = total_files - pdf_files - image_files

    return {
        "total_files": total_files,
        "total_storage": total_storage,
        "pdf_files": pdf_files,
        "image_files": image_files,
        "other_files": other_files
    }

def create_chat_history(
    db,
    user_id,
    asset_id,
    question,
    answer
):
    chat = models.ChatHistory(
        user_id=user_id,
        asset_id=asset_id,
        question=question,
        answer=answer
    )

    db.add(chat)
    db.commit()
    db.refresh(chat)

    return chat

def get_chat_history(
    db,
    user_id,
    asset_id
):
    return (
        db.query(models.ChatHistory)
        .filter(
            models.ChatHistory.user_id == user_id,
            models.ChatHistory.asset_id == asset_id
        )
        .order_by(models.ChatHistory.created_at.asc())
        .all()
    )