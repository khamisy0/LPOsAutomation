# Invoice Automation System - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe"
}

Response (201):
{
  "message": "User created successfully",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2026-01-02T10:00:00"
  }
}
```

### Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure-password"
}

Response (200):
{
  "message": "Login successful",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2026-01-02T10:00:00"
  }
}
```

### Get Current User
```
GET /auth/me
Authorization: Bearer <token>

Response (200):
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": null,
  "created_at": "2026-01-02T10:00:00"
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer <token>

Response (200):
{
  "message": "Logout successful"
}
```

---

## Invoice Endpoints

### Upload Invoice
```
POST /invoices
Authorization: Bearer <token>
Content-Type: multipart/form-data

Parameters:
- country_id: integer (required)
- brand_id: integer (required)
- business_unit_id: integer (required)
- supplier_id: integer (required)
- invoice_file: file (required, pdf/png/jpg/jpeg)
- supporting_file: file (required, xlsx/xls)
- decathlon_data: JSON string (optional)

Response (201):
{
  "message": "Invoice processed successfully",
  "invoice_id": 1,
  "invoice": {
    "id": 1,
    "invoice_number": "INV-001",
    "invoice_date": "20260102",
    "total_amount": 5000.00,
    "currency": "QAR",
    "status": "processed",
    "items": [...]
  }
}
```

### Get Invoice Details
```
GET /invoices/:id
Authorization: Bearer <token>

Response (200):
{
  "id": 1,
  "invoice_number": "INV-001",
  "invoice_date": "20260102",
  "total_amount": 5000.00,
  "currency": "QAR",
  "country_id": 1,
  "brand_id": 1,
  "business_unit_id": 1,
  "supplier_id": 1,
  "status": "processed",
  "created_at": "2026-01-02T10:00:00",
  "items": [
    {
      "id": 1,
      "itemcode": "000543212345",
      "barcode": "123456789",
      "quantity": 10,
      "unit_retail": 500,
      "color_size": "000|12345",
      "season": "000"
    }
  ]
}
```

### List User Invoices
```
GET /invoices/user?page=1&per_page=10
Authorization: Bearer <token>

Response (200):
{
  "total": 5,
  "pages": 1,
  "current_page": 1,
  "invoices": [...]
}
```

### Download Invoice as Excel
```
GET /invoices/:id/download
Authorization: Bearer <token>

Response (200): Excel file (binary)
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

---

## Dashboard Endpoints

### Get Dashboard Statistics
```
GET /dashboard/stats
Authorization: Bearer <token>

Response (200):
{
  "total_invoices": 10,
  "invoices_this_month": 3,
  "invoices_pending": 1,
  "last_processed_date": "2026-01-02T10:00:00",
  "total_amount_month": 15000.00
}
```

---

## Master Data Endpoints

### Get All Countries
```
GET /master/countries

Response (200):
[
  {
    "id": 1,
    "code": "QA",
    "name": "Qatar",
    "currency": "QAR"
  },
  {
    "id": 2,
    "code": "AE",
    "name": "UAE",
    "currency": "AED"
  }
]
```

### Get Brands by Country
```
GET /master/brands/:countryId

Response (200):
[
  {
    "id": 1,
    "code": "54",
    "name": "Decathlon",
    "country_id": 1,
    "country_name": "Qatar"
  }
]
```

### Get Business Units by Brand
```
GET /master/business-units/:brandId

Response (200):
[
  {
    "id": 1,
    "code": "06DCTL01",
    "name": "Decathlon Villagio",
    "brand_id": 1
  }
]
```

### Get Suppliers
```
GET /master/suppliers/:countryId/:brandId

Response (200):
[
  {
    "id": 1,
    "code": "5432",
    "name": "QNITED",
    "country_id": 1,
    "brand_id": 1
  }
]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid credentials"
}
```

### 403 Forbidden
```json
{
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "message": "Invoice not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Invoice processing failed: OCR Error"
}
```

---

## Rate Limiting
Not implemented in MVP - add for production

## Pagination
Default: page=1, per_page=10
Max per_page: 100

## File Upload Limits
- Max file size: 50MB
- Allowed invoice formats: PDF, PNG, JPG, JPEG
- Allowed supporting formats: XLSX, XLS

---

**Last Updated**: January 2, 2026
