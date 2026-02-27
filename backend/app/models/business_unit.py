from app import db

class BusinessUnit(db.Model):
    __tablename__ = 'business_units'
    
    id = db.Column(db.Integer, primary_key=True)
    bu_code = db.Column(db.String(50), nullable=False)
    store_name = db.Column(db.String(100), nullable=False)
    
    brand_id = db.Column(db.Integer, db.ForeignKey('brands.id'), nullable=False)
    country_id = db.Column(db.Integer, db.ForeignKey('countries.id'), nullable=False)
    
    brand = db.relationship('Brand', backref=db.backref('business_units', lazy=True))
    country = db.relationship('Country', backref=db.backref('business_units', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'bu_code': self.bu_code,
            'store_name': self.store_name,
            'code': self.bu_code,    # Frontend compat
            'name': self.store_name, # Frontend compat
            'brand_id': self.brand_id,
            'country_id': self.country_id,
            'brand': self.brand.to_dict() if self.brand else None,
            'country': self.country.to_dict() if self.country else None
        }
