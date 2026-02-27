from app import create_app, db
from app.models.invoice import Invoice, InvoiceItem
from app.models.company import Company

def inspect_last():
    app = create_app()
    with app.app_context():
        invoice = Invoice.query.order_by(Invoice.id.desc()).first()
        if not invoice:
            print("No invoices found.")
            return
            
        print(f"--- Invoice ID: {invoice.id} ---")
        print(f"Number: {invoice.invoice_number}")
        print(f"Date: {invoice.invoice_date}")
        print(f"Amount: {invoice.total_amount}")
        print(f"File Path: {invoice.invoice_file_path}")
        
        print(f"Company ID: {invoice.company_id}")
        if invoice.company:
            print(f"Company: {invoice.company.company_name} (Code: {invoice.company.company_code})")
        else:
            print("Company: None")
            
        print(f"Country ID: {invoice.country_id}")
        print(f"Brand ID: {invoice.brand_id}")
        print(f"BU ID: {invoice.bu_id}")
        
        print(f"--- Items ({len(invoice.items)}) ---")
        for item in invoice.items[:5]:
            print(f" - SKU: {item.color_size} (derived?), Barcode: {item.barcode}, Cost: {item.unit_cost}, Retail: {item.unit_retail}")

if __name__ == "__main__":
    inspect_last()
