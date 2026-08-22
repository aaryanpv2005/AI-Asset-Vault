import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

def send_email(
    recipient: str,
    subject: str,
    body: str,
    html_body: str | None = None
) -> bool:
    try:
        params = {
            "from": "AI Asset Vault <onboarding@resend.dev>",
            "to": [recipient],
            "subject": subject,
            "html": html_body or body,
        }

        email = resend.Emails.send(params)
        print(f"Email sent successfully to {recipient}, ID: {email.get('id')}")
        return True
    except Exception as e:
        print("Email sending failed:", repr(e))
        return False