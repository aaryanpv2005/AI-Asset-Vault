import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def generate_summary(text: str) -> str:
    if not text.strip():
        return "No readable text found in the document."

    prompt = f"""
Summarize the following document in 5-8 concise bullet points.

{text}
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash", 
            contents=prompt,
        )

        return response.text

    except Exception as e:
        return f"AI Error: {str(e)}"

def generate_tags(text: str):
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

    response = client.models.generate_content(
        model="gemini-3.6-flash", 
        contents=prompt
    )

    return response.text.strip()
    
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

    response = client.models.generate_content(
        model="gemini-3.6-flash", 
        contents=prompt
    )

    return response.text