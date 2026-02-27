"""
Create a test user for development
Run with: python create_test_user.py
"""

from app import create_app, db
from app.models.user import User

def create_test_user():
    app = create_app()
    
    with app.app_context():
        # Check if user already exists
        existing_user = User.query.filter_by(email='test@example.com').first()
        
        if existing_user:
            print("⚠️  Test user already exists!")
            print(f"   Email: test@example.com")
            print(f"   Password: password123")
            return
        
        # Create test user
        user = User(
            email='test@example.com',
            name='Test User',
            avatar=None
        )
        user.set_password('password123')
        
        db.session.add(user)
        db.session.commit()
        
        print("✅ Test user created successfully!")
        print(f"   Email: test@example.com")
        print(f"   Password: password123")
        print(f"\nYou can now log in with these credentials.")

if __name__ == '__main__':
    create_test_user()
