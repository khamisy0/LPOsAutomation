# Invoice Automation System - Architecture & Design

## System Architecture

### Three-Tier Architecture
```
┌─────────────────────────────────┐
│     Frontend (React + Vite)     │
│  - User Interface               │
│  - Routing & State Management   │
│  - API Communication            │
└──────────────┬──────────────────┘
               │ HTTP/REST
┌──────────────▼──────────────────┐
│   Backend (Flask + SQLAlchemy)  │
│  - Authentication (JWT)         │
│  - Business Logic               │
│  - OCR Processing               │
│  - Excel Generation             │
└──────────────┬──────────────────┘
               │ TCP/IP
┌──────────────▼──────────────────┐
│   Database (PostgreSQL)         │
│  - Master Data                  │
│  - User Data                    │
│  - Invoice Records              │
└─────────────────────────────────┘
```

## Data Flow

### Invoice Upload Flow
```
1. User selects Country → Brand → Business Unit → Supplier
2. Uploads Invoice (PDF/Image) + Supporting Excel
3. Backend receives multipart/form-data
4. OCR Service extracts text from invoice
5. OCR Helpers extract: Invoice#, Date, Amount
6. Excel Service reads supporting file
7. Data merged and stored in database
8. Invoice Items created with itemcode
9. Response redirects to Preview page
```

### Invoice Processing Flow
```
File Upload
    ↓
OCR Extraction (Tesseract)
    ├─ extract_invoice_number() → regex patterns
    ├─ extract_invoice_date() → date parsing → YYYYMMDD
    └─ extract_total_amount() → amount extraction
    ↓
Excel Parsing (Decathlon SKUs)
    ├─ Read Barcode & Model
    └─ Parse quantity data
    ↓
Data Transformation
    ├─ Generate Itemcode (Season + SupplierCode + SKU)
    ├─ Create Color|Size (000|SKU)
    └─ Apply Business Rules
    ↓
Database Storage
    ├─ Create Invoice record
    ├─ Create InvoiceItem entries
    └─ Set status = 'processed'
    ↓
Response to Frontend
    └─ Invoice ID → Redirect to Preview
```

## Database Schema Relationships

```
Users (1) ──────────── (M) Invoices
                           │
                           ├─ (M) InvoiceItems
                           │
                           └─ FK: Country, Brand, BusinessUnit, Supplier

Countries (1) ──── (M) Brands
                        │
                        └─ (M) BusinessUnits

Countries (1) ──── (M) Suppliers
Brands (1)   ──── (M) Suppliers (optional)
```

## Business Rules Implementation

### Hardcoded MVP Values
```python
BRAND_CODE = "54"           # Decathlon
SUPPLIER_CODE = "5432"      # QNITED
SEASON = "000"
COMPANY_CODE = "06002"      # Decathlon Qatar
CURRENCY = "QAR"
BU_CODE_PREFIX = "    "     # 4 spaces
```

### Itemcode Generation
```
Formula: {Season}{SupplierCode}{DecathlonSKU}
Example: 000 + 5432 + 12345 = 000543212345

Color|Size Format: {Season}|{SKU}
Example: 000|12345
```

## Security Measures

1. **Authentication**
   - JWT tokens with expiration (30 days)
   - Password hashing with Werkzeug

2. **Authorization**
   - Protected routes check JWT
   - User-specific invoice access
   - @jwt_required() decorators

3. **File Handling**
   - Secure filename handling
   - File type validation
   - Size limit enforcement (50MB)
   - Timestamped filenames

4. **Database**
   - Parameterized queries via SQLAlchemy ORM
   - SQL injection prevention
   - Password never stored in plain text

## Error Handling Strategy

### Frontend
```javascript
// API interceptors handle 401 → redirect to login
// Try-catch blocks capture errors
// User-friendly error messages
// Loading states during async operations
```

### Backend
```python
# Try-except blocks in route handlers
# Meaningful error messages returned
# Status codes follow HTTP standards
# Database rollback on errors
```

## Performance Optimizations

1. **Database**
   - Indexes on foreign keys
   - Lazy loading relationships
   - Pagination for invoice lists

2. **Frontend**
   - Component-based architecture
   - Lazy loading pages with React Router
   - Tailwind CSS for lightweight styling

3. **OCR**
   - Async processing (future enhancement)
   - Regex fallback patterns
   - Error handling for poor quality images

## Scalability Considerations

### For Production
1. **Async Task Queue** (Celery + Redis)
   - Long-running OCR processing
   - Background job management
   - Task status tracking

2. **Caching** (Redis)
   - Master data caching
   - User session caching
   - API response caching

3. **File Storage**
   - S3 for cloud storage
   - CDN for image delivery
   - Archive old invoices

4. **Database**
   - Connection pooling
   - Read replicas for scaling
   - Archive tables for historical data

5. **API**
   - Rate limiting
   - API versioning
   - GraphQL for flexible queries

## Testing Strategy

### Unit Tests
- OCR helper functions
- Date parsing functions
- Itemcode generation

### Integration Tests
- Auth endpoints
- Invoice upload flow
- Excel generation

### E2E Tests
- Complete user journey
- Invoice upload to download
- Dashboard functionality

## Deployment Architecture

```
┌──────────────────────────────────┐
│    Nginx (Reverse Proxy)         │
│  - SSL/TLS Termination           │
│  - Load Balancing                │
└────────┬──────────────────────────┘
         │
    ┌────┴─────┐
    │           │
┌───▼──┐   ┌───▼──┐
│Flask │   │Flask │  (Multiple instances)
│ App1 │   │ App2 │  (Gunicorn)
└───┬──┘   └───┬──┘
    │           │
    └────┬──────┘
         │
    ┌────▼──────────┐
    │ PostgreSQL    │
    │ (Main + Repl) │
    └───────────────┘

Frontend:
┌──────────────────────┐
│ Static Files (CDN)   │
│ Built React App      │
│ (dist/ folder)       │
└──────────────────────┘
```

---

**Last Updated**: January 2, 2026
