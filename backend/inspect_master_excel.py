import openpyxl
import os

folder = r"C:\Users\Lenovo\Desktop\Projects\LPOs Automation\excel-sheets-dbupload"
files = ["Suppliers Sheet.xlsx", "Brands Sheet.xlsx"]

for f in files:
    path = os.path.join(folder, f)
    print(f"\n--- Checking {f} ---")
    try:
        wb = openpyxl.load_workbook(path)
        sheet = wb.active
        
        # Print Header
        headers = [cell.value for cell in sheet[1]]
        print(f"Headers: {headers}")
        
        # Print First Row
        if sheet.max_row > 1:
            row1 = [cell.value for cell in sheet[2]]
            print(f"Row 1: {row1}")
        else:
            print("Empty sheet")
            
    except Exception as e:
        print(f"Error: {e}")
