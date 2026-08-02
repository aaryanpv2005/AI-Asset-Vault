from app.services.pdf_service import extract_text_from_pdf

text = extract_text_from_pdf("uploads/e1d269e4-64e1-493c-90a3-e3c456c9bcaa.pdf")

print(text)