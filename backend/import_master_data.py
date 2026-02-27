import openpyxl
import os
from app import create_app, db
from app.models.country import Country
from app.models.brand import Brand
from app.models.company import Company
from app.models.supplier import Supplier
from app.models.business_unit import BusinessUnit
from app.models.invoice import Invoice # To ensure it is loaded if needed

DATA_DIR = r"C:\Users\Lenovo\Desktop\Projects\LPOs Automation\excel-sheets-dbupload"

def read_excel(filename):
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        print(f"[WARN] File not found: {path}")
        return []
    
    wb = openpyxl.load_workbook(path)
    sheet = wb.active
    rows = list(sheet.iter_rows(values_only=True))
    header = rows[0]
    data = []
    for row in rows[1:]:
        if not any(row): continue # Skip empty rows
        # Create dict using header
        # Normalize header: trim, lower? Users headers seem clean e.g. 'brand_name'
        row_dict = {}
        for i, h in enumerate(header):
            if h:
                row_dict[str(h).strip()] = row[i]
        data.append(row_dict)
    return data

def import_master_data():
    app = create_app()
    with app.app_context():
        print("--- Starting Master Data Import ---")
        
        # Files
        brands_data = read_excel("Brands Sheet.xlsx")
        suppliers_data = read_excel("Suppliers Sheet.xlsx")
        bu_data = read_excel("Business Units Sheet.xlsx")
        companies_data = read_excel("Companies Sheet.xlsx")
        
        # 1. Harvest Countries
        print("Step 1: Extracting Countries...")
        country_names = set()
        
        # From Suppliers
        for row in suppliers_data:
            c = row.get('country_name') or row.get('Country')
            if c: country_names.add(str(c).strip())
            
        # From Companies
        for row in companies_data:
            c = row.get('country_name') or row.get('Country')
            if c: country_names.add(str(c).strip())
            
        # From BUs
        for row in bu_data:
            c = row.get('country_name') or row.get('Country')
            if c: country_names.add(str(c).strip())
            
        print(f"Found {len(country_names)} unique countries: {country_names}")
        
        # Insert Countries
        for name in country_names:
            if not Country.query.filter_by(country_name=name).first():
                db.session.add(Country(country_name=name))
        db.session.commit()
        
        # Build Country Map
        country_map = {c.country_name: c.id for c in Country.query.all()}
        
        # 2. Brands
        print("Step 2: Importing Brands...")
        for row in brands_data:
            name = row.get('brand_name') or row.get('Brand')
            code = row.get('brand_code') or row.get('BrandCode')
            if name and code:
                name = str(name).strip()
                code = str(code).strip()
                if not Brand.query.filter_by(brand_code=code).first():
                    db.session.add(Brand(brand_name=name, brand_code=code))
        db.session.commit()
        
        # Build Brand Map
        brand_map = {b.brand_name: b.id for b in Brand.query.all()} # Access by Name
        
        # 3. Companies
        print("Step 3: Importing Companies...")
        for row in companies_data:
            brand_name = str(row.get('brand_name') or row.get('Brand')).strip()
            country_name = str(row.get('country_name') or row.get('Country')).strip()
            comp_name = row.get('company_name') or row.get('CompanyName')
            comp_code = row.get('company_code') or row.get('CompanyCode')
            
            b_id = brand_map.get(brand_name)
            c_id = country_map.get(country_name)
            
            if b_id and c_id and comp_name and comp_code:
                 if not Company.query.filter_by(company_code=str(comp_code).strip()).first():
                     db.session.add(Company(
                         company_name=str(comp_name).strip(),
                         company_code=str(comp_code).strip(),
                         brand_id=b_id,
                         country_id=c_id
                     ))
            else:
                print(f"[WARN] Skipping Company: {comp_name}. Missing dependencies (Brand: {brand_name}->{b_id}, Country: {country_name}->{c_id})")
        db.session.commit()

        # 4. Suppliers
        print("Step 4: Importing Suppliers...")
        for row in suppliers_data:
            brand_name = str(row.get('brand_name') or row.get('Brand')).strip()
            country_name = str(row.get('country_name') or row.get('Country')).strip()
            name = row.get('supplier_name') or row.get('Supplier')
            code = row.get('supplier_code') or row.get('SupplierCode')
            addr = row.get('supplier_address') or row.get('SupplierAddress')
            
            b_id = brand_map.get(brand_name)
            c_id = country_map.get(country_name)
            
            if b_id and c_id and name and code:
                # Check if exists for THIS Country/Brand
                if not Supplier.query.filter_by(supplier_code=str(code).strip(), country_id=c_id).first():
                    db.session.add(Supplier(
                        supplier_name=str(name).strip(),
                        supplier_code=str(code).strip(),
                        supplier_address=str(addr).strip() if addr else None,
                        brand_id=b_id,
                        country_id=c_id
                    ))
                else:
                    print(f"[INFO] Skipping Supplier: {name} (Code: {code}) for Country ID {c_id}. Already exists.")
            else:
                 print(f"[WARN] Skipping Supplier: {name}. Missing dependencies. Brand: '{brand_name}' -> {b_id}, Country: '{country_name}' -> {c_id}, Code: {code}")
        db.session.commit()

        # 5. Business Units
        print("Step 5: Importing Business Units...")
        for row in bu_data:
            brand_name = str(row.get('brand_name') or row.get('Brand')).strip()
            country_name = str(row.get('country_name') or row.get('Country')).strip()
            store_name = row.get('store_name') or row.get('Store')
            bu_code = row.get('bu_code') or row.get('BUCode')
            
            b_id = brand_map.get(brand_name)
            c_id = country_map.get(country_name)
            
            if b_id and c_id and store_name and bu_code:
                if not BusinessUnit.query.filter_by(bu_code=str(bu_code).strip(), country_id=c_id).first():
                    db.session.add(BusinessUnit(
                        store_name=str(store_name).strip(),
                        bu_code=str(bu_code).strip(),
                        brand_id=b_id,
                        country_id=c_id
                    ))
            else:
                print(f"[WARN] Skipping BU: {store_name}. Missing dependencies.")
        db.session.commit()
        
        print("✅ Master Data Import Completed!")

if __name__ == "__main__":
    import_master_data()
