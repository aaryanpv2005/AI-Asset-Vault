from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.dependencies import get_current_user
from app.database import get_db
from app import schemas, crud, models
from app.jwt_handler import create_access_token
from app.email_service import send_email
from app.services.password_reset_service import (
    create_password_reset_token,
    reset_user_password
)
import time

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    ...
    return crud.create_user(db, user)


# 👇 Add the login endpoint here


@router.post("/login")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    start_time = time.time()

    authenticated_user = crud.authenticate_user(
        db,
        form_data.username,
        form_data.password
    )

    print(
        f"Authentication took: "
        f"{time.time() - start_time:.2f} seconds"
    )

    if authenticated_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        {
            "sub": authenticated_user.email
        }
    )

    print(
        f"Total login took: "
        f"{time.time() - start_time:.2f} seconds"
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }



@router.post("/forgot-password")
def forgot_password(
    request: schemas.ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(
        models.User.email == request.email
    ).first()

    # Always return the same response.
    # This prevents email/account enumeration.
    if not user:
        return {
            "message": "If an account exists with that email, a password reset link has been sent."
        }

    token = create_password_reset_token(
        db,
        user
    )

    reset_link = (
    "https://ai-asset-vault.onrender.com/reset-password"
    f"?token={token}"
    )

    subject = "Reset your AI Asset Vault password"

    body = f"""
Hello {user.full_name},

We received a request to reset your AI Asset Vault password.

Use the following link to reset your password:

{reset_link}

This link will expire in 30 minutes.

If you did not request a password reset, you can safely ignore this email.

Regards,
AI Asset Vault
"""

    html_body = f"""
<html>
<body>
    <h2>Password Reset Request</h2>

    <p>Hello {user.full_name},</p>

    <p>
        We received a request to reset your
        <strong>AI Asset Vault</strong> password.
    </p>

    <p>
        Click the button below to reset your password:
    </p>

    <p>
        <a
            href="{reset_link}"
            style="
                display:inline-block;
                padding:12px 20px;
                background:#2563eb;
                color:white;
                text-decoration:none;
                border-radius:6px;
            "
        >
            Reset Password
        </a>
    </p>

    <p>
        This link will expire in <strong>30 minutes</strong>.
    </p>

    <p>
        If you did not request a password reset,
        you can safely ignore this email.
    </p>

    <p>
        Regards,<br>
        AI Asset Vault
    </p>
</body>
</html>
"""

    email_sent = send_email(
        recipient=user.email,
        subject=subject,
        body=body,
        html_body=html_body
    )

    if not email_sent:
        print(
            f"Password reset email could not be sent to {user.email}"
        )

    return {
        "message": "If an account exists with that email, a password reset link has been sent."
    }

@router.post("/reset-password")
def reset_password(
    request: schemas.ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )

    user = reset_user_password(
        db,
        request.token,
        request.new_password
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token"
        )

    return {
        "message": "Password reset successfully"
    }

@router.get("/me", response_model=schemas.UserResponse)
def get_logged_in_user(
    current_user: models.User = Depends(get_current_user)
):
    """
    Return the currently authenticated user.
    """
    return current_user