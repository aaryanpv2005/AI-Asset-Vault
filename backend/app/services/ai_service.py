import os
import time

from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

MODEL_NAME = "gemini-3.6-flash"


def generate_summary(text: str) -> str:

    if not text.strip():
        return "No readable text found in the document."

    prompt = f"""
Summarize the following document in 5-8 concise bullet points.

{text}
"""

    max_retries = 3

    for attempt in range(max_retries):

        try:

            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
            )

            if response.text:
                return response.text.strip()

            return "No summary could be generated."

        except Exception as e:

            error_message = str(e)

            print(
                f"AI summary attempt {attempt + 1} failed: "
                f"{error_message}"
            )

            # Retry temporary service errors
            if "503" in error_message or "UNAVAILABLE" in error_message:

                if attempt < max_retries - 1:

                    time.sleep(2)

                    continue

                return (
                    "AI summary is temporarily unavailable. "
                    "Please try uploading the document again later."
                )

            # Other AI errors
            return (
                "AI summary could not be generated. "
                "Please try again later."
            )

    return "AI summary could not be generated."


def generate_tags(text: str):

    if not text.strip():
        return ""

    prompt = f"""
Read the following document and generate 5 to 10 short, relevant tags.

Rules:
- Return only comma-separated tags.
- No numbering.
- No explanations.
- Keep tags short (1-3 words).

Document:
{text[:10000]}
"""

    try:

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )

        if response.text:
            return response.text.strip()

        return ""

    except Exception as e:

        print(f"AI tag generation failed: {str(e)}")

        return ""


def ask_document(document_text: str, question: str):

    prompt = f"""
You are an AI assistant.

Answer ONLY using the information provided in the document below.

If the answer is not found in the document, reply:
"I couldn't find that information in the document."

Document:
{document_text}

Question:
{question}
"""

    try:

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt
        )

        if response.text:
            return response.text.strip()

        return "I couldn't generate an answer at the moment."

    except Exception as e:

        error_message = str(e)

        print(f"AI document chat failed: {error_message}")

        if "503" in error_message or "UNAVAILABLE" in error_message:

            return (
                "The AI service is temporarily busy. "
                "Please try your question again in a moment."
            )

        return (
            "I couldn't process your question right now. "
            "Please try again later."
        )