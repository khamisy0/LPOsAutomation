# LPO Tracker Implementation - Setup & Deployment Guide

## Summary of Changes

This document outlines all the changes made to implement the LPO Tracker & Archive feature.

## Backend Changes

### New Files Created

1. **`backend/app/models/lpo_tracker.py`**
   - New database model for tracking LPOs
   - Stores: serial number, invoice reference, tracker details, dates
   - Relationships: Invoice, Country, BusinessUnit

2. **`backend/app/services/tracker_service.py`**
   - Business logic for tracker operations
   - Methods:
     - `generate_serial_number(bu_id)` - Auto-generates BU_CODE-YY-XXXX format
     - `add_to_tracker(invoice_id, data)` - Adds invoice to tracker
     - `get_trackers_by_country_and_bu(country_id, bu_id)` - Retrieves trackers
     - `get_all_countries_with_trackers()` - Gets hierarchical view
     - `update_tracker(tracker_id, data)` - Updates tracker record
     - `delete_tracker(tracker_id)` - Deletes tracker record
     - `get_tracker_by_invoice(invoice_id)` - Gets tracker by invoice

3. **`backend/app/routes/tracker.py`**
   - API endpoints for tracker operations
   - Endpoints:
     - POST `/api/tracker/add` - Add to tracker
     - GET `/api/tracker/invoice/<id>` - Get tracker by invoice
     - GET `/api/tracker/country/<id>` - Get trackers by country
     - GET `/api/tracker/all` - Get all trackers
     - PATCH `/api/tracker/<id>` - Update tracker
     - DELETE `/api/tracker/<id>` - Delete tracker

### Files Modified

1. **`backend/app/__init__.py`**
   - Added import for `lpo_tracker` model
   - Registered `tracker` blueprint
   - Updated `db.create_all()` to include new model

## Frontend Changes

### New Files Created

1. **`frontend/src/pages/TrackerPage.jsx`**
   - Main tracker page displaying all LPOs
   - Organized by Country and Business Unit
   - Expandable sections for better UX
   - Table with all tracker details
   - Action buttons to view invoices and download files

2. **`frontend/src/components/AddToTrackerForm.jsx`**
   - Modal form for adding invoices to tracker
   - Form fields:
     - Date of Request
     - Ticket No.
     - Shipment No.
     - Shipment Status (dropdown)
     - Communicated with Costing Team (checkbox)
     - SP Shipment (checkbox)
     - SP Ticket No. (conditional)
   - Validation and error handling
   - Success confirmation

### Files Modified

1. **`frontend/src/App.jsx`**
   - Added import for `TrackerPage`
   - Added route: `/tracker` → `<TrackerPage />`
   - Added route: `/invoices/:invoiceId` (shorthand for preview page)

2. **`frontend/src/services/api.js`**
   - Added `trackerService` object with methods:
     - `addToTracker(data)`
     - `getTrackerByInvoice(invoiceId)`
     - `getTrackersByCountry(countryId)`
     - `getAllTrackers()`
     - `updateTracker(trackerId, data)`
     - `deleteTracker(trackerId)`

3. **`frontend/src/components/Navbar.jsx`**
   - Added "Tracker" navigation link
   - Route: `/tracker`

4. **`frontend/src/pages/InvoicePreviewPage.jsx`**
   - Added import for `AddToTrackerForm` component
   - Added import for `trackerService`
   - Added state: `isTrackerFormOpen`, `isInTracker`
   - Added check for existing tracker record on invoice load
   - Added "ADD TO TRACKER" button (disabled if already in tracker)
   - Integrated AddToTrackerForm modal

## Database Schema

### New Table: `lpo_trackers`

```sql
CREATE TABLE lpo_trackers (
    id INTEGER PRIMARY KEY,
    invoice_id INTEGER NOT NULL UNIQUE,
    country_id INTEGER NOT NULL,
    bu_id INTEGER NOT NULL,
    serial_number VARCHAR(50) NOT NULL UNIQUE,
    date_of_request VARCHAR(8),
    ticket_no VARCHAR(50),
    shipment_no VARCHAR(50),
    shipment_status VARCHAR(50),
    communicated_with_costing BOOLEAN DEFAULT FALSE,
    sp_shipment BOOLEAN DEFAULT FALSE,
    sp_ticket_no VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (country_id) REFERENCES countries(id),
    FOREIGN KEY (bu_id) REFERENCES business_units(id)
);
```

## Deployment Steps

### 1. Backend Setup
```bash
cd backend

# Ensure virtual environment is active
# Install any new dependencies (if needed)
pip install -r requirements.txt

# The database table will be created automatically on first app startup
# due to db.create_all() in app/__init__.py
```

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# No additional builds needed
```

### 3. Start Services
```bash
# Terminal 1 - Backend
cd backend
python run.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Database Migration
- The LPOTracker table will be created automatically when the Flask app starts
- No manual migration scripts needed
- Existing data is unaffected

## Feature Highlights

### Serial Number Generation
- **Format**: `BU_CODE-YY-XXXX`
- **Auto-generated**: Unique per BU per year
- **Example**: VLG-26-0001 for Villagio BU in 2026
- **Automatic**: No manual entry required

### Organization
- **Hierarchical**: Country → Business Unit → LPO Records
- **Expandable**: All sections collapsible for better UX
- **Color-coded**: Status indicators for quick identification

### Data Captured
- Request date and ticket information
- Shipment details and status
- Costing team communication tracking
- Special (SP) shipment handling
- Invoice linkage and download capability

## Testing Checklist

- [ ] Backend: App starts without errors
- [ ] Frontend: App builds without errors
- [ ] Database: Table created successfully
- [ ] Add to Tracker: Button appears on invoice preview
- [ ] Add to Tracker: Form validates required fields
- [ ] Add to Tracker: Serial number generated correctly
- [ ] Tracker Page: Displays organized data by Country/BU
- [ ] Tracker Page: Expandable sections work
- [ ] Tracker Page: Action buttons work (view/download)
- [ ] Navigation: Tracker link appears in navbar
- [ ] Navigation: Routes to tracker page
- [ ] Button Disabled: "Add to Tracker" disabled if already in tracker

## API Response Examples

### Get All Trackers
```json
{
  "data": [
    {
      "country": {
        "id": 1,
        "country_name": "Qatar",
        "name": "Qatar"
      },
      "business_units": [
        {
          "bu": {
            "id": 1,
            "bu_code": "VLG",
            "store_name": "Villagio",
            "code": "VLG",
            "name": "Villagio"
          },
          "trackers": [
            {
              "id": 1,
              "serial_number": "VLG-26-0001",
              "invoice_id": 1,
              "invoice_number": "INV-001",
              "invoice_date": "20260120",
              "total_amount": 5000.00,
              "total_quantity_received": 100,
              "date_of_request": "20260115",
              "ticket_no": "TKT-001",
              "shipment_no": "SHP-001",
              "shipment_status": "In Transit",
              "communicated_with_costing": true,
              "sp_shipment": false,
              "sp_ticket_no": null
            }
          ]
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Serial Number Not Generated
- Ensure Business Unit exists and has bu_id assigned to invoice
- Check database connection is working
- Verify BU abbreviation has at least 1 character

### "Add to Tracker" Button Not Showing
- Check if invoice already has a tracker record
- Verify invoice belongs to current user
- Check browser console for JavaScript errors

### Tracker Page Empty
- Verify invoices are properly created
- Check if any invoices have been added to tracker
- Verify database table exists: `lpo_trackers`

### Invoice Not Found When Adding
- Ensure invoice ID is valid
- Verify invoice belongs to logged-in user
- Check invoice has country_id and bu_id assigned

## Future Enhancements

1. Edit tracker records after creation
2. Bulk operations (add/remove multiple)
3. Advanced filtering and search
4. Export to CSV/Excel
5. Tracker analytics and reporting
6. Email notifications for status changes
7. External system integration

## Support

For issues or questions:
1. Check the LPO_TRACKER_GUIDE.md for user documentation
2. Review API responses in browser developer console
3. Check backend logs for error messages
4. Verify all files are correctly placed
