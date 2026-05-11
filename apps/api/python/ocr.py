import sys
import os
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')

try:
    import easyocr
except ImportError:
    print("Error: easyocr not installed properly.", file=sys.stderr)
    sys.exit(1)

try:
    import pypdfium2 as pdfium
except ImportError:
    pdfium = None # Graceful fallback, though it should be installed

def extract_text_from_image(reader, image_source):
    results = reader.readtext(
        image_source,
        beamWidth=10,
        contrast_ths=0.1,
        adjust_contrast=0.7,
        min_size=2,
        paragraph=False,
        workers=0
    )
    lines = []
    for (bbox, text, prob) in results:
        lines.append(text)
    return lines

def main():
    if len(sys.argv) < 2:
        print("Error: Missing file path argument.", file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}", file=sys.stderr)
        sys.exit(1)

    is_pdf = file_path.lower().endswith(".pdf")
    
    try:
        reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        
        all_text_lines = []

        if is_pdf:
            if not pdfium:
                print("OCR Exception: pypdfium2 library not installed to support PDF ingestion.", file=sys.stderr)
                sys.exit(1)
            
            pdf = pdfium.PdfDocument(file_path)
            max_pages = int(os.getenv("PDF_MAX_PAGES", "5"))
            process_pages = min(len(pdf), max_pages) 
            
            for i in range(process_pages):
                page = pdf.get_page(i)
                bitmap = page.render(scale=2)
                pil_image = bitmap.to_pil()
                
                np_img = np.array(pil_image)
                
                page_lines = extract_text_from_image(reader, np_img)
                all_text_lines.extend(page_lines)
                
                bitmap.close()
            pdf.close()
            
        else:
            # Standard ingestion pipeline for standalone images (jpeg, png)
            all_text_lines = extract_text_from_image(reader, file_path)

        if not all_text_lines:
            print("")
            return

        final_text = " ".join(all_text_lines)
        print(final_text.strip())

    except Exception as e:
        print(f"OCR Exception: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
