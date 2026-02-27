from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost:5432/invoice_automation')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key')
    app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_FILE_SIZE', 50000000))
    app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', './uploads')
    
    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Initialize extensions
    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"], "supports_credentials": True}})
    db.init_app(app)
    jwt.init_app(app)
    
    # JWT error handlers
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        print(f"[JWT ERROR] Invalid token: {error_string}")
        return {'message': f'Invalid token: {error_string}'}, 422
    
    @jwt.unauthorized_loader
    def unauthorized_callback(error_string):
        print(f"[JWT ERROR] Unauthorized: {error_string}")
        return {'message': f'Missing Authorization header: {error_string}'}, 401
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        print(f"[JWT ERROR] Expired token")
        return {'message': 'Token has expired'}, 401
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        print(f"[JWT ERROR] Revoked token")
        return {'message': 'Token has been revoked'}, 401
    
    # Create tables
    with app.app_context():
        from app.models import user, invoice, brand, country, business_unit, supplier, lpo_tracker
        db.create_all()
    
    # Register blueprints
    from app.routes import auth, invoice as invoice_bp, dashboard, master_data, tracker
    app.register_blueprint(auth.bp)
    app.register_blueprint(invoice_bp.bp)
    app.register_blueprint(dashboard.bp)
    app.register_blueprint(master_data.bp)
    app.register_blueprint(tracker.bp)
    
    return app
