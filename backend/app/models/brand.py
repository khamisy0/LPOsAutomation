from app import db

class Brand(db.Model):
    __tablename__ = 'brands'
    
    id = db.Column(db.Integer, primary_key=True)
    brand_name = db.Column(db.String(100), nullable=False)
    brand_code = db.Column(db.String(50), nullable=False, unique=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'brand_name': self.brand_name,
            'brand_code': self.brand_code,
            'name': self.brand_name, # Frontend compat
            'code': self.brand_code  # Frontend compat
        }
