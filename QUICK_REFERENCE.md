# Invoice Automation System - Quick Reference

## 🚀 Quick Start (5 minutes)

### Terminal 1 - Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python seed_db.py
python run.py
```
→ Backend running on `http://localhost:5000`

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```
→ Frontend running on `http://localhost:3000`

### Access Application
Open browser: **http://localhost:3000**

---

## 📁 File Locations

| What | Where |
|------|-------|
| Backend entry point | `backend/run.py` |
| Database models | `backend/app/models/` |
| API routes | `backend/app/routes/` |
| Frontend entry | `frontend/src/main.jsx` |
| Pages | `frontend/src/pages/` |
| Components | `frontend/src/components/` |
| API client | `frontend/src/services/api.js` |

---

## 🔑 Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Sign up |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/invoices` | Upload invoice |
| GET | `/api/invoices/:id` | View invoice |
| GET | `/api/invoices/:id/download` | Download Excel |
| GET | `/api/dashboard/stats` | Get statistics |
| GET | `/api/master/countries` | Get countries |

---

## 🗄️ Database Commands

### Connect to PostgreSQL
```bash
psql -U postgres -d invoice_automation
```

### View Invoices
```sql
SELECT * FROM invoices;
SELECT * FROM invoice_items;
```

### View Master Data
```sql
SELECT * FROM countries;
SELECT * FROM brands;
SELECT * FROM business_units;
SELECT * FROM suppliers;
```

### View Users
```sql
SELECT id, email, name FROM users;
```

---

## ⚙️ Configuration Files

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_automation
JWT_SECRET_KEY=your-secret-key
TESSERACT_PATH=/usr/bin/tesseract
UPLOAD_FOLDER=./uploads
MAX_FILE_SIZE=50000000
```

### Frontend (vite.config.js)
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true
  }
}
```

---

## 🧪 Testing API Endpoints

### Using cURL

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

**Get Countries**
```bash
curl http://localhost:5000/api/master/countries
```

**Get Dashboard Stats** (requires token)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/dashboard/stats
```

---

## 📊 User Flow

```
1. Register/Login
   ↓
2. Dashboard (view stats)
   ↓
3. Click "Upload Invoice"
   ↓
4. Select: Country → Brand → Business Unit → Supplier
   ↓
5. Upload invoice file + Excel file
   ↓
6. System processes (OCR + parsing)
   ↓
7. Preview invoice data
   ↓
8. Download as Excel
```

---

## 🎨 Component Hierarchy

```
App
├── LoginPage
├── RegisterPage
├── Navbar (persistent)
├── DashboardPage
│   └── StatCard (x4)
├── InvoicesPage
│   └── Invoice rows
├── InvoiceUploadPage
│   ├── Dropdowns
│   ├── Decathlon table
│   └── File uploads
└── InvoicePreviewPage
    ├── Invoice preview
    ├── Summary card
    └── Product table
```

---

## 🔒 Auth Flow

```
User enters credentials
   ↓
POST /auth/login
   ↓
Backend verifies password
   ↓
JWT token generated
   ↓
Token stored in localStorage
   ↓
Redirect to /dashboard
   ↓
All API requests include token in header
   ↓
API validates token
```

---

## 📦 Invoice Processing Flow

```
File Upload
   ↓
OCR Extraction (Tesseract)
   ├─ Invoice number (regex)
   ├─ Invoice date (parsing)
   └─ Total amount (extraction)
   ↓
Excel Parsing (Decathlon SKUs)
   ├─ Barcode
   └─ Model/SKU
   ↓
Data Transformation
   ├─ Generate itemcode
   ├─ Apply business rules
   └─ Create records
   ↓
Database Storage
   ├─ Invoice record
   └─ InvoiceItem entries
   ↓
Response + Redirect to Preview
```

---

## ❌ Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| `Connection refused on 5000` | Backend not running, check `python run.py` |
| `Cannot GET /` | Frontend not running, check `npm run dev` |
| `Tesseract not found` | Install tesseract OCR, update path in .env |
| `CORS error` | Check backend CORS config in `app/__init__.py` |
| `No such table` | Run `python seed_db.py` |
| `Port already in use` | Change port in `run.py` or `vite.config.js` |

---

## 📋 Checklist Before Production

- [ ] PostgreSQL installed and running
- [ ] Tesseract OCR installed
- [ ] Environment variables configured (.env)
- [ ] Database seeded with master data
- [ ] Backend tests passing
- [ ] Frontend builds without errors
- [ ] SSL/TLS certificates configured
- [ ] Backup strategy in place
- [ ] Monitoring setup
- [ ] Rate limiting configured

---

## 🛠️ Useful Commands

### Backend
```bash
# Activate virtual environment
source backend/venv/bin/activate

# Install new package
pip install package_name

# Freeze requirements
pip freeze > requirements.txt

# Run database seed
python backend/seed_db.py

# Start server
python backend/run.py
```

### Frontend
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview build
npm run preview

# Lint code
npm run lint
```

### Database
```bash
# Connect to DB
psql -U postgres -d invoice_automation

# List tables
\dt

# Describe table
\d invoices

# Exit psql
\q
```

---

## 📱 API Response Examples

### Successful Login
```json
{
  "message": "Login successful",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Invoice Upload Success
```json
{
  "message": "Invoice processed successfully",
  "invoice_id": 1,
  "invoice": {
    "id": 1,
    "invoice_number": "INV-001",
    "invoice_date": "20260102",
    "total_amount": 5000.00,
    "status": "processed",
    "items": [...]
  }
}
```

### Dashboard Stats
```json
{
  "total_invoices": 10,
  "invoices_this_month": 3,
  "invoices_pending": 1,
  "last_processed_date": "2026-01-02T10:00:00",
  "total_amount_month": 15000.00
}
```

---

## 📞 Support

1. **Check logs**: Terminal output for errors
2. **Read docs**: SETUP_GUIDE.md for detailed help
3. **Test API**: Use cURL or Postman
4. **Database**: Check with psql CLI
5. **Frontend**: Check browser DevTools

---

## 🎓 File Tree

```
LPOs Automation/
├── README.md                          ← START HERE
├── SETUP_GUIDE.md                     ← Installation help
├── API_DOCUMENTATION.md               ← All endpoints
├── ARCHITECTURE.md                    ← System design
├── IMPLEMENTATION_SUMMARY.md          ← What's included
│
├── backend/
│   ├── run.py                         ← Start server
│   ├── seed_db.py                     ← Init database
│   ├── requirements.txt               ← Dependencies
│   ├── .env.example                   ← Config template
│   └── app/
│       ├── __init__.py                ← Flask app
│       ├── models/                    ← Database models
│       ├── routes/                    ← API endpoints
│       ├── services/                  ← OCR, Excel
│       └── utils/                     ← Helpers
│
└── frontend/
    ├── package.json                   ← Dependencies
    ├── vite.config.js                 ← Build config
    ├── tailwind.config.js             ← Styling
    ├── index.html                     ← HTML template
    └── src/
        ├── App.jsx                    ← Root component
        ├── main.jsx                   ← Entry point
        ├── index.css                  ← Global styles
        ├── pages/                     ← 6 page components
        ├── components/                ← Reusable components
        ├── services/api.js            ← API client
        └── utils/auth.js              ← Auth helpers
```

---

## ⏱️ Timeline

| Phase | Time | Status |
|-------|------|--------|
| Backend setup | Done | ✅ Complete |
| Frontend setup | Done | ✅ Complete |
| Database models | Done | ✅ Complete |
| API endpoints | Done | ✅ Complete |
| OCR integration | Done | ✅ Complete |
| UI components | Done | ✅ Complete |
| Documentation | Done | ✅ Complete |

---

**System Status**: ✅ READY TO USE

**Setup Time**: ~15 minutes (first time only)

**Maintenance**: Low (no external dependencies except PostgreSQL & Tesseract)

---

Created: January 2, 2026
