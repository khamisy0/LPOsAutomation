from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.country import Country
from app.models.brand import Brand
from app.models.business_unit import BusinessUnit
from app.models.supplier import Supplier

bp = Blueprint('master_data', __name__, url_prefix='/api/master')

@bp.route('/countries', methods=['GET'])
def get_countries():
    """Get list of countries"""
    try:
        countries = Country.query.all()
        return jsonify([c.to_dict() for c in countries]), 200
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500

@bp.route('/brands/<int:country_id>', methods=['GET'])
def get_brands_by_country(country_id):
    """Get brands (Global list, country_id ignored)"""
    try:
        # Brands are now global in new schema
        brands = Brand.query.all()
        return jsonify([b.to_dict() for b in brands]), 200
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500

@bp.route('/business-units/<int:country_id>/<int:brand_id>', methods=['GET'])
def get_business_units(country_id, brand_id):
    """Get business units for a specific country and brand"""
    try:
        units = BusinessUnit.query.filter_by(country_id=country_id, brand_id=brand_id).all()
        return jsonify([u.to_dict() for u in units]), 200
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500

@bp.route('/suppliers/<int:country_id>/<int:brand_id>', methods=['GET'])
def get_suppliers(country_id, brand_id):
    """Get suppliers for country and brand"""
    try:
        suppliers = Supplier.query.filter_by(country_id=country_id, brand_id=brand_id).all()
        return jsonify([s.to_dict() for s in suppliers]), 200
    except Exception as e:
        return jsonify({'message': f'Error: {str(e)}'}), 500
