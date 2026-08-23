import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize client safely
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


def _extract_response_text(response) -> str:
    """Helper to safely extract text whether response is a dict, string, or object."""
    if not response:
        return ""
    if isinstance(response, dict):
        return str(response.get("text", "")) or str(response)
    if hasattr(response, "text"):
        return str(response.text or "")
    return str(response)


def generate_summary(text: str) -> str:
    if not client or not text.strip():
        return "Summary unavailable."
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Provide a concise summary of the following text:\n\n{text[:4000]}"
        )
        return _extract_response_text(response) or "No summary generated."
    except Exception as e:
        print("AI Summary Error:", repr(e))
        return "Failed to generate summary."


def generate_tags(text: str) -> list[str]:
    if not client or not text.strip():
        return ["Document"]
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Extract 3 to 5 relevant short tags (comma-separated) for this text:\n\n{text[:4000]}"
        )
        raw_tags = _extract_response_text(response)
        if raw_tags:
            return [tag.strip() for tag in raw_tags.split(",") if tag.strip()]
        return ["Document"]
    except Exception as e:
        print("AI Tags Error:", repr(e))
        return ["Document"]


def ask_document(document_text: str, question: str) -> str:
    if not client or not document_text.strip():
        return "AI chat is currently unavailable."
    try:
        prompt = f"Based on this document context:\n{document_text[:6000]}\n\nAnswer this question: {question}"
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        return _extract_response_text(response) or "No response generated."
    except Exception as e:
        print("AI Chat Error:", repr(e))
        return "Failed to process question."