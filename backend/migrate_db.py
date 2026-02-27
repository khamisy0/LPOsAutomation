from app import create_app, db
from sqlalchemy import text

app = create_app()

def migrate():
    with app.app_context():
        try:
            with db.engine.connect() as conn:
                # Add columns to invoices table
                conn.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS supporting_file_path VARCHAR(255)"))
                conn.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_file_path VARCHAR(255)"))
                
                # Add columns to invoice_line_items table (correct table name)
                conn.execute(text("ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS unit_cost FLOAT"))
                conn.execute(text("ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS unit_retail FLOAT"))
                
                # Add IM Creation fields to invoice_line_items table
                conn.execute(text("ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS item_description VARCHAR(255)"))
                conn.execute(text("ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS mancode VARCHAR(255)"))
                conn.execute(text("ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS brand_code VARCHAR(100)"))
                conn.execute(text("ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS supplier_code VARCHAR(100)"))
                conn.execute(text("ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS section VARCHAR(255)"))
                conn.execute(text("ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS family VARCHAR(255)"))
                conn.execute(text("ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS subfamily VARCHAR(255)"))
                conn.execute(text("ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS alternate_code VARCHAR(255)"))
                
                conn.commit()
                print("Migration successful: Added missing columns if they didn't exist.")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
