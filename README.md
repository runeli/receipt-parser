# Receipt OCR Parser

A TypeScript browser application that uses OCR to extract VAT, final price, and date information from Swedish and Finnish receipts.

## Features

- 📄 **Image Upload**: Drag & drop or click to upload receipt images
- 🔍 **OCR Processing**: Uses Tesseract.js for client-side optical character recognition
- 🇸🇪🇫🇮 **Multi-language Support**: Recognizes Swedish (MOMS) and Finnish (ALV) VAT formats
- 💰 **Price Extraction**: Automatically finds the final total amount
- 📅 **Date Recognition**: Extracts receipt dates in various formats
- 🎨 **Modern UI**: Beautiful, responsive design with real-time processing feedback
- 📋 **JSON Output**: Structured data output with copy-to-clipboard functionality

## Supported VAT Formats

- **Finnish**: ALV (Arvonlisävero)
- **Swedish**: MOMS (Mervärdesskatt)
- **Generic**: VAT

## Supported Date Formats

- DD.MM.YYYY / DD/MM/YYYY
- DD-MM-YYYY
- YYYY-MM-DD
- Swedish month names (jan, feb, mar, etc.)
- Finnish month names (tammi, helmi, maalis, etc.)

## Usage

1. **Open the Application**: Open `index.html` in a modern web browser
2. **Upload Image**:
   - Drag and drop a receipt image onto the upload area, or
   - Click the upload area to browse and select an image file
3. **Process Receipt**: Click the "Process Receipt" button
4. **View Results**: The extracted information will be displayed in cards and as JSON

## Technical Details

- **Frontend-only**: No backend required, all processing happens in the browser
- **OCR Engine**: Tesseract.js v5 with English, Swedish, and Finnish language support
- **Languages**: Pure TypeScript compiled to ES2018
- **Dependencies**: Only Tesseract.js (loaded via CDN)

## File Structure

```
ocr/
├── index.html          # Main HTML file
├── styles.css          # Styling and responsive design
├── app.ts             # TypeScript source code
├── app.js             # Compiled JavaScript
├── package.json       # Project configuration
├── tsconfig.json      # TypeScript configuration
└── README.md          # This file
```

## Development

To modify the application:

1. Edit `app.ts` for functionality changes
2. Edit `styles.css` for styling changes
3. Compile TypeScript: `tsc app.ts --target es2018 --lib es2018,dom --outDir . --strict`
4. Open `index.html` in a browser to test

## Browser Compatibility

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+

## Known Limitations

- OCR accuracy depends on image quality and text clarity
- Processing time varies based on image size and complexity
- Best results with high-contrast, well-lit receipt images
- Currently optimized for Swedish and Finnish receipt formats

## Privacy

All processing happens locally in your browser. No images or data are sent to external servers.
# receipt-parser
