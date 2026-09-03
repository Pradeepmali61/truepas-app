/**
 * In-memory store for passing scanned document images between screens.
 * Route params can't handle large base64 images, so we use this temporary store.
 * Data is cleared after consumption.
 *
 * Per REACT_NATIVE_KYC_INTEGRATION_GUIDE.md §6:
 * - frontImageBase64: captured photo of document front (required)
 * - selfieImageBase64: captured selfie for face match (for portrait documents)
 * - backImageBase64: captured photo of document back (optional)
 */

interface ScanResultState {
  documentImageBase64?: string;
  selfieBase64?: string;
  backImageBase64?: string;
}

let scanResult: ScanResultState | null = null;

export function setScanResult(data: ScanResultState): void {
  scanResult = data;
}

export function getScanResult(): ScanResultState | null {
  return scanResult;
}

export function clearScanResult(): void {
  scanResult = null;
}
