from app import create_app, db
from app.models.country import Country
from app.models.brand import Brand
from app.models.supplier import Supplier
from app.models.business_unit import BusinessUnit
from app.models.company import Company

def check_data():
    app = create_app()
    with app.app_context():
        print("\n--- COUNTRIES ---")
        countries = Country.query.all()
        for c in countries:
            print(f"ID: {c.id}, Name: {c.country_name}")

        print("\n--- BRANDS ---")
        brands = Brand.query.all()
        for b in brands:
            print(f"ID: {b.id}, Name: {b.brand_name}")
            
        print("\n--- SUPPLIERS (Sample 20) ---")
        suppliers = Supplier.query.limit(20).all()
        for s in suppliers:
             print(f"ID: {s.id}, Name: {s.supplier_name}, CountryID: {s.country_id}, BrandID: {s.brand_id}")
             
        print("\n--- CHECK: Suppliers for Country 'Qatar' and Brand 'Decathlon' ---")
        # Find Qatar ID
        qatar = Country.query.filter_by(country_name='Qatar').first()
        decathlon = Brand.query.filter(Brand.brand_name.ilike('%Decathlon%')).first()
        
        if qatar and decathlon:
            print(f"Qatar ID: {qatar.id}, Decathlon ID: {decathlon.id}")
            sups = Supplier.query.filter_by(country_id=qatar.id, brand_id=decathlon.id).all()
            print(f"Found {len(sups)} suppliers.")
            for s in sups:
                print(f" - {s.supplier_name}")
        else:
            print(f"Could not find Qatar or Decathlon. Qatar: {qatar}, Decathlon: {decathlon}")

        print("\n--- CHECK: Suppliers for Country 'UAE' and Brand 'Decathlon' ---")
        uae = Country.query.filter_by(country_name='UAE').first()
        if uae and decathlon:
             sups = Supplier.query.filter_by(country_id=uae.id, brand_id=decathlon.id).all()
             print(f"Found {len(sups)} suppliers in UAE.")


if __name__ == "__main__":
    check_data()
