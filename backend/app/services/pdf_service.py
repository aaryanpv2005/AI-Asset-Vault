import pypdf

def extract_text_from_pdf(file_path: str) -> str:
    """Safely extracts text from a PDF file using pypdf."""
    extracted_text = ""
    try:
        reader = pypdf.PdfReader(file_path)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                extracted_text += page_text + "\n"
        return extracted_text.strip()
    except Exception as e:
        print("Error extracting text from PDF:", repr(e))
        return ""