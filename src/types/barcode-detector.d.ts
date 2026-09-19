// Minimal ambient type for the Barcode Detection API.
// Not yet in standard TS DOM lib types; supported in Chromium-based browsers,
// not in Safari/iOS, hence the manual-entry fallback in the admin scanner.
interface DetectedBarcode {
  rawValue: string;
}

declare class BarcodeDetector {
  constructor(options?: { formats: string[] });
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

interface Window {
  BarcodeDetector?: typeof BarcodeDetector;
}
