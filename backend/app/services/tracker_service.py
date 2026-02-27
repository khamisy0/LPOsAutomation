from app import db
from app.models.lpo_tracker import LPOTracker
from app.models.business_unit import BusinessUnit
from datetime import datetime

class TrackerService:
    """Service for managing LPO Tracker operations"""
    
    @staticmethod
    def generate_serial_number(bu_id):
        """
        Generate serial number in format: BU_CODE-YY-XXXX
        BU_CODE: Business Unit abbreviation (first 3 letters of bu_code)
        YY: Last 2 digits of current year
        XXXX: Incremental number padded to 4 digits
        """
        try:
            bu = BusinessUnit.query.get(bu_id)
            if not bu:
                raise ValueError(f"Business Unit {bu_id} not found")
            
            # Get BU code abbreviation (first 3 letters, uppercase)
            bu_code = bu.bu_code[:3].upper() if len(bu.bu_code) >= 3 else bu.bu_code.upper()
            
            # Get last 2 digits of current year
            current_year = datetime.now().strftime('%y')
            
            # Count existing trackers for this BU this year
            # Find all trackers for this BU with serial numbers starting with bu_code-current_year
            prefix = f"{bu_code}-{current_year}-"
            existing_count = db.session.query(LPOTracker).filter(
                LPOTracker.bu_id == bu_id,
                LPOTracker.serial_number.like(f"{prefix}%")
            ).count()
            
            # Increment counter
            next_number = existing_count + 1
            serial_number = f"{bu_code}-{current_year}-{str(next_number).zfill(4)}"
            
            return serial_number
        except Exception as e:
            print(f"[ERROR] Failed to generate serial number: {str(e)}")
            raise
    
    @staticmethod
    def add_to_tracker(invoice_id, data):
        """
        Add an invoice to the tracker with provided data
        
        Args:
            invoice_id: Invoice ID to track
            data: Dictionary containing tracker form data
                - date_of_request
                - ticket_no
                - shipment_no
                - shipment_status
                - communicated_with_costing
                - sp_shipment
                - sp_ticket_no (optional, required if sp_shipment is True)
        
        Returns:
            LPOTracker instance
        """
        try:
            from app.models.invoice import Invoice
            
            # Check if already in tracker
            existing = LPOTracker.query.filter_by(invoice_id=invoice_id).first()
            if existing:
                raise ValueError(f"Invoice {invoice_id} is already in the tracker")
            
            # Get invoice details
            invoice = Invoice.query.get(invoice_id)
            if not invoice:
                raise ValueError(f"Invoice {invoice_id} not found")
            
            # Get country and BU from invoice
            country_id = invoice.country_id
            bu_id = invoice.bu_id
            
            if not bu_id:
                raise ValueError("Invoice must have a Business Unit assigned")
            
            # Generate serial number
            serial_number = TrackerService.generate_serial_number(bu_id)
            
            # Create tracker record
            tracker = LPOTracker(
                invoice_id=invoice_id,
                country_id=country_id,
                bu_id=bu_id,
                serial_number=serial_number,
                date_of_request=data.get('date_of_request'),
                ticket_no=data.get('ticket_no'),
                shipment_no=data.get('shipment_no'),
                shipment_status=data.get('shipment_status'),
                communicated_with_costing=data.get('communicated_with_costing', False),
                sp_shipment=data.get('sp_shipment', False),
                sp_ticket_no=data.get('sp_ticket_no') if data.get('sp_shipment') else None
            )
            
            db.session.add(tracker)
            db.session.commit()
            
            return tracker
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Failed to add to tracker: {str(e)}")
            raise
    
    @staticmethod
    def get_trackers_by_country_and_bu(country_id, bu_id=None):
        """
        Get all trackers for a country, optionally filtered by BU
        
        Returns:
            List of LPOTracker instances grouped by BU
        """
        try:
            query = LPOTracker.query.filter_by(country_id=country_id)
            
            if bu_id:
                query = query.filter_by(bu_id=bu_id)
            
            trackers = query.order_by(LPOTracker.serial_number).all()
            return trackers
        except Exception as e:
            print(f"[ERROR] Failed to get trackers: {str(e)}")
            raise
    
    @staticmethod
    def get_all_countries_with_trackers():
        """Get all countries that have trackers, organized by country"""
        try:
            from app.models.country import Country
            
            # Get all unique countries from trackers
            trackers = db.session.query(LPOTracker).all()
            countries_dict = {}
            
            for tracker in trackers:
                country = tracker.country
                if country:
                    if country.id not in countries_dict:
                        countries_dict[country.id] = {
                            'country': country,
                            'bus': {}
                        }
                    
                    # Group by BU within country
                    bu = tracker.business_unit
                    if bu:
                        if bu.id not in countries_dict[country.id]['bus']:
                            countries_dict[country.id]['bus'][bu.id] = {
                                'bu': bu,
                                'trackers': []
                            }
                        countries_dict[country.id]['bus'][bu.id]['trackers'].append(tracker)
            
            return countries_dict
        except Exception as e:
            print(f"[ERROR] Failed to get countries with trackers: {str(e)}")
            raise
    
    @staticmethod
    def update_tracker(tracker_id, data):
        """Update tracker record"""
        try:
            tracker = LPOTracker.query.get(tracker_id)
            if not tracker:
                raise ValueError(f"Tracker {tracker_id} not found")
            
            # Update fields
            if 'date_of_request' in data:
                tracker.date_of_request = data['date_of_request']
            if 'ticket_no' in data:
                tracker.ticket_no = data['ticket_no']
            if 'shipment_no' in data:
                tracker.shipment_no = data['shipment_no']
            if 'shipment_status' in data:
                tracker.shipment_status = data['shipment_status']
            if 'communicated_with_costing' in data:
                tracker.communicated_with_costing = data['communicated_with_costing']
            if 'sp_shipment' in data:
                tracker.sp_shipment = data['sp_shipment']
            if 'sp_ticket_no' in data:
                tracker.sp_ticket_no = data['sp_ticket_no'] if data.get('sp_shipment') else None
            
            db.session.commit()
            return tracker
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Failed to update tracker: {str(e)}")
            raise
    
    @staticmethod
    def delete_tracker(tracker_id):
        """Delete tracker record"""
        try:
            tracker = LPOTracker.query.get(tracker_id)
            if not tracker:
                raise ValueError(f"Tracker {tracker_id} not found")
            
            db.session.delete(tracker)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Failed to delete tracker: {str(e)}")
            raise
    
    @staticmethod
    def get_tracker_by_invoice(invoice_id):
        """Get tracker record by invoice ID"""
        try:
            tracker = LPOTracker.query.filter_by(invoice_id=invoice_id).first()
            return tracker
        except Exception as e:
            print(f"[ERROR] Failed to get tracker by invoice: {str(e)}")
            raise
