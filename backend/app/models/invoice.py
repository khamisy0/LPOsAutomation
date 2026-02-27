from app import db
from datetime import datetime

class Invoice(db.Model):
    __tablename__ = 'invoices'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    invoice_number = db.Column(db.String(100))
    invoice_date = db.Column(db.String(8))  # YYYYMMDD format
    
    country_id = db.Column(db.Integer, db.ForeignKey('countries.id'), nullable=False)
    brand_id = db.Column(db.Integer, db.ForeignKey('brands.id'), nullable=False)
    bu_id = db.Column(db.Integer, db.ForeignKey('business_units.id'), nullable=True) # User said bu_id
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=True) # Derived
    
    currency = db.Column(db.String(3))
    
    subtotal = db.Column(db.Float)
    vat = db.Column(db.Float)
    total_amount = db.Column(db.Float)
    
    invoice_file_path = db.Column(db.String(255))
    supporting_file_path = db.Column(db.String(255))
    
    status = db.Column(db.String(20), default='pending')
    
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())
    
    # Relationships
    items = db.relationship('InvoiceItem', backref='invoice', lazy=True, cascade='all, delete-orphan')
    
    country = db.relationship('Country', backref='invoices', lazy=True)
    brand = db.relationship('Brand', backref='invoices', lazy=True)
    business_unit = db.relationship('BusinessUnit', backref='invoices', lazy=True)
    supplier = db.relationship('Supplier', backref='invoices', lazy=True)
    company = db.relationship('Company', backref='invoices', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'invoice_date': self.invoice_date,
            'country_id': self.country_id,
            'brand_id': self.brand_id,
            'bu_id': self.bu_id,
            'business_unit': self.business_unit.to_dict() if self.business_unit else None,
            'supplier_id': self.supplier_id,
            'supplier': self.supplier.to_dict() if self.supplier else None,
            'company_id': self.company_id,
            'company': self.company.to_dict() if self.company else None,
            'currency': self.currency,
            'subtotal': self.subtotal,
            'vat': self.vat,
            'total_amount': self.total_amount,
            
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'items': [item.to_dict() for item in self.items]
        }

class InvoiceItem(db.Model):
    __tablename__ = 'invoice_line_items'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=False)
    
    itemcode = db.Column(db.String(50))
    barcode = db.Column(db.String(100))
    quantity = db.Column(db.Float)
    unit_cost = db.Column(db.Float)
    unit_retail = db.Column(db.Float)
    color_size = db.Column(db.String(50))
    season = db.Column(db.String(10))
    
    # IM Creation fields
    item_description = db.Column(db.String(255))
    mancode = db.Column(db.String(100))  # Model entered by user
    brand_code = db.Column(db.String(50))  # From brand table
    supplier_code = db.Column(db.String(50))  # From supplier table
    section = db.Column(db.String(100))  # From Excel
    family = db.Column(db.String(100))  # From Excel
    subfamily = db.Column(db.String(100))  # From Excel
    alternate_code = db.Column(db.String(100))  # Decathlon SKU from Excel
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'itemcode': self.itemcode,
            'barcode': self.barcode,
            'quantity': self.quantity,
            'unit_cost': self.unit_cost,
            'unit_retail': self.unit_retail,
            'color_size': self.color_size,
            'season': self.season,
            'item_description': self.item_description,
            'mancode': self.mancode,
            'brand_code': self.brand_code,
            'supplier_code': self.supplier_code,
            'section': self.section,
            'family': self.family,
            'subfamily': self.subfamily,
            'alternate_code': self.alternate_code
        }
