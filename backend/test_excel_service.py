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
print(f"Testing Excel parsing on: {files[0]}")
print("=" * 60)

# Use the actual service
data = ExcelService.read_supporting_excel(latest)

print(f"\nExtracted {len(data)} items")
print("=" * 60)

# Show first 3 items
for i, item in enumerate(data[:3]):
    print(f"\nItem {i+1}:")
    print(f"  Decathlon SKU: '{item.get('decathlon_sku')}'")
    print(f"  Model: '{item.get('model')}'")
    print(f"  Barcode: '{item.get('barcode')}'")
    print(f"  Quantity: {item.get('quantity')}")
    print(f"  Color|Size: '{item.get('color_size')}'")
