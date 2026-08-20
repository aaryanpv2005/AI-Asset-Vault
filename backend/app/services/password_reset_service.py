import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app import models
from app.auth import hash_password


RESET_TOKEN_EXPIRE_MINUTES = 30


def generate_reset_token() -> str:
    """
    Generate a cryptographically secure password reset token.
    """
    return secrets.token_urlsafe(32)


def hash_reset_token(token: str) -> str:
    """
    Hash the reset token before storing it in the database.
    """
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


def create_password_reset_token(
    db: Session,
    user: models.User
) -> str:

    # Invalidate previous unused tokens.
    db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.user_id == user.id,
        models.PasswordResetToken.used == False
    ).update(
        {
            models.PasswordResetToken.used: True
        },
        synchronize_session=False
    )

    token = generate_reset_token()

    token_hash = hash_reset_token(token)

    reset_token = models.PasswordResetToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=(
            datetime.now(timezone.utc)
            + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)
        ),
        used=False
    )

    db.add(reset_token)
    db.commit()

    return token


def reset_user_password(
    db: Session,
    token: str,
    new_password: str
):
    """
    Validate a password reset token and update the user's password.
    """

    token_hash = hash_reset_token(token)

    reset_token = (
        db.query(models.PasswordResetToken)
        .filter(
            models.PasswordResetToken.token_hash == token_hash,
            models.PasswordResetToken.used == False
        )
        .first()
    )

    if not reset_token:
        return None

    # Make sure the token hasn't expired.
    now = datetime.now(timezone.utc)

    if reset_token.expires_at <= now:
        reset_token.used = True
        db.commit()
        return None

    # Find the user associated with the token.
    user = (
        db.query(models.User)
        .filter(
            models.User.id == reset_token.user_id
        )
        .first()
    )

    if not user:
        reset_token.used = True
        db.commit()
        return None

    # Reuse the application's existing password hashing.
    user.password_hash = hash_password(new_password)

    # Make the token permanently unusable.
    reset_token.used = True

    db.commit()

    return user

def get_valid_reset_token(
    db: Session,
    token: str
):
    token_hash = hash_reset_token(token)

    reset_token = (
        db.query(models.PasswordResetToken)
        .filter(
            models.PasswordResetToken.token_hash == token_hash,
            models.PasswordResetToken.used == False
        )
        .first()
    )

    if not reset_token:
        return None

    now = datetime.now(timezone.utc)

    if reset_token.expires_at <= now:
        reset_token.used = True
        db.commit()
        return None

    return reset_token