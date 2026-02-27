from app import db

class Country(db.Model):
    __tablename__ = 'countries'
    
    id = db.Column(db.Integer, primary_key=True)
    country_name = db.Column(db.String(100), unique=True, nullable=False)
    # Relationships
    # brands relationship removed as it is not supported in global brand schema without link table
    # suppliers, companies, business_units backrefs are defined in their respective models

    # Suppliers, Companies etc link to Country.
    # So backrefs will be defined there.
    
    def to_dict(self):
        return {
            'id': self.id,
            'country_name': self.country_name,
            'name': self.country_name  # Frontend compat
        }
