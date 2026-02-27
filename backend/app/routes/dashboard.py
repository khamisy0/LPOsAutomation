from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.invoice import Invoice
from app.models.user import User
from app import db
from datetime import datetime, timedelta

bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        # Total invoices processed
        total_invoices = Invoice.query.count()
        
        # Invoices this month
        today = datetime.utcnow().date()
        first_day_of_month = today.replace(day=1)
        invoices_this_month = Invoice.query.filter(
            db.func.DATE(Invoice.created_at) >= first_day_of_month
        ).count()
        
        # Invoices pending
        invoices_pending = Invoice.query.filter_by(status='pending').count()
        
        # Last processed invoice date
        last_invoice = Invoice.query.order_by(Invoice.created_at.desc()).first()
        last_processed_date = last_invoice.created_at.isoformat() if last_invoice else None
        
        # Total amount processed this month
        total_amount_month = db.session.query(db.func.sum(Invoice.total_amount)).filter(
            db.func.DATE(Invoice.created_at) >= first_day_of_month
        ).scalar() or 0
        
        return jsonify({
            'total_invoices': total_invoices,
            'invoices_this_month': invoices_this_month,
            'invoices_pending': invoices_pending,
            'last_processed_date': last_processed_date,
            'total_amount_month': float(total_amount_month)
        }), 200
    
    except Exception as e:
        return jsonify({'message': f'Error fetching stats: {str(e)}'}), 500
