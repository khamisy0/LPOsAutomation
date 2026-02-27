from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.invoice import Invoice, InvoiceItem
from app.models.user import User
from app.models.supplier import Supplier
from app.models.brand import Brand
from app.models.company import Company
from app.services.ocr_service import OCRService
from app.services.excel_service import ExcelService
from app.utils.file_handlers import save_uploaded_file, get_file_extension
from app.utils.ocr_helpers import generate_itemcode
import os
import io
import json

bp = Blueprint('invoice', __name__, url_prefix='/api/invoices')

@bp.route('', methods=['POST'])
@jwt_required()
def upload_invoice():
    """Upload invoice and supporting files"""
    try:
        user_id = int(get_jwt_identity())
        print(f"[DEBUG] User ID from JWT: {user_id}")
        print(f"[DEBUG] Request files: {list(request.files.keys())}")
        print(f"[DEBUG] Request form: {dict(request.form)}")
    except Exception as e:
        print(f"[ERROR] JWT or request parsing error: {str(e)}")
        return jsonify({'message': f'Authentication error: {str(e)}'}), 422
    except Exception as e:
        print(f"[ERROR] JWT or request parsing error: {str(e)}")
        return jsonify({'message': f'Authentication error: {str(e)}'}), 422
    
    # Validate request
    if 'invoice_file' not in request.files or 'supporting_file' not in request.files:
        print(f"[ERROR] Missing files. Files present: {list(request.files.keys())}")
        return jsonify({'message': 'Missing invoice or supporting file'}), 400
    
    # Extract form data
    country_id = request.form.get('country_id')
    brand_id = request.form.get('brand_id')
    business_unit_id = request.form.get('business_unit_id')
    supplier_id = request.form.get('supplier_id')
    decathlon_data = request.form.get('decathlon_data')  # JSON string for Decathlon products
    
    if not all([country_id, brand_id, business_unit_id, supplier_id]):
        return jsonify({'message': 'Missing required fields'}), 400
    
    try:
        # Save files
        invoice_file = request.files['invoice_file']
        supporting_file = request.files['supporting_file']
        
        invoice_path = save_uploaded_file(invoice_file, current_app.config['UPLOAD_FOLDER'])
        supporting_path = save_uploaded_file(supporting_file, current_app.config['UPLOAD_FOLDER'])
        
        if not invoice_path or not supporting_path:
            return jsonify({'message': 'File upload failed'}), 400
        
        # Extract invoice data via OCR (if Tesseract is available)
        ocr_data = {
            'invoice_number': None,
            'invoice_date': None,
            'total_amount': None,
        }
        try:
            ocr_data = OCRService.extract_invoice_data(invoice_path)
        except Exception as ocr_err:
            # OCR failed, but we can still process the invoice
            print(f"OCR warning: {str(ocr_err)}")
            # Use defaults or let user enter manually later
        
        # Get supplier details for Itemcode generation
        supplier = Supplier.query.get(int(supplier_id))
        if not supplier:
             return jsonify({'message': 'Supplier not found'}), 400
             
        supplier_code = supplier.supplier_code if supplier.supplier_code else '0000'
        
        # Get brand details for IM fields
        brand = Brand.query.get(int(brand_id))
        brand_code = brand.brand_code if brand else ''
        
        # Get invoice items from either supporting file or decathlon_data
        excel_data = []
        try:
            excel_data = ExcelService.read_supporting_excel(supporting_path)
        except:
            # If Excel reading fails, use decathlon_data from form
            if decathlon_data:
                try:
                    excel_data = json.loads(decathlon_data)
                except:
                    excel_data = []
        
        # If still no data, use decathlon_data from form
        if not excel_data and decathlon_data:
            try:
                excel_data = json.loads(decathlon_data)
            except:
                excel_data = []
        
        # Create invoice record
        invoice = Invoice(
            user_id=user_id,
            invoice_number=ocr_data.get('invoice_number'),
            invoice_date=ocr_data.get('invoice_date'),
            total_amount=ocr_data.get('total_amount'),
            # currency will be set based on country or extraction
            currency=ocr_data.get('currency', 'QAR'), # Use currency from country later if needed
            country_id=country_id,
            brand_id=brand_id,
            bu_id=business_unit_id, # Map form field to model field
            supplier_id=supplier_id,
            invoice_file_path=invoice_path,
            supporting_file_path=supporting_path,
            status='processing'
        )
        
        # Derive Company
        company = Company.query.filter_by(brand_id=brand_id, country_id=country_id).first()
        if company:
            invoice.company_id = company.id
            
        db.session.add(invoice)
        
        # Parse manual data to get Barcodes
        manual_list = []
        if decathlon_data:
            try:
                manual_list = json.loads(decathlon_data)
                print(f"[DEBUG] Manual items: {len(manual_list)}")
            except:
                print("[DEBUG] Failed to parse manual data")
                pass

        # Process ALL items from Excel and merge with Manual Barcodes
        all_items = []
        
        print(f"[DEBUG] ===== PROCESSING EXCEL DATA & MERGING BARCODES =====")
        print(f"[DEBUG] Excel items: {len(excel_data)}")
        
        # Process each Excel row directly
        for idx, excel_item in enumerate(excel_data):
            decathlon_sku = str(excel_item.get('decathlon_sku', '')).strip()
            
            if not decathlon_sku:
                print(f"[DEBUG] Row {idx+1}: Skipping - no Decathlon SKU")
                continue
            
            # Get Barcode and Model from matching Manual Item (by index)
            manual_barcode = ''
            manual_model = ''
            if idx < len(manual_list):
                 manual_barcode = str(manual_list[idx].get('barcode', '')).strip()
                 # Remove .0 if present
                 if manual_barcode.endswith('.0'): manual_barcode = manual_barcode[:-2]
                 manual_model = str(manual_list[idx].get('model', '')).strip()
                 # Remove .0 if present
                 if manual_model.endswith('.0'): manual_model = manual_model[:-2]
            
            if idx < 3:
                model_val = excel_item.get('model', '')
                desc_val = excel_item.get('item_description', '')
                print(f"[DEBUG] Row {idx+1}: SKU='{decathlon_sku}' + ExcelModel='{model_val}' + ManualModel='{manual_model}' + Desc='{desc_val}' + Barcode='{manual_barcode}'")
            
            all_items.append({
                'sku': decathlon_sku,
                'model': manual_model or excel_item.get('model', ''),  # Prefer manual entry, fallback to Excel
                'item_description': excel_item.get('item_description', ''),  # From Excel
                'barcode': manual_barcode,  # From Manual Input (UI)
                'quantity': excel_item.get('quantity', 0),
                'unit_cost': excel_item.get('unit_cost', 0.0),
                'unit_retail': excel_item.get('unit_retail', 0.0),
                'color_size': f"000|{decathlon_sku}"
            })
        
        print(f"[DEBUG] Processed {len(all_items)} merged items")

        # Add invoice items
        for item in all_items:
            invoice_item = InvoiceItem(
                barcode=item.get('barcode', ''),
                quantity=item.get('quantity', 0),
                unit_cost=item.get('unit_cost', 0.0),
                unit_retail=item.get('unit_retail', 0.0),
                color_size=item.get('color_size', ''),
                season='000',
                # IM fields - set initial values
                item_description=item.get('item_description', ''),  # From Excel
                mancode=item.get('model', ''),  # User's manually entered model from Decathlon products
                alternate_code=item.get('sku', ''),  # Decathlon SKU is the alternate code
                brand_code=brand_code,
                supplier_code=supplier_code
            )
            
            # Correct Itemcode Formula: Season(000) + SupplierCode + SKU
            itemcode = f"000{supplier_code}{item.get('sku')}"
            invoice_item.itemcode = itemcode
            
            invoice.items.append(invoice_item)
        
        # Commit invoice (with or without items)
        db.session.add(invoice)
        db.session.commit()
        
        return jsonify({
            'message': 'Invoice processed successfully',
            'invoice_id': invoice.id,
            'invoice': invoice.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] upload_invoice failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'message': f'Invoice processing failed: {str(e)}'
        }), 500

@bp.route('/<int:invoice_id>', methods=['PATCH'])
@jwt_required()
def update_invoice(invoice_id):
    """Update invoice details and line items"""
    user_id = int(get_jwt_identity())
    invoice = Invoice.query.get(invoice_id)
    
    if not invoice:
        return jsonify({'message': 'Invoice not found'}), 404
    
    if invoice.user_id != user_id:
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.json
    try:
        # Update main invoice fields
        if 'invoice_number' in data:
            invoice.invoice_number = data['invoice_number']
        if 'invoice_date' in data:
            invoice.invoice_date = data['invoice_date']
        if 'total_amount' in data:
            invoice.total_amount = data['total_amount']
        if 'currency' in data:
            invoice.currency = data['currency']
        
        # Update line items if provided
        if 'items' in data:
            # Simple approach: delete all and recreate or update by ID
            # Since IDs might change in the UI, we'll try to match by ID or recreate
            updated_items_data = data['items']
            
            # For simplicity in this LPO flow, we'll update matching IDs and add new ones
            # For a more robust flow, we'd handle deletions too.
            current_items = {item.id: item for item in invoice.items}
            
            new_items = []
            for item_data in updated_items_data:
                item_id = item_data.get('id')
                if item_id and item_id in current_items:
                    # Update existing
                    it = current_items[item_id]
                    it.itemcode = item_data.get('itemcode', it.itemcode)
                    it.barcode = item_data.get('barcode', it.barcode)
                    it.quantity = item_data.get('quantity', it.quantity)
                    it.unit_retail = item_data.get('unit_retail', it.unit_retail)
                    it.color_size = item_data.get('color_size', it.color_size)
                    # IM fields
                    it.item_description = item_data.get('item_description', it.item_description)
                    it.mancode = item_data.get('mancode', it.mancode)
                    it.brand_code = item_data.get('brand_code', it.brand_code)
                    it.supplier_code = item_data.get('supplier_code', it.supplier_code)
                    it.section = item_data.get('section', it.section)
                    it.family = item_data.get('family', it.family)
                    it.subfamily = item_data.get('subfamily', it.subfamily)
                    it.alternate_code = item_data.get('alternate_code', it.alternate_code)
                else:
                    # Create new
                    new_item = InvoiceItem(
                        invoice_id=invoice.id,
                        itemcode=item_data.get('itemcode'),
                        barcode=item_data.get('barcode'),
                        quantity=item_data.get('quantity'),
                        unit_retail=item_data.get('unit_retail'),
                        color_size=item_data.get('color_size'),
                        season=item_data.get('season', '000'),
                        # IM fields
                        item_description=item_data.get('item_description'),
                        mancode=item_data.get('mancode'),
                        brand_code=item_data.get('brand_code'),
                        supplier_code=item_data.get('supplier_code'),
                        section=item_data.get('section'),
                        family=item_data.get('family'),
                        subfamily=item_data.get('subfamily'),
                        alternate_code=item_data.get('alternate_code')
                    )
                    db.session.add(new_item)
            
            # Handle deletions: if item is in DB but not in request
            request_ids = {i.get('id') for i in updated_items_data if i.get('id')}
            for item_id, item_obj in current_items.items():
                if item_id not in request_ids:
                    db.session.delete(item_obj)

        db.session.commit()
        return jsonify(invoice.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Update failed: {str(e)}'}), 500

@bp.route('/<int:invoice_id>', methods=['GET'])
@jwt_required()
def get_invoice(invoice_id):
    """Get invoice details - accessible to all authenticated users"""
    # Verify user is authenticated (any authenticated user can view any invoice)
    get_jwt_identity()  # Just verify token is valid
    
    invoice = Invoice.query.get(invoice_id)
    
    if not invoice:
        return jsonify({'message': 'Invoice not found'}), 404
    
    return jsonify(invoice.to_dict()), 200

@bp.route('/<int:invoice_id>/download', methods=['GET'])
@jwt_required()
def download_invoice_excel(invoice_id):
    """Download invoice as ERP-ready Excel - accessible to all authenticated users"""
    # Verify user is authenticated (any authenticated user can download any invoice)
    get_jwt_identity()  # Just verify token is valid
    
    invoice = Invoice.query.get(invoice_id)
    
    if not invoice:
        return jsonify({'message': 'Invoice not found'}), 404
    
    try:
        # Generate Excel
        items_data = [item.to_dict() for item in invoice.items]
        
        invoice_data = {
            'invoice_number': invoice.invoice_number,
            'invoice_date': invoice.invoice_date,
            'currency': invoice.currency,
            'total_amount': invoice.total_amount
        }
        
        business_unit = invoice.business_unit
        workbook = ExcelService.generate_erp_excel(
            invoice_data,
            items_data,
            invoice.supplier.supplier_name,
            f"    {business_unit.bu_code}"  # 4 spaces prefix
        )
        
        # Save to BytesIO
        output = io.BytesIO()
        workbook.save(output)
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'Invoice_{invoice.invoice_number}_{invoice.invoice_date}.xlsx'
        )
    
    except Exception as e:
        return jsonify({'message': f'Download failed: {str(e)}'}), 500

@bp.route('/user', methods=['GET'])
@jwt_required()
def list_user_invoices():
    """List all invoices - accessible to all authenticated users"""
    # Verify user is authenticated (any authenticated user can view all invoices)
    get_jwt_identity()  # Just verify token is valid
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Return all invoices to any authenticated user
    invoices = Invoice.query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'total': invoices.total,
        'pages': invoices.pages,
        'current_page': page,
        'invoices': [inv.to_dict() for inv in invoices.items]
    }), 200

@bp.route('/<int:invoice_id>', methods=['DELETE'])
@jwt_required()
def delete_invoice(invoice_id):
    """Delete an invoice"""
    try:
        user_id = int(get_jwt_identity())
        invoice = Invoice.query.get(invoice_id)
        
        if not invoice:
            return jsonify({'message': 'Invoice not found'}), 404
        
        if invoice.user_id != user_id:
            return jsonify({'message': 'Unauthorized'}), 403
            
        # Delete files if they exist
        if invoice.invoice_file_path and os.path.exists(invoice.invoice_file_path):
            try:
                os.remove(invoice.invoice_file_path)
            except:
                pass
                
        if invoice.supporting_file_path and os.path.exists(invoice.supporting_file_path):
            try:
                os.remove(invoice.supporting_file_path)
            except:
                pass

        db.session.delete(invoice)
        db.session.commit()
        
        return jsonify({'message': 'Invoice deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Deletion failed: {str(e)}'}), 500

@bp.route('/<int:invoice_id>/file', methods=['GET'])
@jwt_required()
def get_invoice_file(invoice_id):
    """Get invoice file (image or pdf) - accessible to all authenticated users"""
    # Verify user is authenticated (any authenticated user can download any invoice file)
    get_jwt_identity()  # Just verify token is valid
    
    invoice = Invoice.query.get(invoice_id)
    
    if not invoice:
        return jsonify({'message': 'Invoice not found'}), 404
        
    if not invoice.invoice_file_path:
        return jsonify({'message': 'File path not found'}), 404
        
    # Use absolute path for send_file
    try:
        abs_path = os.path.abspath(invoice.invoice_file_path)
        print(f"[DEBUG] Serving file for invoice {invoice_id}")
        print(f"[DEBUG] DB path: {invoice.invoice_file_path}")
        print(f"[DEBUG] Abs path: {abs_path}")
        
        if not os.path.exists(abs_path):
             print(f"[ERROR] File NOT found at {abs_path}")
             return jsonify({'message': f'File not found: {abs_path}'}), 404
             
        print(f"[DEBUG] File exists, sending...")
        
        # Determine mimetype explicitly
        import mimetypes
        mimetype, _ = mimetypes.guess_type(abs_path)
        if not mimetype:
            if abs_path.lower().endswith('.pdf'):
                mimetype = 'application/pdf'
            elif abs_path.lower().endswith('.png'):
                mimetype = 'image/png'
            elif abs_path.lower().endswith('.jpg') or abs_path.lower().endswith('.jpeg'):
                mimetype = 'image/jpeg'
                
        print(f"[DEBUG] Mimetype detected: {mimetype}")
        return send_file(abs_path, mimetype=mimetype)
    except Exception as e:
        print(f"[ERROR] Error serving file: {str(e)}")
        return jsonify({'message': f'Error serving file: {str(e)}'}), 500

@bp.route('/<int:invoice_id>/supporting-file', methods=['GET'])
@jwt_required()
def get_supporting_file(invoice_id):
    """Get supporting file (Excel sheet) - accessible to all authenticated users"""
    # Verify user is authenticated (any authenticated user can download any supporting file)
    get_jwt_identity()  # Just verify token is valid
    
    invoice = Invoice.query.get(invoice_id)
    
    if not invoice:
        return jsonify({'message': 'Invoice not found'}), 404
        
    if not invoice.supporting_file_path:
        return jsonify({'message': 'Supporting file not found'}), 404
        
    # Use absolute path for send_file
    try:
        abs_path = os.path.abspath(invoice.supporting_file_path)
        print(f"[DEBUG] Serving supporting file for invoice {invoice_id}")
        print(f"[DEBUG] DB path: {invoice.supporting_file_path}")
        print(f"[DEBUG] Abs path: {abs_path}")
        
        if not os.path.exists(abs_path):
             print(f"[ERROR] File NOT found at {abs_path}")
             return jsonify({'message': f'File not found: {abs_path}'}), 404
             
        print(f"[DEBUG] File exists, sending...")
        
        # Determine mimetype explicitly
        import mimetypes
        mimetype, _ = mimetypes.guess_type(abs_path)
        if not mimetype:
            if abs_path.lower().endswith('.xlsx'):
                mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            elif abs_path.lower().endswith('.xls'):
                mimetype = 'application/vnd.ms-excel'
            elif abs_path.lower().endswith('.csv'):
                mimetype = 'text/csv'
                
        print(f"[DEBUG] Mimetype detected: {mimetype}")
        return send_file(abs_path, mimetype=mimetype)
    except Exception as e:
        print(f"[ERROR] Error serving file: {str(e)}")
        return jsonify({'message': f'Error serving file: {str(e)}'}), 500
