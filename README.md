# Receipt OCR Parser

Browser-based OCR tool for extracting prices and dates from receipts. Built with TypeScript and Tesseract.js.

## What it does

- Drag & drop receipt images or upload from filesystem
- Extracts final price and receipt date
- Returns structured JSON output
- Everything runs client-side (no server needed)

## Quick start

```bash
npm install
npm run build
npm run serve
```

Then open http://localhost:8000

Or just open `index.html` directly in a browser.

## How to use

1. Drop a receipt image on the page (or click to upload)
2. Click "Process Receipt"
3. Wait for OCR to finish (takes ~5-15 seconds)
4. Get JSON with extracted data

## Docker

```bash
npm run docker:compose:up
```

See [DOCKER.md](DOCKER.md) for details.

## Tech

- TypeScript (vanilla, no frameworks)
- Tesseract.js v5
- Tesseract loaded from CDN

## Development

Auto-rebuild on changes:

```bash
npm run watch
```

Or build manually:

```bash
npm run build
```

## Testing

Run automated tests on all 7 demo receipts:

```bash
npm test
```

Then open http://localhost:8000/test-receipts.html

See [TESTING.md](TESTING.md) for ground truth values.

## Known issues

- OCR is slow on big images (10-20 seconds sometimes)
- Accuracy varies wildly depending on photo quality
- Sometimes grabs the wrong number as the total
- Works better with Finnish receipts than Swedish (more training data in Tesseract)
- Blurry or dark photos usually fail

## Privacy

Everything runs in your browser. No data sent anywhere.
