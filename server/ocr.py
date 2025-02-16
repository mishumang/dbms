import sys
import easyocr
import json

def extract_text(image_path):
    reader = easyocr.Reader(['en'])  # Load OCR reader
    result = reader.readtext(image_path)  # Extract text from image
    extracted_text = " ".join([text[1] for text in result])  # Join extracted text
    return extracted_text

if __name__ == "__main__":
    image_path = sys.argv[1]  # Get image path from Node.js
    extracted_text = extract_text(image_path)
    print(json.dumps({"text": extracted_text}))  # Output JSON
