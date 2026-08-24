from datetime import date, datetime
from sqlalchemy.orm import Session
from app.models import Asset, ExpiryReminder, User
from app.email_service import send_email


def check_expiry_reminders(db: Session):
    today = date.today()

    # Efficiently fetch assets with their owners in a single SQL query
    assets_with_users = (
        db.query(Asset, User)
        .join(User, Asset.user_id == User.id)
        .filter(Asset.expiry_date.isnot(None))
        .all()
    )

    for asset, user in assets_with_users:
        if not asset.expiry_date:
            continue

        # Safe conversion: Ensure expiry_date is a standard date object
        exp_date = asset.expiry_date
        if isinstance(exp_date, datetime):
            exp_date = exp_date.date()

        days_remaining = (exp_date - today).days

        # Determine reminder type
        if days_remaining == 30:
            reminder_type = "30_days"
        elif days_remaining == 7:
            reminder_type = "7_days"
        elif days_remaining == 1:
            reminder_type = "1_day"
        else:
            continue

        # Skip if this specific reminder interval was already sent
        existing_reminder = (
            db.query(ExpiryReminder)
            .filter(
                ExpiryReminder.asset_id == asset.id,
                ExpiryReminder.reminder_type == reminder_type,
            )
            .first()
        )

        if existing_reminder:
            continue

        # Subject and Badge Styling
        if days_remaining == 1:
            subject = f"Urgent: {asset.file_name} expires tomorrow"
            status_color = "#dc2626"
            status_background = "#fef2f2"
            status_text = "Expires Tomorrow"
        else:
            subject = f"Reminder: {asset.file_name} expires in {days_remaining} days"
            status_color = "#d97706"
            status_background = "#fffbeb"
            status_text = f"Expires in {days_remaining} days"

        # Plain Text Body
        body = f"""
Hello {user.full_name},

Your document "{asset.file_name}" is approaching its expiry date.

Expiry date: {exp_date.strftime("%d/%m/%Y")}
Days remaining: {days_remaining}

Please review the document before it expires.

AI Asset Vault
Secure AI-powered document management
"""

        # HTML Body
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#2563eb,#4f46e5); padding:28px; color:white;">
            <div style="font-size:24px; font-weight:bold;">AI Asset Vault</div>
            <div style="margin-top:6px; font-size:14px; opacity:0.9;">Secure AI-powered document management</div>
        </div>

        <div style="padding:32px;">
            <h2 style="margin:0 0 12px 0; color:#111827; font-size:22px;">Document Expiry Reminder</h2>
            <p style="color:#4b5563; font-size:15px; line-height:1.6;">Hello {user.full_name},</p>
            <p style="color:#4b5563; font-size:15px; line-height:1.6;">Your document is approaching its expiry date. Please review it if any action is required.</p>

            <div style="margin-top:24px; padding:20px; border:1px solid #e5e7eb; border-radius:12px; background:#f9fafb;">
                <div style="font-size:12px; color:#6b7280; text-transform:uppercase; font-weight:bold;">Document</div>
                <div style="margin-top:6px; font-size:16px; font-weight:bold; color:#111827; word-break:break-word;">{asset.file_name}</div>
                
                <div style="margin-top:18px;">
                    <div style="font-size:12px; color:#6b7280; font-weight:bold;">EXPIRY DATE</div>
                    <div style="margin-top:4px; font-size:15px; font-weight:bold; color:#111827;">{exp_date.strftime("%d/%m/%Y")}</div>
                </div>
            </div>

            <div style="margin-top:20px; padding:14px 16px; border-radius:10px; background:{status_background}; border:1px solid {status_color}33; color:{status_color}; font-weight:bold; font-size:14px;">
                ⚠️ {status_text}
            </div>

            <p style="color:#6b7280; font-size:13px; line-height:1.6; margin-top:24px;">
                This is an automated notification from AI Asset Vault.
            </p>
        </div>

        <div style="padding:20px 32px; background:#f9fafb; border-top:1px solid #e5e7eb; text-align:center; color:#9ca3af; font-size:12px;">
            AI Asset Vault<br>Secure AI-powered document management
        </div>
    </div>
</body>
</html>
"""

        # Dispatch Email
        try:
            email_sent = send_email(
                recipient=user.email,
                subject=subject,
                body=body,
                html_body=html_body,
            )

            # Record Sent Status
            if email_sent:
                reminder = ExpiryReminder(
                    asset_id=asset.id, reminder_type=reminder_type
                )
                db.add(reminder)
                db.commit()
        except Exception as err:
            print(f"[Email Error] Failed sending reminder for asset {asset.id}: {err}")
            db.rollback()