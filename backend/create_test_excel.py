import openpyxl

wb = openpyxl.Workbook()
ws = wb.active

# Headers as per user request
headers = ['Barcode', 'Decathlon SKU', 'QTY', 'Unit Cost without VAT', 'Unit Retail With VAT']
ws.append(headers)

# Test Data
# Row 1: Barcode=123456789, SKU=8569472, QTY=10, Cost=50.5, Retail=100.0
# Row 2: Barcode=987654321, SKU=8888888, QTY=5, Cost=20.0, Retail=45.0
data = [
    ['123456789', '8569472', 10, 50.5, 100.0],
    ['987654321', '8888888', 5, 20.0, 45.0]
]

for row in data:
    ws.append(row)

wb.save('backend/uploads/test_data_extraction.xlsx')
print("Created test_data_extraction.xlsx")
