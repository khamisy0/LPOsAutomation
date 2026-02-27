from app import create_app, db
# Import models to ensure they are registered for create_all
from app.models.country import Country
from app.models.brand import Brand
from app.models.company import Company
from app.models.supplier import Supplier
from app.models.business_unit import BusinessUnit
from app.models.invoice import Invoice, InvoiceItem
from app.models.user import User

from import_master_data import import_master_data
from create_test_user import create_test_user

def rebuild_database():
    print("WARNING: This will DROP ALL DATA and REBUILD the database.")
    
    app = create_app()
    with app.app_context():
        # Drop known blocking tables that might not be in models or have circular deps
        from sqlalchemy import text
        with db.engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS invoice_files CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS extracted_invoice_data CASCADE"))
            conn.execute(text("DROP TABLE IF EXISTS export_logs CASCADE"))
            # Legacy table drop
            conn.execute(text("DROP TABLE IF EXISTS invoice_items CASCADE"))
            # New schema table drop (just in case)
            conn.execute(text("DROP TABLE IF EXISTS invoice_line_items CASCADE"))
            conn.commit()

        # Drop all tables managed by SQLAlchemy
        db.drop_all()
        print("Dropped all tables.")
        
        # Create all tables
        db.create_all()
        print("Created all tables with new schema.")
        
    # Import Master Data (creates its own app context)
    import_master_data()
    
    # Create Test User (creates its own app context)
    create_test_user()

if __name__ == '__main__':
    rebuild_database()
