import openpyxl
import os
import sys
sys.path.insert(0, '.')

from app.services.excel_service import ExcelService

# Find latest Excel file
files = [f for f in os.listdir('uploads') if f.endswith('.xlsx')]
files.sort(key=lambda x: os.path.getmtime(os.path.join('uploads', x)), reverse=True)

if not files:
    print("No Excel files found")
    exit()

latest = f'uploads/{files[0]}'
print(f"Testing matching logic with: {files[0]}")
print("=" * 60)

# Extract Excel data
excel_data = ExcelService.read_supporting_excel(latest)

print(f"\nExtracted {len(excel_data)} items from Excel")

# Simulate manual input
manual_sku = "5564436"  # What user might enter in Model field

print(f"\nTesting match with manual SKU: '{manual_sku}' (type: {type(manual_sku)})")
print("=" * 60)

# Try matching (same logic as invoice.py line 158-160)
excel_match = next((x for x in excel_data if 
                    (str(x.get('decathlon_sku', '')).strip() == manual_sku) or 
                    (str(x.get('model', '')).strip() == manual_sku)), None)

if excel_match:
    print("✓ MATCH FOUND!")
    print(f"  Excel Decathlon SKU: '{excel_match.get('decathlon_sku')}' (type: {type(excel_match.get('decathlon_sku'))})")
    print(f"  Excel Model: '{excel_match.get('model')}'")
    print(f"  Quantity: {excel_match.get('quantity')}")
else:
    print("✗ NO MATCH FOUND")
    print("\nFirst Excel item for comparison:")
    print(f"  Excel Decathlon SKU: '{excel_data[0].get('decathlon_sku')}' (type: {type(excel_data[0].get('decathlon_sku'))})")
    print(f"  str(Excel SKU): '{str(excel_data[0].get('decathlon_sku', '')).strip()}'")
    print(f"  Manual SKU: '{manual_sku}'")
    print(f"  Are they equal? {str(excel_data[0].get('decathlon_sku', '')).strip() == manual_sku}")
