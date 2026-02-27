from app import db

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(100), nullable=False)
    company_code = db.Column(db.String(50), nullable=False)
    
    brand_id = db.Column(db.Integer, db.ForeignKey('brands.id'), nullable=False)
    country_id = db.Column(db.Integer, db.ForeignKey('countries.id'), nullable=False)
    
    brand = db.relationship('Brand', backref=db.backref('companies', lazy=True))
    country = db.relationship('Country', backref=db.backref('companies', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'company_name': self.company_name,
            'company_code': self.company_code,
            'brand_id': self.brand_id,
            'country_id': self.country_id,
            'brand': self.brand.to_dict() if self.brand else None,
            'country': self.country.to_dict() if self.country else None
        }
