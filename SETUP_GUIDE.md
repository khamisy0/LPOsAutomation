# Invoice Automation System - Setup Guide

## Project Structure

```
LPOs Automation/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── invoice.py
│   │   │   ├── country.py
│   │   │   ├── brand.py
│   │   │   ├── business_unit.py
│   │   │   └── supplier.py
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── invoice.py
│   │   │   ├── dashboard.py
│   │   │   └── master_data.py
│   │   ├── services/
│   │   │   ├── ocr_service.py
│   │   │   └── excel_service.py
│   │   ├── utils/
│   │   │   ├── ocr_helpers.py
│   │   │   └── file_handlers.py
│   │   └── __init__.py
│   ├── run.py
│   ├── seed_db.py
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── InvoicesPage.jsx
    │   │   ├── InvoiceUploadPage.jsx
    │   │   └── InvoicePreviewPage.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── utils/
    │   │   └── auth.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    └── postcss.config.js
```

## Prerequisites

- **Python**: 3.8+
- **Node.js**: 16+
- **PostgreSQL**: 12+
- **Tesseract OCR**: Latest version

## Backend Setup

### 1. Install Tesseract OCR

**Windows:**
```powershell
# Using Chocolatey
choco install tesseract

# Or download installer from: https://github.com/UB-Mannheim/tesseract/wiki
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

### 2. Setup PostgreSQL Database

```bash
# Create database
createdb invoice_automation

# Or using psql:
psql -U postgres
CREATE DATABASE invoice_automation;
```

### 3. Install Python Dependencies

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Configure Environment

```bash
# Copy example to .env
cp .env.example .env

# Edit .env with your settings
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_automation
JWT_SECRET_KEY=your-super-secret-key-change-this
TESSERACT_PATH=/path/to/tesseract  # e.g., /usr/bin/tesseract on Linux
```

### 5. Initialize Database

```bash
# Create tables
python
>>> from app import create_app, db
>>> app = create_app()
>>> with app.app_context():
>>>     db.create_all()
>>> exit()

# Seed master data
python seed_db.py
```

### 6. Run Backend Server

```bash
python run.py
# Server runs on http://localhost:5000
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Update `vite.config.js` if backend is on different host:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',  // Change as needed
    changeOrigin: true,
  }
}
```

### 3. Run Development Server

```bash
npm run dev
# Frontend runs on http://localhost:3000
```

### 4. Build for Production

```bash
npm run build
# Output in dist/
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - User logout

### Invoices
- `POST /api/invoices` - Upload invoice
- `GET /api/invoices/:id` - Get invoice details
- `GET /api/invoices/:id/download` - Download as Excel
- `GET /api/invoices/user` - List user's invoices

### Dashboard
- `GET /api/dashboard/stats` - Get KPI statistics

### Master Data
- `GET /api/master/countries` - List countries
- `GET /api/master/brands/:countryId` - Get brands by country
- `GET /api/master/business-units/:brandId` - Get business units
- `GET /api/master/suppliers/:countryId/:brandId` - Get suppliers

## Features

### User Authentication
- Email/password registration and login
- JWT-based authentication
- Secure token storage (localStorage)
- Protected routes

### Dashboard
- Total invoices processed
- Invoices this month
- Pending invoices count
- Last processed date
- Quick action buttons

### Invoice Upload
- Cascading dropdowns (Country → Brand → Business Unit → Supplier)
- Conditional Decathlon data entry
- PDF and image file upload
- Supporting Excel file upload
- Paste from Excel functionality

### Invoice Processing
- OCR text extraction
- Invoice number extraction
- Invoice date extraction (converts to YYYYMMDD)
- Total amount extraction
- Excel data parsing

### Invoice Preview & Download
- Large invoice  image preview
- Invoice summary card
- Company & supplier information
- Product list table
- Download as ERP-ready Excel

### Business Rules (Hardcoded for MVP)
```
Brand Code (Decathlon): 54
Supplier Code (QNITED): 5432
Season: 000
Company Code: 06002
Business Unit Code prefix: 4 spaces + code
Color|Size format: 000|<SKU>
Itemcode: Season + SupplierCode + SKU
```

## Database Schema

### Users Table
- id, email, password_hash, name, avatar, is_active, created_at, updated_at

### Countries Table
- id, code, name, currency, created_at

### Brands Table
- id, code, name, country_id, created_at

### Business Units Table
- id, code, name, brand_id, created_at

### Suppliers Table
- id, code, name, country_id, brand_id, created_at

### Invoices Table
- id, user_id, invoice_number, invoice_date, total_amount, currency
- country_id, brand_id, business_unit_id, supplier_id
- invoice_file_path, supporting_file_path
- status, error_message, created_at, updated_at

### Invoice Items Table
- id, invoice_id, itemcode, barcode, quantity, unit_retail
- color_size, season, created_at

## Troubleshooting

### Tesseract Not Found
```bash
# Update pytesseract configuration in app/__init__.py or services:
import pytesseract
pytesseract.pytesseract.pytesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### Database Connection Error
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Check connection string in .env
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_automation
```

### Port Already in Use
```bash
# Backend (change in run.py or .env)
# Linux: lsof -i :5000
# Windows: netstat -ano | findstr :5000

# Frontend (change in vite.config.js)
server: {
  port: 3001,  // Use different port
}
```

## Development Tips

1. **Hot Reload**: Both Vite (frontend) and Flask support auto-reload
2. **API Testing**: Use Postman/Insomnia for API endpoint testing
3. **Database Inspection**: Use pgAdmin or psql CLI
4. **Logs**: Check console output for detailed error messages

## Production Deployment

### Backend
```bash
# Use Gunicorn instead of Flask dev server
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

### Frontend
```bash
npm run build
# Serve dist/ folder with nginx or cdn
```

### Environment Variables (Production)
- Set FLASK_ENV=production
- Update DATABASE_URL with production credentials
- Set strong JWT_SECRET_KEY
- Configure CORS for allowed origins
- Update API endpoints

## Support

For issues or questions, check:
1. Console output for error messages
2. Database logs
3. Browser DevTools Network tab
4. Flask/Vite debug output

---

**Last Updated**: January 2, 2026
