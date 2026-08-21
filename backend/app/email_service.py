import os
import smtplib
import socket

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()


EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM")

# Maximum time to wait for the SMTP server
EMAIL_TIMEOUT = 10


def send_email(
    recipient: str,
    subject: str,
    body: str,
    html_body: str | None = None
) -> bool:

    if not all([
        EMAIL_HOST,
        EMAIL_USERNAME,
        EMAIL_PASSWORD,
        EMAIL_FROM
    ]):
        print("Email configuration is incomplete.")
        return False

    message = MIMEMultipart("alternative")

    message["From"] = EMAIL_FROM
    message["To"] = recipient
    message["Subject"] = subject

    message.attach(
        MIMEText(body, "plain")
    )

    if html_body:
        message.attach(
            MIMEText(html_body, "html")
        )

    try:
        with smtplib.SMTP(
            EMAIL_HOST,
            EMAIL_PORT,
            timeout=EMAIL_TIMEOUT
        ) as server:

            server.ehlo()

            server.starttls()

            server.ehlo()

            server.login(
                EMAIL_USERNAME,
                EMAIL_PASSWORD
            )

            server.sendmail(
                EMAIL_FROM,
                recipient,
                message.as_string()
            )

        print(f"Password reset email sent to {recipient}")

        return True

    except (
        smtplib.SMTPException,
        socket.timeout,
        OSError
    ) as e:

        print(f"Email sending failed: {type(e).__name__}: {e}")

        return False

