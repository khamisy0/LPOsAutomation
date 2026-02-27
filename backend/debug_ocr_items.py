from app import create_app, db
from app.models.invoice import Invoice, InvoiceItem

def debug_invoice():
    app = create_app()
    with app.app_context():
        invoice = Invoice.query.order_by(Invoice.id.desc()).first()
        if not invoice:
            print("No invoices found.")
            return
            
        print(f"--- Invoice ID: {invoice.id} ---")
        print(f"Extracted Number: '{invoice.invoice_number}'")
        print(f"Extracted Amount: '{invoice.total_amount}'")
        print(f"File Path: '{invoice.invoice_file_path}'")
        
        print("\n--- RAW OCR TEXT ---")
        # Raw text is not stored in the model's to_dict but it is in the ocr_data temporarily.
        # However, we don't store it in the DB. 
        # I'll check if I can re-run OCR on the file or if I added it to the model.
        # Looking at models/invoice.py... it doesn't have a raw_text field.
        # I'll re-run OCR on the file path.
        from app.services.ocr_service import OCRService
        try:
            # Handle relative path if necessary
            path = invoice.invoice_file_path
            if path.startswith('./'):
                import os
                path = os.path.join(os.getcwd(), path[2:])
            
            data = OCRService.extract_invoice_data(path)
            print(data.get('raw_text', 'No text extracted'))
        except Exception as e:
            print(f"Error re-running OCR: {e}")

        print("\n--- ITEMS ---")
        for item in invoice.items:
            print(f" - SKU/Model: {item.color_size}, Barcode: '{item.barcode}', Qty: {item.quantity}, Retail: {item.unit_retail}")

if __name__ == "__main__":
    debug_invoice()
