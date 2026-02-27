import re
from datetime import datetime

def extract_invoice_number(text):
    """Extract invoice number from OCR text"""
    # Patterns ordered by specificity - look for exact label matches first
    patterns = [
        # Match "Inv. No." specifically (your format)
        r'(?i)inv\.?\s*no\.?\s*[:\-]?\s*([A-Z0-9\-\.\/]+?)(?:\s|$)',
        r'(?i)invoice\s*no\.?\s*[:\-]?\s*([A-Z0-9\-\.\/]+?)(?:\s|$)',
        
        # More flexible patterns
        r'(?i)inv(?:oice)?\s*(?:number|no\.?|#)[:\s]+([A-Z0-9\-\.\/]+?)(?:\s|$)',
        r'(?i)invoice[:\s#]*([A-Z0-9\-\.\/]+?)(?:\s|$)',
        
        # Fallback - numbers with context
        r'(?i)(?:ref|reference|doc|document)[.\s]*(?:number|no\.?|#)?[:\s]*([A-Z0-9\-\.\/]{4,})',
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE)
        for match in matches:
            val = match.group(1).strip()
            
            # Clean up whitespace and OCR artifacts
            val = re.sub(r'[\s\n\r]+', '', val)  # Remove extra whitespace
            
            # Basic validation
            if len(val) >= 2 and len(val) <= 30:
                # Should have at least one digit or letter
                if any(c.isalnum() for c in val):
                    # Reject common false positives
                    if val.upper() not in ['PAGE', 'TOTAL', 'DATE', 'NOTES', 'TERMS', 'AMOUNT', 'REF', 'NO']:
                        return val
    
    return None

def extract_invoice_date(text):
    """Extract invoice date and convert to YYYYMMDD format"""
    # Try multiple date patterns with different separators
    patterns = [
        # Explicit "Date" label (your format)
        r'(?i)date\s*[:\-]?\s*(\d{1,4}[-/]\d{1,2}[-/]\d{1,4})',
        r'(?i)invoice\s*date\s*[:\-]?\s*(\d{1,4}[-/]\d{1,2}[-/]\d{1,4})',
        
        # Generic date patterns (DD/MM/YYYY, MM/DD/YYYY, etc.)
        r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})',
        r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})',
        
        # With month names
        r'(\d{1,2}[-/](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/]\d{4})',
        
        # Less strict - just look after date label
        r'(?i)date[:\s]+([0-9/\-]+)',
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            date_str = match.group(1).strip()
            
            # Try to parse the date
            try:
                # Clean up the date string
                date_str_clean = re.sub(r'[\s/\-_]+', '/', date_str)
                
                # List of common date formats to try
                formats = [
                    '%d/%m/%Y', '%d-%m-%Y',
                    '%m/%d/%Y', '%m-%d-%Y',
                    '%Y-%m-%d', '%Y/%m/%d',
                    '%d/%m/%y', '%d-%m-%y',
                    '%m/%d/%y', '%m-%d-%y',
                    '%d-%b-%Y', '%d/%b/%Y',
                    '%d-%b-%y', '%d/%b/%y',
                ]
                
                for fmt in formats:
                    try:
                        date_obj = datetime.strptime(date_str_clean, fmt)
                        # Sanity check: invoice dates should be reasonable
                        from datetime import timedelta
                        now = datetime.now()
                        if (now - timedelta(days=730)) <= date_obj <= (now + timedelta(days=30)):
                            return date_obj.strftime('%Y%m%d')
                    except ValueError:
                        continue
            except Exception as e:
                continue
    
    return None

def extract_total_amount(text):
    """Extract total amount from OCR text"""
    # Split text into lines for better processing
    lines = text.split('\n')
    
    # Patterns to look for - ordered by specificity
    patterns = [
        # High priority - explicit "Total" label (your format)
        r'(?i)total\s*[:\-]?\s*(?:[A-Z]{1,3}[\s.]*)?\s*([\d,\.]+)',
        r'(?i)grand\s*total\s*[:\-]?\s*(?:[A-Z]{1,3}[\s.]*)?\s*([\d,\.]+)',
        r'(?i)total\s*(?:amount|invoice)\s*[:\-]?\s*(?:[A-Z]{1,3}[\s.]*)?\s*([\d,\.]+)',
        
        # Medium priority
        r'(?i)net\s*(?:amount|payable|am)?\s*[:\-]?\s*(?:[A-Z]{1,3}[\s.]*)?\s*([\d,\.]+)',
        r'(?i)sum\s*[:\-]?\s*(?:[A-Z]{1,3}[\s.]*)?\s*([\d,\.]+)',
        
        # Currency + amount patterns
        r'(?:[A-Z]{3}|[A-Z]{2})\s*[:]?\s*([\d,\.]+)',
    ]
    
    best_match = None
    best_priority = -1
    
    # Search lines in reverse order (last occurrence usually has the total)
    for line_num, line in enumerate(reversed(lines)):
        # Skip empty lines and short lines
        if len(line.strip()) < 3:
            continue
            
        # Higher priority for lines further down
        position_priority = len(lines) - line_num
        
        for pattern_idx, pattern in enumerate(patterns):
            # Higher priority for patterns earlier in list
            pattern_priority = len(patterns) - pattern_idx
            
            matches = re.finditer(pattern, line)
            for match in matches:
                try:
                    val_str = match.group(1).strip()
                    
                    # Remove spaces from numbers
                    val_str = val_str.replace(' ', '')
                    
                    # Normalize number format
                    if ',' in val_str and '.' in val_str:
                        last_comma = val_str.rfind(',')
                        last_dot = val_str.rfind('.')
                        if last_dot > last_comma:
                            # US: 1,234.56
                            val_str = val_str.replace(',', '')
                        else:
                            # EU: 1.234,56
                            val_str = val_str.replace('.', '').replace(',', '.')
                    elif ',' in val_str:
                        # Check if decimal or thousands
                        if len(val_str.split(',')[-1]) in [2, 3]:
                            # Likely decimal (,45 or ,456)
                            val_str = val_str.replace(',', '.')
                        else:
                            # Likely thousands
                            val_str = val_str.replace(',', '')
                    
                    amount = float(val_str)
                    
                    # Sanity check - reasonable invoice range
                    if amount > 0 and amount < 100000000:
                        # Combined priority: position matters most, then pattern type, then amount
                        combined_priority = (position_priority * 10000) + (pattern_priority * 100) + (amount / 1000000)
                        if combined_priority > best_priority:
                            best_priority = combined_priority
                            best_match = amount
                except (ValueError, AttributeError):
                    continue
    
    return best_match

def generate_itemcode(season, supplier_code, decathlon_sku):
    """Generate itemcode: Season + SupplierCode + DecathlonSKU"""
    return f"{season}{supplier_code}{decathlon_sku}"

def normalize_currency(currency):
    """Normalize currency codes"""
    currency_map = {
        'qar': 'QAR',
        'aed': 'AED',
        'usd': 'USD',
        'eur': 'EUR',
        'gbp': 'GBP',
        'jod': 'JOD',
        'lbp': 'LBP',
        'omr': 'OMR',
        'kwd': 'KWD',
    }
    return currency_map.get(currency.lower(), currency.upper())
