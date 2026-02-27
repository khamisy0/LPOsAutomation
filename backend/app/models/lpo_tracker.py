from app import db
from datetime import datetime

class LPOTracker(db.Model):
    __tablename__ = 'lpo_trackers'
    
    id = db.Column(db.Integer, primary_key=True)
    invoice_id = db.Column(db.Integer, db.ForeignKey('invoices.id'), nullable=False, unique=True)
    
    # Organizational fields
    country_id = db.Column(db.Integer, db.ForeignKey('countries.id'), nullable=False)
    bu_id = db.Column(db.Integer, db.ForeignKey('business_units.id'), nullable=False)
    
    # Serial number (auto-generated): BU_CODE-YY-XXXX format
    serial_number = db.Column(db.String(50), unique=True, nullable=False)
    
    # Tracker form fields
    date_of_request = db.Column(db.String(10))  # YYYY-MM-DD format
    ticket_no = db.Column(db.String(50))
    shipment_no = db.Column(db.String(50))
    shipment_status = db.Column(db.String(50))
    communicated_with_costing = db.Column(db.Boolean, default=False)
    sp_shipment = db.Column(db.Boolean, default=False)
    sp_ticket_no = db.Column(db.String(50), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())
    
    # Relationships
    invoice = db.relationship('Invoice', backref='tracker', lazy=True)
    country = db.relationship('Country', backref='lpo_trackers', lazy=True)
    business_unit = db.relationship('BusinessUnit', backref='lpo_trackers', lazy=True)
    
    def to_dict(self):
        from app.models.invoice import Invoice
        
        invoice = Invoice.query.get(self.invoice_id)
        items = invoice.items if invoice else []
        
        return {
            'id': self.id,
            'invoice_id': self.invoice_id,
            'serial_number': self.serial_number,
            'country_id': self.country_id,
            'bu_id': self.bu_id,
            'business_unit': self.business_unit.to_dict() if self.business_unit else None,
            'country': self.country.to_dict() if self.country else None,
            
            # Invoice details for display
            'invoice_number': invoice.invoice_number if invoice else None,
            'invoice_date': invoice.invoice_date if invoice else None,
            'total_amount': invoice.total_amount if invoice else None,
            'invoice_file_path': invoice.invoice_file_path if invoice else None,
            'supporting_file_path': invoice.supporting_file_path if invoice else None,
            
            # Calculate total quantity from items
            'total_quantity_received': sum(item.quantity for item in items) if items else 0,
            
            # Tracker fields
            'date_of_request': self.date_of_request,
            'ticket_no': self.ticket_no,
            'shipment_no': self.shipment_no,
            'shipment_status': self.shipment_status,
            'communicated_with_costing': self.communicated_with_costing,
            'sp_shipment': self.sp_shipment,
            'sp_ticket_no': self.sp_ticket_no,
            
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
