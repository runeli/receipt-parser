# Receipt OCR Test Suite

## Ground Truth Values

### Receipt 1 (receipt1.jpg)

- **VAT**: ALV 24%, Amount: 21.57
- **Final Price**: 164.00
- **Date**: 2019-12-07

### Receipt 2 (receipt2.jpg)

- **VAT**: ALV 10%, Amount: -1.45
- **Final Price**: -15.90 (negative - likely a refund/return)
- **Date**: 2019-10-11

### Receipt 3 (receipt3.jpg)

- **VAT**: ALV 24%, Amount: 5.24
- **Final Price**: 54.97
- **Date**: 2020-11-25

### Receipt 4 (receipt4.jpg)

- **VAT**: ALV 14%, Amount: 4.86
- **Final Price**: 39.60
- **Date**: 2020-11-27

### Receipt 5 (receipt5.jpg)

- **VAT**: None
- **Final Price**: 18.00
- **Date**: 2020-05-15

### Receipt 6 (receipt6.png)

- **VAT**: ALV 24%, Amount: 3.10
- **Final Price**: 15.99
- **Date**: 2025-09-23

### Receipt 7 (receipt7.png) - IKEA Receipt

- **VAT**: MOMS 25%, Amount: 590.20
- **Final Price**: 2,951.00
- **Date**: 2025-10-01

## Running Tests

### Manual Testing

1. Open `index.html` in browser
2. Click each demo receipt
3. Compare output with values above

### Automated Testing

```bash
npm run serve
```

Then open `test-receipts.html` in browser and click "Run All Tests"

## Test Coverage

- **7 receipts total**
- **2 VAT types**: ALV (Finnish), MOMS (Swedish)
- **4 VAT rates**: 10%, 14%, 24%, 25%
- **1 receipt with no VAT**
- **1 receipt with negative values** (refund)
- **Large amount**: 2,951.00 kr (IKEA receipt)
- **Date formats**: YYYY-MM-DD

## Known Issues

Based on initial testing with receipt7:

- OCR sometimes fails to extract correct text from thermal receipts
- Large amounts with thousand separators need better handling
- IKEA-specific format (TOTALT ATT BETALA) needs special patterns
- Date extraction can fail if "DATE:" label is not recognized

## Debugging

When a test fails:

1. Check browser console for OCR extracted text
2. Look for patterns that should have matched
3. Check if text preprocessing is removing important characters
4. Verify regex patterns match the actual OCR output format

