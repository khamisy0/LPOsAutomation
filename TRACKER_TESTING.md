# LPO Tracker - Testing & Validation Guide

## Pre-Test Verification

### Backend Verification
- [ ] All backend files are in place:
  - `app/models/lpo_tracker.py`
  - `app/services/tracker_service.py`
  - `app/routes/tracker.py`
- [ ] `app/__init__.py` has been updated to import lpo_tracker and register tracker blueprint
- [ ] Flask app starts without errors: `python run.py`
- [ ] No import errors in backend

### Frontend Verification
- [ ] All frontend files are in place:
  - `src/pages/TrackerPage.jsx`
  - `src/components/AddToTrackerForm.jsx`
- [ ] `src/App.jsx` has tracker route
- [ ] `src/services/api.js` has trackerService
- [ ] `src/components/Navbar.jsx` has tracker link
- [ ] `src/pages/InvoicePreviewPage.jsx` has "Add to Tracker" button
- [ ] Frontend builds without errors: `npm run dev`

## Test Scenarios

### Scenario 1: Create New Invoice and Add to Tracker

**Steps:**
1. Login to the application
2. Go to "Invoices" → "New Upload"
3. Create a new invoice:
   - Upload invoice file
   - Upload supporting Excel file
   - Select Country: Qatar
   - Select Brand: Any available
   - Select Business Unit: Villagio (or any available)
   - Select Supplier: Any available
4. Click "Generate ERP Excel" to create invoice
5. Wait for success message

**Expected Result:**
- Invoice is created and saved
- You are redirected to invoice preview page

---

### Scenario 2: Add Invoice to Tracker

**Steps:**
1. From invoice preview page, observe the buttons
2. Click **"ADD TO TRACKER"** button (should be visible, not disabled)
3. A form modal should appear with fields:
   - Date of Request (date picker)
   - Ticket No. (text field)
   - Shipment No. (text field)
   - Shipment Status (dropdown)
   - Communicated with Costing Team (checkbox)
   - SP Shipment (checkbox)
4. Fill in the form:
   - Date of Request: Select today's date
   - Ticket No.: "TKT-2026-001"
   - Shipment No.: "SHP-2026-001"
   - Shipment Status: Select "In Transit"
   - Leave other checkboxes unchecked
5. Click **"Add to Tracker"** button

**Expected Result:**
- Success message appears: "Successfully added to tracker!"
- Modal closes after 1.5 seconds
- "ADD TO TRACKER" button becomes disabled
- A success indicator appears in the form

---

### Scenario 3: Test SP Shipment Conditional Field

**Steps:**
1. Go back to invoice preview for a different invoice
2. Click **"ADD TO TRACKER"** button
3. Check the **"SP Shipment"** checkbox
4. Observe the form

**Expected Result:**
- A new field "SP Ticket No." appears below the checkbox
- This field becomes required (validation error if empty)
- Field disappears if you uncheck the checkbox

---

### Scenario 4: Form Validation

**Steps:**
1. Click **"ADD TO TRACKER"** on any invoice
2. Click **"Add to Tracker"** without filling any fields

**Expected Result:**
- Error message: "Date of Request is required"
- Form remains open
- No API call is made

**Additional Validation Tests:**
- Leave only Date of Request empty → Error message appears
- Fill Date of Request, leave Ticket No empty → Error appears
- Fill all required fields except Shipment Status → Error appears
- Check SP Shipment but leave SP Ticket No empty → Error appears

---

### Scenario 5: View Tracker Page

**Steps:**
1. From any page, click **"Tracker"** in the navigation menu
2. You should see the Tracker page

**Expected Result:**
- Page shows "LPO Tracker & Archive" heading
- Tracker data is organized by Country
- You can see countries with tracked LPOs

---

### Scenario 6: Navigate Tracker Hierarchy

**Steps:**
1. On Tracker page, look for a country (e.g., "Qatar")
2. Click on the **"Qatar"** button to expand it

**Expected Result:**
- Country section expands
- Shows "Business Units" section underneath
- Each BU displays: Name, Code, and count of LPOs

**Next Steps:**
3. Click on a Business Unit (e.g., "Villagio")

**Expected Result:**
- BU section expands
- Shows a table with tracked LPOs
- Table has columns:
  - Serial No. (e.g., VLG-26-0001)
  - Date of Request
  - Ticket No.
  - Invoice No. & Date
  - Total Amount
  - Total Qty Rcv'd
  - Shipment No.
  - Status (color-coded)
  - Costing (Yes/No)
  - SP Shipment (Yes/No)
  - Actions (View/Download buttons)

---

### Scenario 7: Serial Number Format Validation

**Steps:**
1. Add multiple invoices to tracker for the same BU
2. Check serial numbers generated

**Expected Results:**
- First LPO: VLG-26-0001 (where VLG is BU code abbreviation, 26 is year)
- Second LPO: VLG-26-0002
- Third LPO: VLG-26-0003
- Pattern: BU_CODE-YY-XXXX (incrementing number)

---

### Scenario 8: View Invoice from Tracker

**Steps:**
1. Go to Tracker page
2. Expand a Country and Business Unit to see LPOs
3. Click the **External Link icon** (→) in the Actions column

**Expected Result:**
- Navigates to the invoice preview page
- Correct invoice is displayed
- All invoice details are visible

---

### Scenario 9: Download Excel from Tracker

**Steps:**
1. On Tracker page, in the Actions column
2. Click the **Download icon** (↓) for an LPO

**Expected Result:**
- Invoice Excel file is downloaded
- File is named correctly (Invoice_<number>_export.xlsx)
- File downloads without errors

---

### Scenario 10: Disable "Add to Tracker" for Existing Trackers

**Steps:**
1. Go to an invoice that's already in the tracker
2. Navigate to its preview page

**Expected Result:**
- **"ADD TO TRACKER"** button is NOT visible
- Only **"GENERATE ERP EXCEL"** button is shown
- This confirms the invoice is in tracker

---

### Scenario 11: Multiple Countries and BUs

**Steps:**
1. Create invoices for different countries and business units
2. Add them all to tracker
3. Go to Tracker page

**Expected Result:**
- Tracker shows all countries
- Each country has its own section
- Within each country, different BUs are organized
- All data is correctly grouped and displayed

---

### Scenario 12: Display of Tracker Details

**Steps:**
1. Add an invoice to tracker with:
   - Date of Request: 2026-01-20
   - Ticket No.: TKT-2026-ABC
   - Shipment No.: SHP-2026-XYZ
   - Shipment Status: Delivered
   - Communicated with Costing: Yes
   - SP Shipment: Yes
   - SP Ticket No.: SPT-2026-123
2. Go to Tracker page and view the entry

**Expected Result:**
- Date of Request shows: 1/20/2026 (formatted date)
- Ticket No.: TKT-2026-ABC
- Shipment No.: SHP-2026-XYZ
- Status shows: "Delivered" (green badge)
- Costing shows: "Yes" (green badge)
- SP Shipment shows: "Yes (SPT-2026-123)" (blue badge)

---

## Error Scenarios

### Error Scenario 1: Add to Tracker Without Invoice BU

**Setup:**
- Create an invoice without a Business Unit assigned

**Steps:**
1. Try to add to tracker

**Expected Result:**
- Error message: "Invoice must have a Business Unit assigned"
- Addition to tracker fails
- No tracker record created

---

### Error Scenario 2: Duplicate Addition

**Setup:**
- Invoice already in tracker

**Steps:**
1. Try to add the same invoice again

**Expected Result:**
- Error message: "Invoice [ID] is already in the tracker"
- No duplicate record created

---

### Error Scenario 3: Network Error During Addition

**Setup:**
- Backend is offline or unreachable

**Steps:**
1. Try to add invoice to tracker

**Expected Result:**
- Error message: "Failed to add to tracker"
- Form remains open for retry
- User can try again

---

## Performance Tests

### Load Test: Large Dataset

**Steps:**
1. Create 100+ tracked LPOs across multiple countries and BUs
2. Go to Tracker page

**Expected Result:**
- Page loads without significant lag
- Expandable sections work smoothly
- No JavaScript errors in console

---

### Expandable Sections Performance

**Steps:**
1. On Tracker page, rapidly click expand/collapse on countries and BUs

**Expected Result:**
- Sections expand/collapse smoothly
- No lag or UI freezing
- Animations are fluid

---

## Responsive Design Tests

### Mobile View (smaller screens)

**Steps:**
1. Open Tracker page on mobile device or browser zoom
2. Try to interact with expandable sections
3. View the data table

**Expected Result:**
- Page is readable and usable
- Table is scrollable horizontally if needed
- Buttons are clickable
- No overlapping elements

---

## Accessibility Tests

**Steps:**
1. Navigate Tracker page using keyboard only
2. Use Tab to move between elements
3. Use Enter to expand/collapse sections
4. Use screen reader (if available)

**Expected Result:**
- All interactive elements are reachable via keyboard
- Focus indicators are visible
- Screen reader announces content appropriately

---

## Data Integrity Tests

### Test 1: Verify Data Persistence

**Steps:**
1. Add invoice to tracker
2. Refresh the browser page
3. Check tracker page

**Expected Result:**
- LPO still appears in tracker
- All details are preserved
- Serial number is unchanged

---

### Test 2: Verify Concurrent Users

**Steps:**
1. Login with two different browser windows (different users)
2. User 1 adds invoice to tracker
3. User 2 views tracker

**Expected Result:**
- User 1's LPO is visible to User 1 in tracker
- User 2 cannot see User 1's data (user isolation)
- Each user only sees their own invoices

---

## Database Tests

**Steps:**
1. Connect to database directly
2. Query `lpo_trackers` table

**Expected Result:**
- Table exists with all columns
- Serial numbers are unique
- Foreign key relationships are valid
- Timestamps are correct

---

## Final Checklist

- [ ] All test scenarios pass
- [ ] No console errors in browser
- [ ] No errors in backend logs
- [ ] Serial numbers generate correctly
- [ ] Data displays in correct hierarchy
- [ ] All buttons and links work
- [ ] Form validation works
- [ ] Responsive design looks good
- [ ] Performance is acceptable
- [ ] Data persists after refresh
- [ ] User isolation is maintained

## Sign-Off

When all tests pass, the LPO Tracker feature is ready for production deployment.

**Tested By:** _________________ 
**Date:** _________________ 
**Status:** ☐ PASS ☐ FAIL
