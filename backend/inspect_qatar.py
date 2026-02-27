import openpyxl
import os

DATA_DIR = r"C:\Users\Lenovo\Desktop\Projects\LPOs Automation\excel-sheets-dbupload"

def inspect_qatar():
    path = os.path.join(DATA_DIR, "Suppliers Sheet.xlsx")
    wb = openpyxl.load_workbook(path)
    sheet = wb.active
    rows = list(sheet.iter_rows(values_only=True))
    header = rows[0]
    
    print(f"Header: {header}")
    
    # Find indices
    try:
        c_idx = -1
        b_idx = -1
        for i, h in enumerate(header):
            if str(h).lower() in ['country', 'country_name']: c_idx = i
            if str(h).lower() in ['brand', 'brand_name']: b_idx = i
            
        print(f"Country Index: {c_idx}, Brand Index: {b_idx}")
        
        count = 0
        for row in rows[1:]:
            c_val = row[c_idx]
            b_val = row[b_idx]
            if str(c_val).strip() == 'Qatar':
                print(f"Row {rows.index(row)+1}: Country='{c_val}', Brand='{b_val}'")
                count += 1
                if count > 5: break
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    inspect_qatar()
