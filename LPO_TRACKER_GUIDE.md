# LPO Tracker & Archive Feature

## Overview

The LPO Tracker & Archive feature allows users to track and manage all their created Local Purchase Orders (LPOs) in a centralized, organized manner. The system automatically generates unique serial numbers for each LPO and organizes them by Country and Business Unit (BU).

## Features

### 1. **Automatic Serial Number Generation**
- Each LPO receives a unique serial number in the format: `BU_CODE-YY-XXXX`
  - **BU_CODE**: First 3 letters of the Business Unit code (uppercase)
  - **YY**: Last 2 digits of the current year
  - **XXXX**: Incremental 4-digit number (0001, 0002, etc.) unique per BU per year
  
- Example: An LPO for the Villagio BU in 2026 would have serial numbers like:
  - VLG-26-0001
  - VLG-26-0002
  - VLG-26-0003

### 2. **Add to Tracker**
When viewing an invoice in the Invoice Preview page:
1. Click the **"ADD TO TRACKER"** button next to "GENERATE ERP EXCEL"
2. A form will pop up asking for the following details:
   - **Date of Request** (required): When the LPO was requested
   - **Ticket No.** (required): The ticket number associated with the LPO
   - **Shipment No.** (required): The shipment number
   - **Shipment Status** (required): Current status of the shipment (Pending, In Transit, Delivered, Cancelled, On Hold)
   - **Communicated with Costing Team** (optional): Checkbox to indicate if costing team was contacted
   - **SP Shipment** (optional): Checkbox to indicate if this is an SP (Special) Shipment
   - **SP Ticket No.** (required if SP Shipment is Yes): The SP ticket number

3. Click **"Add to Tracker"** to save the LPO to the tracker

### 3. **View Tracker & Archive**
Navigate to the **"Tracker"** page from the navigation menu to view all tracked LPOs:

#### Organization Structure
The tracker is organized hierarchically:
- **Country Level**: All tracked LPOs grouped by country
- **Business Unit Level**: Within each country, LPOs are grouped by Business Unit
- **Individual LPO Records**: Each BU section displays a table with all tracked LPOs

#### Table Columns
Each LPO record displays the following information:
| Column | Description |
|--------|-------------|
| Serial No. | Auto-generated unique identifier (BU_CODE-YY-XXXX) |
| Date of Request | When the LPO was requested |
| Ticket No. | Associated ticket number |
| Invoice No. & Date | Invoice number and invoice date |
| Total Amount | Total invoice amount |
| Total Qty Rcv'd | Total quantity of items received (calculated from invoice items) |
| Shipment No. | Shipment identifier |
| Status | Current shipment status (color-coded) |
| Costing | Yes/No indicator for costing team communication |
| SP Shipment | Yes/No indicator (with SP Ticket No. if applicable) |
| Actions | Quick links to view invoice and download Excel |

#### Actions
- **View Invoice**: Click the external link icon to navigate to the invoice preview page
- **Download Excel**: Click the download icon to download the invoice Excel file

### 4. **Status Indicators**
The tracker uses color-coded badges for quick identification:
- **Delivered**: Green
- **Pending**: Yellow
- **In Transit**: Blue
- **Other Status**: Gray

### 5. **Expandable Sections**
All sections are collapsible to manage large datasets:
- Click on a **Country** to expand/collapse all Business Units for that country
- Click on a **Business Unit** to expand/collapse the list of LPOs for that unit

## Workflow

### Adding an LPO to Tracker

1. **Upload Invoice** → Create a new invoice upload
2. **View Invoice** → Click on the invoice to view its preview
3. **Add to Tracker** → Click "ADD TO TRACKER" button
4. **Fill Form** → Enter all required tracker details
5. **Submit** → Click "Add to Tracker" in the form
6. **Confirmation** → Success message confirms addition to tracker

### Accessing Tracker Information

1. **Navigate to Tracker** → Click "Tracker" in the main navigation menu
2. **View by Country** → Click on a country name to expand/collapse
3. **View by BU** → Click on a Business Unit to expand/collapse and see LPOs
4. **Interact with LPO** → Click action buttons to view invoice or download files

## Database Schema

### LPOTracker Model

```python
class LPOTracker(db.Model):
    - id: Primary key
    - invoice_id: Foreign key to Invoice (unique)
    - country_id: Foreign key to Country
    - bu_id: Foreign key to BusinessUnit
    - serial_number: Unique identifier (BU_CODE-YY-XXXX format)
    - date_of_request: When LPO was requested
    - ticket_no: Associated ticket number
    - shipment_no: Shipment identifier
    - shipment_status: Current shipment status
    - communicated_with_costing: Boolean flag
    - sp_shipment: Boolean flag
    - sp_ticket_no: SP ticket number (conditional)
    - created_at: Creation timestamp
    - updated_at: Last modification timestamp
```

## API Endpoints

### Tracker Service

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tracker/add` | POST | Add an invoice to tracker |
| `/api/tracker/invoice/<id>` | GET | Get tracker record by invoice ID |
| `/api/tracker/country/<id>` | GET | Get all trackers for a country |
| `/api/tracker/all` | GET | Get all trackers (organized by country/BU) |
| `/api/tracker/<id>` | PATCH | Update tracker record |
| `/api/tracker/<id>` | DELETE | Delete tracker record |

### Request/Response Examples

#### Add to Tracker
```
POST /api/tracker/add
Content-Type: application/json

{
  "invoice_id": 123,
  "date_of_request": "2026-01-20",
  "ticket_no": "TKT-2026-001",
  "shipment_no": "SHP-001",
  "shipment_status": "In Transit",
  "communicated_with_costing": true,
  "sp_shipment": false,
  "sp_ticket_no": null
}
```

#### Response
```
{
  "message": "Successfully added to tracker",
  "tracker": {
    "id": 1,
    "serial_number": "VLG-26-0001",
    "invoice_id": 123,
    "date_of_request": "2026-01-20",
    "ticket_no": "TKT-2026-001",
    ...
  }
}
```

## Frontend Components

### 1. **TrackerPage** (`src/pages/TrackerPage.jsx`)
Main page displaying all tracked LPOs organized by country and BU

### 2. **AddToTrackerForm** (`src/components/AddToTrackerForm.jsx`)
Modal form for adding invoices to the tracker

### 3. **API Service** (`src/services/api.js`)
`trackerService` object with all tracker API methods

## Technical Implementation

### Backend Files Created
- `app/models/lpo_tracker.py` - Database model
- `app/services/tracker_service.py` - Business logic
- `app/routes/tracker.py` - API endpoints

### Frontend Files Created
- `src/pages/TrackerPage.jsx` - Main tracker page
- `src/components/AddToTrackerForm.jsx` - Form component

### Modified Files
- `backend/app/__init__.py` - Register tracker routes and model
- `frontend/src/App.jsx` - Add tracker route
- `frontend/src/services/api.js` - Add tracker service
- `frontend/src/components/Navbar.jsx` - Add tracker navigation link
- `frontend/src/pages/InvoicePreviewPage.jsx` - Add "Add to Tracker" button

## Usage Tips

1. **Bulk Operations**: Use the expandable sections to manage large datasets efficiently
2. **Date Formats**: Dates should be entered in YYYY-MM-DD format
3. **Serial Numbers**: Serial numbers are automatically generated and cannot be modified
4. **Unique Invoices**: Each invoice can only be added to the tracker once
5. **Navigate**: Use the external link icon in the tracker table to quickly access invoice details

## Future Enhancements

Potential features for future releases:
- Edit tracker records after creation
- Bulk import/export of tracker data
- Advanced filtering and search capabilities
- Export tracker data to CSV/Excel
- Tracker analytics and reporting
- Email notifications for shipment status updates
- Integration with external tracking systems
