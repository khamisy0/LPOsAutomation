from app.services.excel_service import ExcelService
import os

file_path = 'backend/uploads/test_data_extraction.xlsx'
try:
    data = ExcelService.read_supporting_excel(file_path)
    print("Extraction Result:")
    for item in data:
        print(item)
    
    # Validation
    assert len(data) == 2
    assert data[0]['sku'] == '8569472'
    assert data[0]['quantity'] == 10.0
    assert data[0]['unit_cost'] == 50.5
    assert data[0]['unit_retail'] == 100.0
    assert data[0]['color_size'] == '000|8569472'
    
    print("\n✅ Excel Extraction Verification Passed!")
except Exception as e:
    print(f"\n❌ Verification Failed: {e}")
