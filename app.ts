// TypeScript interfaces for our data structures
interface ReceiptData {
  finalPrice: number | null;
  date: string | null;
  rawText: string;
}

// Declare Tesseract types
declare const Tesseract: any;

class ReceiptParser {
  private fileInput!: HTMLInputElement;
  private uploadArea!: HTMLElement;
  private imagePreview!: HTMLImageElement;
  private previewSection!: HTMLElement;
  private loadingSection!: HTMLElement;
  private resultsSection!: HTMLElement;
  private processBtn!: HTMLButtonElement;

  constructor() {
    this.initializeElements();
    this.setupEventListeners();
  }

  private initializeElements(): void {
    this.fileInput = document.getElementById('fileInput') as HTMLInputElement;
    this.uploadArea = document.getElementById('uploadArea') as HTMLElement;
    this.imagePreview = document.getElementById(
      'imagePreview'
    ) as HTMLImageElement;
    this.previewSection = document.getElementById(
      'previewSection'
    ) as HTMLElement;
    this.loadingSection = document.getElementById(
      'loadingSection'
    ) as HTMLElement;
    this.resultsSection = document.getElementById(
      'resultsSection'
    ) as HTMLElement;
    this.processBtn = document.getElementById(
      'processBtn'
    ) as HTMLButtonElement;
  }

  private setupEventListeners(): void {
    // File input change
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // Upload area click
    this.uploadArea.addEventListener('click', () => this.fileInput.click());

    // Drag and drop
    this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.uploadArea.addEventListener('dragleave', (e) =>
      this.handleDragLeave(e)
    );
    this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

    // Process button
    this.processBtn.addEventListener('click', () => this.processImage());

    // Demo receipt cards
    const demoCards = document.querySelectorAll('.demo-card');
    demoCards.forEach((card) => {
      card.addEventListener('click', (e) => {
        const imagePath = (e.currentTarget as HTMLElement).dataset.image;
        if (imagePath) {
          this.loadDemoImage(imagePath);
        }
      });
    });
  }

  private handleDragOver(e: DragEvent): void {
    e.preventDefault();
    this.uploadArea.classList.add('dragover');
  }

  private handleDragLeave(e: DragEvent): void {
    e.preventDefault();
    this.uploadArea.classList.remove('dragover');
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    this.uploadArea.classList.remove('dragover');

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFileSelect(e: Event): void {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        this.imagePreview.src = e.target.result as string;
        this.previewSection.style.display = 'flex';
        this.resultsSection.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);
  }

  private loadDemoImage(imagePath: string): void {
    this.imagePreview.src = imagePath;
    this.previewSection.style.display = 'flex';
    this.resultsSection.style.display = 'none';
  }

  private async processImage(): Promise<void> {
    this.showLoading();

    try {
      // Preprocess image for better OCR
      const optimizedImageSrc = await this.preprocessImageForOCR(
        this.imagePreview.src
      );

      // Try OCR with multiple configurations for better results
      let text = '';
      let bestText = '';
      let bestScore = 0;

      // Configuration 1: High accuracy with Finnish
      try {
        const result1 = await Tesseract.recognize(
          optimizedImageSrc,
          'eng+fin',
          {
            logger: (m: any) => {
              if (m.status === 'recognizing text') {
                const progress = Math.round(m.progress * 50);
                this.updateProgress(progress);
              }
            },
            tessedit_pageseg_mode: Tesseract.PSM.AUTO,
            tessedit_char_whitelist:
              '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzåäöÅÄÖüÜ.,:/%-€$() ',
            tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
            user_defined_dpi: '300',
          }
        );

        const score1 = this.scoreOCRResult(result1.data.text);
        if (score1 > bestScore) {
          bestText = result1.data.text;
          bestScore = score1;
        }
      } catch (e) {
        console.log('First OCR attempt failed, trying alternative...');
      }

      try {
        const result2 = await Tesseract.recognize(optimizedImageSrc, 'eng', {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              const progress = Math.round(50 + m.progress * 50);
              this.updateProgress(progress);
            }
          },
          tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
          tessedit_char_whitelist:
            '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzåäöÅÄÖüÜ.,:/%-€$() ',
          preserve_interword_spaces: '1',
        });

        const score2 = this.scoreOCRResult(result2.data.text);
        if (score2 > bestScore) {
          bestText = result2.data.text;
          bestScore = score2;
        }
      } catch (e) {
        console.log('Second OCR attempt failed');
      }

      text = bestText || 'OCR failed to extract readable text';
      console.log('=== OCR EXTRACTED TEXT ===');
      console.log(text);
      console.log('=== END OCR TEXT ===');

      const receiptData = this.parseReceiptText(text);

      this.displayResults(receiptData);
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Error processing image. Please try again.');
    } finally {
      this.hideLoading();
    }
  }

  private scoreOCRResult(text: string): number {
    let score = 0;

    const indicators = [
      /\d{1,2}[.,]\d{2}/g, // Price patterns
      /\d{1,2}\/\d{1,2}\/\d{4}/g, // Date patterns
      /total|summa|yhteensä/gi, // Total indicators
      /vat|alv|moms/gi, // VAT indicators
      /€|eur/gi, // Currency
      /\d{1,2}\s*%/g, // Percentage
    ];

    indicators.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        score += matches.length * 10;
      }
    });

    // Penalty for excessive noise characters
    const noisePattern = /[\/\\]{3,}|[^a-zA-Z0-9åäöÅÄÖüÜ\s.,:%€$\/()\-]/g;
    const noiseMatches = text.match(noisePattern);
    if (noiseMatches) {
      score -= noiseMatches.length * 2;
    }

    // Bonus for readable words
    const words = text.split(/\s+/).filter((word) => word.length > 2);
    score += words.length;

    return Math.max(0, score);
  }

  private async preprocessImageForOCR(imageSrc: string): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Increase resolution for better OCR
        const maxWidth = 1200;
        const maxHeight = 2400;
        let { width, height } = img;

        // Scale up if too small
        const minWidth = 800;
        if (width < minWidth) {
          height = (height * minWidth) / width;
          width = minWidth;
        }

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Fill with white background first
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to grayscale and apply adaptive threshold
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // First pass: convert to grayscale
        const grayData = new Uint8Array(width * height);
        for (let i = 0; i < data.length; i += 4) {
          const gray =
            0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          grayData[i / 4] = gray;
        }

        // Calculate threshold using Otsu's method for better results
        const threshold = this.calculateOtsuThreshold(grayData);

        // Apply threshold
        for (let i = 0; i < data.length; i += 4) {
          const gray = grayData[i / 4];
          const value = gray > threshold ? 255 : 0;

          data[i] = value;
          data[i + 1] = value;
          data[i + 2] = value;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png', 1.0));
      };

      img.src = imageSrc;
    });
  }

  private calculateOtsuThreshold(grayData: Uint8Array): number {
    // Build histogram
    const histogram = new Array(256).fill(0);
    for (const gray of grayData) {
      histogram[Math.floor(gray)]++;
    }

    // Calculate total
    const total = grayData.length;

    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 128; // default

    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;

      wF = total - wB;
      if (wF === 0) break;

      sumB += t * histogram[t];

      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;

      const variance = wB * wF * (mB - mF) * (mB - mF);

      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = t;
      }
    }

    return threshold;
  }

  private parseReceiptText(text: string): ReceiptData {
    // Clean up the text before parsing
    const cleanedText = this.preprocessText(text);

    const receiptData: ReceiptData = {
      finalPrice: null,
      date: null,
      rawText: text,
    };

    // Parse basic information
    console.log('--- Parsing Final Price ---');
    receiptData.finalPrice = this.parseFinalPrice(cleanedText);
    console.log('Final price result:', receiptData.finalPrice);

    console.log('--- Parsing Date ---');
    receiptData.date = this.parseDate(cleanedText);
    console.log('Date result:', receiptData.date);

    return receiptData;
  }

  private preprocessText(text: string): string {
    let cleaned = text;

    // Remove excessive whitespace and normalize
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // Remove common OCR noise patterns - be more aggressive
    cleaned = cleaned.replace(/[|]/g, ' '); // Remove pipe characters
    // Only remove excessive slashes that are clearly noise (3+ in a row)
    cleaned = cleaned.replace(/[\/\\]{3,}/g, ' '); // Remove 3+ consecutive slashes
    // Remove standalone slashes not part of dates
    cleaned = cleaned.replace(/\s[\/\\]\s/g, ' '); // Remove isolated slashes
    cleaned = cleaned.replace(/[^\w\s\d.,:%€$\/\\\-()äöåÄÖÅüÜ]/g, ' '); // Keep only relevant characters including slashes

    // Remove single character noise (but preserve meaningful single chars)
    cleaned = cleaned.replace(/\b[a-zA-Z]\b(?!\s*[%€$])/g, ' ');

    // Fix common OCR mistakes
    cleaned = cleaned.replace(/\bO\b/g, '0'); // O -> 0
    cleaned = cleaned.replace(/\bl\b/g, '1'); // l -> 1
    cleaned = cleaned.replace(/\bS\b/g, '5'); // S -> 5
    cleaned = cleaned.replace(/\bI\b/g, '1'); // I -> 1

    // Fix Finnish specific OCR issues
    cleaned = cleaned.replace(/sisalt[aä]+/gi, 'sisältää');
    cleaned = cleaned.replace(/arvonlis[aä]+/gi, 'arvonlisäveroa');
    cleaned = cleaned.replace(/yhteens[aä]+/gi, 'yhteensä');

    // Normalize currency and percentage symbols
    cleaned = cleaned.replace(/€/g, ' € ');
    cleaned = cleaned.replace(/%/g, ' % ');
    cleaned = cleaned.replace(/\$|USD/g, ' $ ');

    // Add spaces around numbers for better parsing
    cleaned = cleaned.replace(/(\d+[.,]\d{2})/g, ' $1 ');
    cleaned = cleaned.replace(/(\d{1,2})\s*%/g, ' $1 % ');

    // Clean up multiple spaces again
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    console.log('Cleaned text:', cleaned);
    return cleaned;
  }

  private parseFinalPrice(text: string): number | null {
    // Patterns for final price (common terms in Swedish/Finnish receipts)
    const finalPricePatterns = [
      // OCR errors with mixed separators like "2,95 1.00" or "2,951.00"
      /(\d{1,2}),(\d{2,3})\s+(\d{1,2})\.(\d{2})\s*(?:kr|€|eur|tt)/gi,

      // Space-separated numbers (OCR errors like "2 951 00" or "7 95 0 00")
      /(\d+)\s+(\d{3})\s+(\d{2})\s*(?:kr|€|eur)/gi,
      /(\d+)\s*[.,]?\s*(\d{3})\s*[.,]?\s*(\d{2})\s*(?:kr|€|eur)/gi,

      // IKEA specific - handle OCR errors in "TOTALT ATT BETALA"
      /(?:total?[a-z]*\s+att\s+betala|att\s+betala)[^\d]*(\d+[.,]\d{2})/gi,
      /(?:total?[a-z]*\s+att\s+betala)[^\d]*(\d{1,}\s*[.,]\s*\d{3}[.,]\d{2})/gi,

      // Finnish specific patterns
      /yhteensä\s*:?\s*(\d+[.,]\d{2})/gi,

      // Enhanced patterns for total/final price
      /(?:summa|total|yhteensä|att\s+betala|to\s+pay|slutsumma)\s*:?\s*(\d+[.,]\d{2})/gi,
      /(?:total|summa)\s+(\d+[.,]\d{2})/gi,

      // Look for amounts with thousand separators and "kr"
      /(\d{1,}\s*[.,]\s*\d{3}[.,]\d{2})\s*kr/gi,

      /(\d+[.,]\d{2})\s*(?:kr|€|eur|euro)/gi,

      // Card payment amount (often the final total)
      /(?:card|kort|kortti|credit|debit)\s+(\d+[.,]\d{2})/gi,
      /(\d+[.,]\d{2})\s+(?:card|kort|kortti|credit|debit)/gi,

      // Cash payment amount
      /(?:cash|kontant|käteinen)\s+(\d+[.,]\d{2})/gi,
      /(\d+[.,]\d{2})\s+(?:cash|kontant|käteinen)/gi,

      // Payment method indicators
      /(?:maksukortti|maksutapa)\s*:?\s*(\d+[.,]\d{2})/gi,

      // End of line prices
      /(\d+[.,]\d{2})\s*€?\s*$|(\d+[.,]\d{2})\s*eur\s*$/gm,

      // Amount appearing after all items
      /(?:^|\n)\s*(\d+[.,]\d{2})\s*(?:€|eur|$|\n)/gm,
    ];

    let maxPrice = 0;
    let finalPrice: string | null = null;
    const priceWeights: { [key: string]: number } = {};

    // Look for patterns with different priorities
    for (const pattern of finalPricePatterns) {
      pattern.lastIndex = 0; // Reset regex state
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
          let priceStr = match[1];

          // Handle OCR errors like "2,95 1.00" (4 groups)
          if (match[4]) {
            // Reconstruct as "2951.00" from "2,95 1.00"
            priceStr = match[1] + match[2] + match[3] + '.' + match[4];
          }
          // Handle space-separated numbers (3 groups: "2 951 00")
          else if (match[3]) {
            // Reconstruct as "2951.00"
            priceStr = match[1] + match[2] + '.' + match[3];
          }

          const price = parseFloat(priceStr.replace(',', '.'));

          // Weight prices based on context
          let weight = 1;
          const matchText = match[0].toLowerCase();

          if (matchText.includes('total') || matchText.includes('summa'))
            weight = 10;
          else if (matchText.includes('card') || matchText.includes('kort'))
            weight = 8;
          else if (matchText.includes('cash') || matchText.includes('kontant'))
            weight = 6;
          else if (matchText.includes('€') || matchText.includes('kr'))
            weight = 4;

          // Store weighted score
          const weightedPrice = price * weight;
          if (weightedPrice > (priceWeights[finalPrice || ''] || 0)) {
            maxPrice = price;
            finalPrice = priceStr;
            priceWeights[priceStr] = weightedPrice;
          }
        }
      }
    }

    // If no specific pattern found, look for the largest monetary amount
    // but prefer amounts that appear towards the end of the receipt
    if (!finalPrice) {
      const pricePattern = /(\d+[.,]\d{2})/g;
      let match;
      const textLength = text.length;

      while ((match = pricePattern.exec(text)) !== null) {
        const price = parseFloat(match[1].replace(',', '.'));
        const position = match.index || 0;

        // Prefer prices that appear later in the text (likely to be totals)
        const positionWeight = position / textLength;
        const weightedPrice = price * (1 + positionWeight);

        if (weightedPrice > maxPrice) {
          maxPrice = weightedPrice;
          finalPrice = match[1];
        }
      }
    }

    // Normalize comma to dot and parse to number
    if (finalPrice) {
      const normalized = finalPrice.replace(',', '.');
      const parsed = parseFloat(normalized);
      return isNaN(parsed) ? null : parsed;
    }

    return null;
  }

  private parseDate(text: string): string | null {
    // Date patterns for Swedish/Finnish receipts
    const datePatterns: Array<{ pattern: RegExp; captureGroup?: number }> = [
      // IKEA specific - "DATE: 2025-10-01"
      { pattern: /date\s*:?\s*(\d{4}-\d{1,2}-\d{1,2})/gi, captureGroup: 1 },

      // YYYY-MM-DD (try this early)
      { pattern: /(\d{4})-(\d{1,2})-(\d{1,2})/g },

      // Date with time (DD/MM/YYYY, HH.MM) - like "27/11/2020, 12.33"
      { pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2})\.(\d{1,2})/g },
      // Finnish date format DD.MM.YYYY HH.MM.SS (most common)
      {
        pattern:
          /(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2})\.(\d{1,2})\.(\d{1,2})/g,
      },
      // DD.MM.YYYY or DD/MM/YYYY
      { pattern: /(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/g },
      // DD-MM-YYYY
      { pattern: /(\d{1,2})-(\d{1,2})-(\d{4})/g },
      // Swedish month names
      {
        pattern:
          /(\d{1,2})\s+(jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)\s+(\d{4})/gi,
      },
      // Finnish month names
      {
        pattern:
          /(\d{1,2})\s+(tammi|helmi|maalis|huhti|touko|kesä|heinä|elo|syys|loka|marras|joulu)\s+(\d{4})/gi,
      },
    ];

    for (const { pattern, captureGroup } of datePatterns) {
      const match = pattern.exec(text);
      if (match) {
        return captureGroup ? match[captureGroup] : match[0];
      }
    }

    return null;
  }

  private showLoading(): void {
    this.loadingSection.style.display = 'block';
    this.resultsSection.style.display = 'none';
    this.processBtn.disabled = true;

    // Reset progress
    this.updateProgress(0);
    const loadingText = document.getElementById('loadingText')!;
    loadingText.textContent = 'Optimizing image...';
  }

  private hideLoading(): void {
    this.loadingSection.style.display = 'none';
    this.processBtn.disabled = false;
  }

  private updateProgress(progress: number): void {
    const progressFill = document.getElementById('progressFill')!;
    const progressText = document.getElementById('progressText')!;
    const loadingText = document.getElementById('loadingText')!;

    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;

    if (progress === 0) {
      loadingText.textContent = 'Optimizing image...';
    } else if (progress < 50) {
      loadingText.textContent = 'Analyzing text...';
    } else if (progress < 90) {
      loadingText.textContent = 'Recognizing characters...';
    } else {
      loadingText.textContent = 'Almost done...';
    }
  }

  private displayResults(data: ReceiptData) {
    const jsonDisplay = document.getElementById('jsonDisplay');
    if (!jsonDisplay) return;

    const jsonOutput = {
      finalPrice: data.finalPrice,
      date: data.date,
      extractedAt: new Date().toISOString(),
    };
    jsonDisplay.textContent = JSON.stringify(jsonOutput, null, 2);
    if (this.resultsSection) this.resultsSection.style.display = 'block';
  }
}
document.addEventListener('DOMContentLoaded', () => {
  new ReceiptParser();
});
