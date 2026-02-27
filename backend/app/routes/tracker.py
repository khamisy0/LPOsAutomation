from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.lpo_tracker import LPOTracker
from app.models.invoice import Invoice
from app.services.tracker_service import TrackerService

bp = Blueprint('tracker', __name__, url_prefix='/api/tracker')

@bp.route('/add', methods=['POST'])
@jwt_required()
def add_to_tracker():
    """Add an invoice to the tracker"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        invoice_id = data.get('invoice_id')
        if not invoice_id:
            return jsonify({'message': 'invoice_id is required'}), 400
        
        # Verify invoice belongs to user
        invoice = Invoice.query.filter_by(id=invoice_id, user_id=user_id).first()
        if not invoice:
            return jsonify({'message': 'Invoice not found'}), 404
        
        # Add to tracker
        tracker = TrackerService.add_to_tracker(invoice_id, data)
        
        return jsonify({
            'message': 'Successfully added to tracker',
            'tracker': tracker.to_dict()
        }), 201
    
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        print(f"[ERROR] Failed to add to tracker: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

@bp.route('/invoice/<int:invoice_id>', methods=['GET'])
@jwt_required()
def get_tracker_by_invoice(invoice_id):
    """Get tracker record for an invoice"""
    try:
        user_id = int(get_jwt_identity())
        
        # Verify invoice belongs to user
        invoice = Invoice.query.filter_by(id=invoice_id, user_id=user_id).first()
        if not invoice:
            return jsonify({'message': 'Invoice not found'}), 404
        
        tracker = TrackerService.get_tracker_by_invoice(invoice_id)
        
        if not tracker:
            return jsonify({'tracker': None}), 200
        
        return jsonify({'tracker': tracker.to_dict()}), 200
    
    except Exception as e:
        print(f"[ERROR] Failed to get tracker: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

@bp.route('/country/<int:country_id>', methods=['GET'])
@jwt_required()
def get_trackers_by_country(country_id):
    """Get all trackers for a country, grouped by BU"""
    try:
        user_id = int(get_jwt_identity())
        
        # Get all trackers for this country
        trackers = TrackerService.get_trackers_by_country_and_bu(country_id)
        
        # Group by BU
        bu_groups = {}
        for tracker in trackers:
            bu_id = tracker.bu_id
            if bu_id not in bu_groups:
                bu_groups[bu_id] = {
                    'bu': tracker.business_unit.to_dict() if tracker.business_unit else None,
                    'trackers': []
                }
            bu_groups[bu_id]['trackers'].append(tracker.to_dict())
        
        return jsonify({
            'country_id': country_id,
            'business_units': list(bu_groups.values())
        }), 200
    
    except Exception as e:
        print(f"[ERROR] Failed to get trackers by country: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

@bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_trackers():
    """Get all trackers organized by country and BU"""
    try:
        user_id = int(get_jwt_identity())
        
        countries_data = TrackerService.get_all_countries_with_trackers()
        
        # Format response
        result = []
        for country_id, country_info in countries_data.items():
            country = country_info['country']
            bus_list = []
            
            for bu_id, bu_info in country_info['bus'].items():
                bu = bu_info['bu']
                trackers = bu_info['trackers']
                
                bus_list.append({
                    'bu': bu.to_dict() if bu else None,
                    'trackers': [t.to_dict() for t in trackers]
                })
            
            result.append({
                'country': country.to_dict() if country else None,
                'business_units': bus_list
            })
        
        return jsonify({'data': result}), 200
    
    except Exception as e:
        print(f"[ERROR] Failed to get all trackers: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

@bp.route('/<int:tracker_id>', methods=['PATCH'])
@jwt_required()
def update_tracker(tracker_id):
    """Update tracker record"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        # Verify tracker exists and belongs to user
        tracker = LPOTracker.query.get(tracker_id)
        if not tracker:
            return jsonify({'message': 'Tracker not found'}), 404
        
        # Verify invoice belongs to user
        invoice = Invoice.query.filter_by(id=tracker.invoice_id, user_id=user_id).first()
        if not invoice:
            return jsonify({'message': 'Unauthorized'}), 403
        
        # Update tracker
        updated_tracker = TrackerService.update_tracker(tracker_id, data)
        
        return jsonify({
            'message': 'Tracker updated successfully',
            'tracker': updated_tracker.to_dict()
        }), 200
    
    except Exception as e:
        print(f"[ERROR] Failed to update tracker: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500

@bp.route('/<int:tracker_id>', methods=['DELETE'])
@jwt_required()
def delete_tracker(tracker_id):
    """Delete tracker record"""
    try:
        user_id = int(get_jwt_identity())
        
        # Verify tracker exists and belongs to user
        tracker = LPOTracker.query.get(tracker_id)
        if not tracker:
            return jsonify({'message': 'Tracker not found'}), 404
        
        # Verify invoice belongs to user
        invoice = Invoice.query.filter_by(id=tracker.invoice_id, user_id=user_id).first()
        if not invoice:
            return jsonify({'message': 'Unauthorized'}), 403
        
        # Delete tracker
        TrackerService.delete_tracker(tracker_id)
        
        return jsonify({'message': 'Tracker deleted successfully'}), 200
    
    except Exception as e:
        print(f"[ERROR] Failed to delete tracker: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500
