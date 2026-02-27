# Invoice Automation System

A production-ready web-based invoice automation platform that extracts and processes invoice data using OCR, with intelligent routing based on country, brand, and supplier hierarchies.

## 🎯 Features

### Core Functionality
✅ **User Authentication** - Email/password login with JWT tokens
✅ **Dashboard** - Real-time KPI cards and statistics
✅ **Invoice Upload** - PDF/Image + Excel file support
✅ **OCR Extraction** - Automatic invoice data extraction
✅ **Cascading Filters** - Dynamic Country → Brand → Business Unit → Supplier routing
✅ **Data Preview** - Visual invoice preview with extracted data
✅ **Excel Export** - ERP-ready Excel generation

### Technical Stack

**Frontend:**
- React 18 with React Router
- Vite (lightning-fast bundler)
- Tailwind CSS (utility-first styling)
- Axios (HTTP client)

**Backend:**
- Flask (Python microframework)
- SQLAlchemy (ORM)
- PostgreSQL (relational database)
- Tesseract OCR (text extraction)
- OpenPyXL (Excel handling)

**Infrastructure:**
- Secure JWT authentication
- CORS enabled for frontend communication
- Multipart file uploads
- Pagination and error handling

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Tesseract OCR

### Step 1: Clone & Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Initialize database
python seed_db.py

# Start server
python run.py
# Backend running on http://localhost:5000
```

### Step 2: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend running on http://localhost:3000
```

### Step 3: Access Application

Open browser and navigate to: **http://localhost:3000**

**Demo Credentials (after seeding database):**
- Email: demo@example.com
- Password: password123

(Create one via registration page)

## 📋 User Workflow

### 1. Authentication
- Sign up with email and password
- Or login with existing credentials
- JWT token stored securely

### 2. Dashboard
- View KPI statistics
- Total invoices processed
- This month's metrics
- Quick action buttons

### 3. Upload Invoice
- Select: Country → Brand → Business Unit → Supplier
- (Optional) Enter Decathlon product data
- Upload invoice file (PDF or image)
- Upload supporting Excel file
- System processes automatically

### 4. Preview & Confirm
- Large invoice image preview
- Invoice summary card
- Product list table
- Company & supplier information

### 5. Download
- Download as ERP-ready Excel
- File auto-formats with all business rules applied

## 🏗️ System Architecture

```
Frontend (React/Vite)
    ↓
REST API (Flask)
    ├─ Authentication
    ├─ Invoice Processing
    ├─ OCR Service
    └─ File Handling
    ↓
Database (PostgreSQL)
    ├─ Users
    ├─ Invoices
    ├─ Master Data
    └─ Business Rules
```

## 📊 Business Rules

### Hardcoded for MVP
```
Brand Code:              54
Supplier Code (QNITED):  5432
Season:                  000
Company Code:            06002
Currency:                QAR
Business Unit Prefix:    4 spaces
```

### Itemcode Generation
```
Formula: {Season}{SupplierCode}{DecathlonSKU}
Example: 000543212345

Color|Size: 000|{SKU}
```

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| users | User accounts & authentication |
| countries | Geographic routing |
| brands | Brand master data |
| business_units | Store/location information |
| suppliers | Vendor management |
| invoices | Invoice records |
| invoice_items | Line items per invoice |

## 📡 API Endpoints

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info

### Invoices
- `POST /api/invoices` - Upload invoice
- `GET /api/invoices/:id` - Get details
- `GET /api/invoices/:id/download` - Download Excel
- `GET /api/invoices/user` - List user invoices

### Dashboard
- `GET /api/dashboard/stats` - KPI statistics

### Master Data
- `GET /api/master/countries`
- `GET /api/master/brands/:countryId`
- `GET /api/master/business-units/:brandId`
- `GET /api/master/suppliers/:countryId/:brandId`

## 🔒 Security Features

✓ JWT token-based authentication
✓ Password hashing with Werkzeug
✓ CORS configuration
✓ Protected routes
✓ Secure file upload
✓ SQL injection prevention (SQLAlchemy ORM)
✓ User-specific data isolation

## 📁 Project Structure

```
LPOs Automation/
├── backend/
│   ├── app/
│   │   ├── models/        # Database models
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic (OCR, Excel)
│   │   └── utils/         # Helper functions
│   ├── run.py            # Server entry point
│   ├── seed_db.py        # Database initialization
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── services/     # API calls
│   │   └── utils/        # Helper functions
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── SETUP_GUIDE.md        # Detailed setup instructions
├── API_DOCUMENTATION.md  # API reference
└── ARCHITECTURE.md       # System design
```

## 🛠️ Troubleshooting

**PostgreSQL Connection Error**
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Check DATABASE_URL in .env
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_automation
```

**Tesseract Not Found**
```python
# Update in backend/app/services/ocr_service.py if needed:
import pytesseract
pytesseract.pytesseract.pytesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

**Port Already in Use**
```bash
# Change Flask port in run.py:
app.run(port=5001)

# Change Vite port in vite.config.js:
server: { port: 3001 }
```

## 📚 Documentation

- [Setup Guide](SETUP_GUIDE.md) - Complete installation & configuration
- [API Documentation](API_DOCUMENTATION.md) - Full endpoint reference
- [Architecture](ARCHITECTURE.md) - System design & data flows

## 🚀 Production Deployment

### Backend (Gunicorn)
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app
```

### Frontend (Build & Serve)
```bash
npm run build
# Serve dist/ with nginx/cdn
```

### Environment Setup
- Set `FLASK_ENV=production`
- Update all connection strings
- Configure proper logging
- Set up SSL/TLS certificates
- Enable rate limiting
- Configure backups

## 📈 Future Enhancements

- [ ] Async invoice processing (Celery)
- [ ] Email notifications
- [ ] Batch invoice upload
- [ ] Invoice template detection
- [ ] Advanced reporting & analytics
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Invoice versioning & audit trail
- [ ] Automated ERP integration
- [ ] Invoice approval workflow

## 👥 Team

Built as a production-ready invoice automation platform.

## 📝 License

All rights reserved.

---

## 🆘 Support & Issues

For issues:
1. Check console output for error messages
2. Review database logs
3. Check browser DevTools Network tab
4. See troubleshooting section above

---

**Last Updated**: January 2, 2026
**Version**: 1.0.0 (MVP)
