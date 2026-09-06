/**
 * Regula Document Reader integration — mirrors facepe-user-frontend verify.tsx.
 *
 * The Regula SDK provides a NATIVE full-screen scanner UI that handles:
 *   - real-time document edge detection
 *   - auto-capture when aligned + in focus
 *   - cropping + perspective correction to the document bounds
 *
 * The app never does manual crop math — the SDK returns an already-cropped,
 * rectangular document image which we forward to the backend as base64
 * (per REACT_NATIVE_KYC_INTEGRATION_GUIDE.md §6.3).
 *
 * Native modules are lazy-required inside try/catch so the JS bundle still
 * runs in Expo Go (where they're unavailable) — callers must check
 * isRegulaAvailable() and fall back to the manual expo-camera flow.
 */

// ── Lazy native module holders ─────────────────────────────────────────────
let DocumentReader: any = null;
let DocReaderConfig: any = null;
let ScannerConfig: any = null;
let DocReaderAction: any = null;
let DocumentReaderCompletion: any = null;
let ProcessParams: any = null;
let RNRegulaDocumentReader: any = null;
let Enum: any = null;
let ScenarioIdentifier: any = null;

let loadAttempted = false;

function loadNativeModules(): boolean {
  if (loadAttempted) return DocumentReader != null;
  loadAttempted = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const docModule = require('@regulaforensics/react-native-document-reader-api');
    DocumentReader = docModule.default;
    DocReaderConfig = docModule.DocReaderConfig;
    ScannerConfig = docModule.ScannerConfig;
    DocReaderAction = docModule.DocReaderAction;
    DocumentReaderCompletion = docModule.DocumentReaderCompletion;
    ProcessParams = docModule.ProcessParams;
    RNRegulaDocumentReader = docModule.RNRegulaDocumentReader;
    Enum = docModule.Enum;
    ScenarioIdentifier = docModule.ScenarioIdentifier;
  } catch {
    // Native modules unavailable (Expo Go) — caller must fall back
  }
  return DocumentReader != null;
}

/** True when the Regula native modules are present (dev build / standalone). */
export function isRegulaAvailable(): boolean {
  return loadNativeModules();
}

// ── State ──────────────────────────────────────────────────────────────────
let initialized = false;
let initPromise: Promise<void> | null = null;
let initError: string | null = null;

/** Resolve the license base64 from the bundled asset. */
async function loadLicense(): Promise<string> {
  // Metro treats .license as an asset (see metro.config.js assetExts).
  // Asset.fromModule resolves to a local file URI we can read as base64.
  const { Asset } = require('expo-asset');
  const assetModule = require('../../assets/regula.license');
  const asset = Asset.fromModule(assetModule);
  if (!asset.downloaded && !asset.localUri) {
    await asset.downloadAsync();
  }
  const uri = asset.localUri ?? asset.uri;

  // expo-file-system SDK 57 API
  const { File, Paths } = require('expo-file-system');
  const file = new File(uri.startsWith('file://') ? uri : `${Paths.document}/${uri}`);
  if (!file.exists) {
    throw new Error(`regula.license not found at ${uri}`);
  }
  return file.base64();
}

/**
 * Initialize the Document Reader with the bundled license.
 * Idempotent — concurrent callers share one init promise.
 */
export function initializeRegula(): Promise<void> {
  if (!loadNativeModules()) {
    return Promise.reject(new Error('Regula native modules not available'));
  }
  if (initialized) return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const licenseBase64 = await loadLicense();
      const config = new DocReaderConfig();
      config.license = licenseBase64;
      config.delayedNNLoad = true;

      await new Promise<void>((resolve, reject) => {
        DocumentReader.initializeReader(
          config,
          () => {
            // Request the raw uncropped camera image for backend processing
            if (ProcessParams) {
              const pp = new ProcessParams();
              pp.returnUncroppedImage = true;
              DocumentReader.setProcessParams(pp, () => {}, () => {});
            }
            initialized = true;
            initError = null;
            console.log('[Regula] Document Reader initialized');
            resolve();
          },
          (err: string) => {
            const errMsg = `Regula init failed: ${err}`;
            console.error('[Regula]', errMsg);
            initError = errMsg;
            initPromise = null;
            reject(new Error(errMsg));
          },
        );
      });
    } catch (e: any) {
      initError = e?.message ?? 'Regula init exception';
      initPromise = null;
      throw e;
    }
  })();

  return initPromise;
}

/** Last initialization error, if any. */
export function getRegulaInitError(): string | null {
  return initError;
}

// ── Scanning ───────────────────────────────────────────────────────────────

/** Extract a graphic field image from scan results as base64 (or null). */
function extractImage(results: any, fieldType: number): Promise<string | null> {
  return new Promise((resolve) => {
    results.graphicFieldImageByType(
      fieldType,
      (b64: string) => resolve(b64 || null),
      () => resolve(null),
    );
  });
}

/** Extract the raw camera frame (source=3) — the original unprocessed photo. */
function extractRawFrame(results: any): Promise<string | null> {
  return new Promise((resolve) => {
    results.graphicFieldImageByTypeSource(
      207, // GF_DOCUMENT_IMAGE
      3, // raw camera source
      (b64: string) => resolve(b64 || null),
      () => resolve(null),
    );
  });
}

export class RegulaScanCancelled extends Error {
  constructor() {
    super('Scan cancelled by user');
    this.name = 'RegulaScanCancelled';
  }
}

/**
 * Open the native Regula scanner and resolve with the cropped document
 * image as base64. Rejects with RegulaScanCancelled if the user cancels.
 */
export function scanDocument(): Promise<string> {
  if (!loadNativeModules() || !initialized) {
    return Promise.reject(new Error('Regula scanner not initialized'));
  }

  return new Promise<string>((resolve, reject) => {
    let settled = false;

    // Results arrive via NativeEventEmitter 'completion' (not the scan callback)
    const eventManager = new (require('react-native').NativeEventEmitter)(RNRegulaDocumentReader);
    const subscription = eventManager.addListener('completion', async (event: any) => {
      if (settled) return;
      try {
        const rawMsg = event?.msg || event?.message || event;
        const parsed = typeof rawMsg === 'string' ? JSON.parse(rawMsg) : rawMsg;
        const completion = DocumentReaderCompletion.fromJson(parsed);

        const action = completion?.action;
        const COMPLETE = Enum?.DocReaderAction?.COMPLETE ?? 0;
        const TIMEOUT = Enum?.DocReaderAction?.TIMEOUT ?? 6;
        if (action !== COMPLETE && action !== TIMEOUT) return; // intermediate progress
        if (!completion?.results) return;

        settled = true;
        subscription.remove();

        // PRIMARY: raw camera frame (source=3) — best input for backend OCR
        let imageBase64: string | null = await extractRawFrame(completion.results);
        // FALLBACK 1: processed document image (207)
        if (!imageBase64) imageBase64 = await extractImage(completion.results, 207);
        // FALLBACK 2: front page image (102)
        if (!imageBase64) imageBase64 = await extractImage(completion.results, 102);
        // FALLBACK 3: any other graphic field (250)
        if (!imageBase64) imageBase64 = await extractImage(completion.results, 250);

        if (!imageBase64) {
          reject(new Error('Scanner did not return an image. Please try again and hold the document steady.'));
          return;
        }

        console.log('[Regula] Scan complete — image length:', imageBase64.length);
        resolve(imageBase64);
      } catch (e: any) {
        settled = true;
        subscription.remove();
        reject(e);
      }
    });

    const config = new ScannerConfig();
    // MrzAndLocate: captures a high-quality raw camera image on-device;
    // backend Regula does full OCR/classification server-side.
    config.scenario = ScenarioIdentifier?.SCENARIO_MRZ_AND_LOCATE ?? 'MrzAndLocate';

    DocumentReader.scan(
      config,
      () => {},
      (error: any) => {
        if (settled) return;
        settled = true;
        subscription.remove();
        const errMsg = typeof error === 'string' ? error : JSON.stringify(error);
        if (errMsg && /cancel/i.test(errMsg)) {
          reject(new RegulaScanCancelled());
          return;
        }
        reject(new Error(errMsg || 'Scanner error'));
      },
    );
  });
}
