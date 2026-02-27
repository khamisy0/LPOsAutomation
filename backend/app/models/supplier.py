from app import db

class Supplier(db.Model):
    __tablename__ = 'suppliers'
    
    id = db.Column(db.Integer, primary_key=True)
    supplier_name = db.Column(db.String(100), nullable=False)
    supplier_code = db.Column(db.String(50), nullable=False)
    supplier_address = db.Column(db.String(255))
    
    brand_id = db.Column(db.Integer, db.ForeignKey('brands.id'), nullable=False)
    country_id = db.Column(db.Integer, db.ForeignKey('countries.id'), nullable=False)
    
    brand = db.relationship('Brand', backref=db.backref('suppliers', lazy=True))
    country = db.relationship('Country', backref=db.backref('suppliers', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'supplier_name': self.supplier_name,
            'supplier_code': self.supplier_code,
            'name': self.supplier_name, # Frontend compat
            'code': self.supplier_code, # Frontend compat
            'supplier_address': self.supplier_address,
            'brand_id': self.brand_id,
            'country_id': self.country_id,
            'brand': self.brand.to_dict() if self.brand else None,
            'country': self.country.to_dict() if self.country else None
        }
