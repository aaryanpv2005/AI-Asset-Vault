import os
import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from dotenv import load_dotenv

load_dotenv()


EMAIL_HOST = os.getenv("EMAIL_HOST")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USERNAME = os.getenv("EMAIL_USERNAME")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM")


def send_email(
    recipient: str,
    subject: str,
    body: str,
    html_body: str | None = None
):

    message = MIMEMultipart("alternative")

    message["From"] = EMAIL_FROM
    message["To"] = recipient
    message["Subject"] = subject

    # Plain-text fallback
    message.attach(
        MIMEText(body, "plain")
    )

    # HTML version
    if html_body:

        message.attach(
            MIMEText(html_body, "html")
        )

    try:

        with smtplib.SMTP(
            EMAIL_HOST,
            EMAIL_PORT
        ) as server:

            server.starttls()

            server.login(
                EMAIL_USERNAME,
                EMAIL_PASSWORD
            )

            server.sendmail(
                EMAIL_FROM,
                recipient,
                message.as_string()
            )

        return True

    except Exception as e:

        print("Email sending failed:", e)

        return False