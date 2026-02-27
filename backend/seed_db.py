"""
Database seed script to populate master data
Run with: python seed_db.py
"""

from app import create_app, db
from app.models.country import Country
from app.models.brand import Brand
from app.models.business_unit import BusinessUnit
from app.models.supplier import Supplier
from app.models.invoice import Invoice, InvoiceItem

def seed_database():
    app = create_app()
    
    with app.app_context():
        # Clear existing data (in reverse order of foreign key dependencies)
        db.session.query(InvoiceItem).delete()
        db.session.query(Invoice).delete()
        db.session.query(Supplier).delete()
        db.session.query(BusinessUnit).delete()
        db.session.query(Brand).delete()
        db.session.query(Country).delete()
        db.session.commit()
        
        # Create countries
        countries_data = [
            ('EG', 'Egypt', 'EGP'),
            ('AE', 'UAE', 'AED'),
            ('BH', 'Bahrain', 'BHD'),
            ('OM', 'Oman', 'OMR'),
            ('KW', 'Kuwait', 'KWD'),
            ('SA', 'KSA', 'SAR'),
            ('JO', 'Jordan', 'JOD'),
            ('LB', 'Lebanon', 'LBP'),
            ('QA', 'Qatar', 'QAR'),
        ]
        
        countries = {}
        for code, name, currency in countries_data:
            country = Country(code=code, name=name, currency=currency)
            db.session.add(country)
            countries[name] = country
        
        db.session.commit()
        
        # Create brands
        brands_data = [
            ('54', 'Decathlon Qatar', 'Qatar'),
            ('54A', 'Decathlon UAE', 'UAE'),
            ('55', 'Urban Outfitters', 'UAE'),
            ('56', 'SEPHORA', 'Qatar'),
        ]
        
        brands = {}
        for code, name, country_name in brands_data:
            brand = Brand(
                code=code,
                name=name,
                country_id=countries[country_name].id
            )
            db.session.add(brand)
            brands[(name, country_name)] = brand
        
        db.session.commit()
        
        # Create business units (MCUs)
        business_units_data = [
            ('06DCTL01', 'Decathlon Villagio', 'Decathlon Qatar', 'Qatar'),
            ('06DCTL02', 'Decathlon City Center', 'Decathlon Qatar', 'Qatar'),
            ('07DCTL01', 'Decathlon Dubai Mall', 'Decathlon UAE', 'UAE'),
        ]
        
        for code, name, brand_name, country_name in business_units_data:
            bu = BusinessUnit(
                code=code,
                name=name,
                brand_id=brands[(brand_name, country_name)].id
            )
            db.session.add(bu)
        
        db.session.commit()
        
        # Create suppliers
        suppliers_data = [
            ('5432', 'QNITED', 'Qatar', 'Decathlon Qatar', 'Qatar'),
            ('5433', 'Global Traders', 'Qatar', 'Decathlon Qatar', 'Qatar'),
            ('5500', 'Fashion Plus', 'UAE', 'Urban Outfitters', 'UAE'),
            ('5600', 'Beauty Supplies', 'Qatar', 'SEPHORA', 'Qatar'),
        ]
        
        for code, name, country_name, brand_name, brand_country in suppliers_data:
            supplier = Supplier(
                code=code,
                name=name,
                country_id=countries[country_name].id,
                brand_id=brands[(brand_name, brand_country)].id if brand_name else None
            )
            db.session.add(supplier)
        
        db.session.commit()
        
        print("✅ Database seeded successfully!")
        print(f"  - Created {len(countries)} countries")
        print(f"  - Created {len(brands)} brands")
        print(f"  - Created {len(business_units_data)} business units")
        print(f"  - Created {len(suppliers_data)} suppliers")

if __name__ == '__main__':
    seed_database()
