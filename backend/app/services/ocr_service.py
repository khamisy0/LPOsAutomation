import pytesseract
from PIL import Image
import pdf2image
import os
from app.utils.ocr_helpers import (
    extract_invoice_number, 
    extract_invoice_date, 
    extract_total_amount
)

# Configure Tesseract Path for Windows if not in PATH
if os.name == 'nt':
    tesseract_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        r'C:\Users\Lenovo\AppData\Local\Tesseract-OCR\tesseract.exe' # User specific
    ]
    
    for path in tesseract_paths:
        if os.path.exists(path):
            print(f"[INFO] Found Tesseract at: {path}")
            pytesseract.pytesseract.tesseract_cmd = path
            break

class OCRService:
    
    @staticmethod
    def extract_text_from_image(image_path):
        """Extract text from image using Tesseract OCR"""
        try:
            from PIL import ImageEnhance, ImageFilter
            
            print(f"[DEBUG] Processing image OCR: {image_path}")
            image = Image.open(image_path)
            
            # Enhance image for better OCR results
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Upscale image if it's too small (improves OCR accuracy)
            width, height = image.size
            if width < 800 or height < 600:
                scale_factor = max(800 / width, 600 / height)
                new_size = (int(width * scale_factor), int(height * scale_factor))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
                print(f"[DEBUG] Image upscaled to {new_size}")
            
            # Apply noise reduction filter
            image = image.filter(ImageFilter.MedianFilter(size=3))
            
            # Enhance contrast
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.8)
            
            # Enhance brightness
            enhancer = ImageEnhance.Brightness(image)
            image = enhancer.enhance(1.05)
            
            # Enhance sharpness
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(2.0)
            
            # Extract text - PSM 6 is good for uniform text blocks
            text = pytesseract.image_to_string(image, config='--psm 6')
            
            print(f"[DEBUG] Extracted text length: {len(text)}")
            if len(text) < 100:
                print(f"[DEBUG] Text preview: {text}")
            else:
                print(f"[DEBUG] Text preview (first 100): {text[:100]}...")
                
            return text
        except Exception as e:
            print(f"[ERROR] OCR Service Error: {str(e)}")
            raise Exception(f"OCR Error: {str(e)}")
    
    @staticmethod
    def extract_text_from_pdf(pdf_path):
        """Extract text from PDF by converting to images with enhanced quality"""
        try:
            from PIL import ImageEnhance, ImageFilter
            
            # Convert PDF pages to images with higher DPI for better OCR
            images = pdf2image.convert_from_path(pdf_path, dpi=300)
            extracted_text = ""
            
            for page_num, image in enumerate(images):
                # Enhance image quality before OCR
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Apply filters
                image = image.filter(ImageFilter.MedianFilter(size=3))
                
                # Enhance contrast
                enhancer = ImageEnhance.Contrast(image)
                image = enhancer.enhance(1.8)
                
                # Enhance brightness
                enhancer = ImageEnhance.Brightness(image)
                image = enhancer.enhance(1.05)
                
                # Enhance sharpness
                enhancer = ImageEnhance.Sharpness(image)
                image = enhancer.enhance(2.0)
                
                # Extract text - PSM 6 works well for most invoices
                text = pytesseract.image_to_string(image, config='--psm 6')
                extracted_text += text + "\n"
                print(f"[DEBUG] PDF Page {page_num + 1}: Extracted {len(text)} characters")
            
            return extracted_text
        except Exception as e:
            raise Exception(f"PDF OCR Error: {str(e)}")
    
    @staticmethod
    def extract_invoice_data(file_path):
        """Main method to extract invoice data from file"""
        file_ext = os.path.splitext(file_path)[1].lower()
        
        try:
            if file_ext == '.pdf':
                text = OCRService.extract_text_from_pdf(file_path)
            elif file_ext in ['.png', '.jpg', '.jpeg']:
                text = OCRService.extract_text_from_image(file_path)
            else:
                raise ValueError(f"Unsupported file format: {file_ext}")
            
            print(f"[DEBUG] ========== RAW OCR TEXT ({file_ext}) ==========")
            print(text)
            print(f"[DEBUG] ========== END RAW OCR TEXT ==========")
            
            # Extract structured data
            invoice_data = {
                'invoice_number': extract_invoice_number(text),
                'invoice_date': extract_invoice_date(text),
                'total_amount': extract_total_amount(text),
                'raw_text': text
            }
            
            print(f"[DEBUG] Extracted Data:")
            print(f"  - Invoice Number: {invoice_data['invoice_number']}")
            print(f"  - Invoice Date: {invoice_data['invoice_date']}")
            print(f"  - Total Amount: {invoice_data['total_amount']}")
            
            return invoice_data
        except Exception as e:
            raise Exception(f"Invoice extraction failed: {str(e)}")
