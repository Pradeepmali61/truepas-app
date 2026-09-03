import { NativeEventEmitter, Platform } from 'react-native';

// Dynamic require wrapped in try/catch so app doesn't crash in Expo Go
let DocumentReader: any = null;
let DocReaderConfig: any = null;
let ScannerConfig: any = null;
let ProcessParams: any = null;
let DocumentReaderCompletion: any = null;
let RNRegulaDocumentReader: any = null;
let Enum: any = null;
let ScenarioIdentifier: any = null;
let RNFS: any = null;

try {
  const docModule = require('@regulaforensics/react-native-document-reader-api');
  DocumentReader = docModule.default;
  DocReaderConfig = docModule.DocReaderConfig;
  ScannerConfig = docModule.ScannerConfig;
  ProcessParams = docModule.ProcessParams;
  DocumentReaderCompletion = docModule.DocumentReaderCompletion;
  RNRegulaDocumentReader = docModule.RNRegulaDocumentReader;
  Enum = docModule.Enum;
  ScenarioIdentifier = docModule.ScenarioIdentifier;
  RNFS = require('react-native-fs');
} catch {
  // Native modules unavailable (running in Expo Go)
}

export interface ScannedDocumentData {
  documentType?: string;
  documentNumber?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
  dateOfExpiry?: string;
  issuingCountry?: string;
  nationality?: string;
  mrzString?: string;
  documentImageBase64?: string;
  portraitImageBase64?: string;
  rawResults?: any;
}

/** Returns true if Regula Document Reader native module is available. */
export function isRegulaDocAvailable(): boolean {
  return DocumentReader !== null && RNFS !== null;
}

class RegulaDocService {
  private isInitialized = false;
  private activeScanSubscription: any = null;

  /**
   * Initialize Document Reader SDK with license.
   * Reads the license file from platform-specific location.
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (!DocumentReader || !RNFS) {
      throw new Error('Regula Document Reader native module is not available. Requires a development build.');
    }

    try {
      let licenseBase64: string;

      if (Platform.OS === 'android') {
        licenseBase64 = await RNFS.readFileAssets('regula.license', 'base64');
      } else {
        licenseBase64 = await RNFS.readFile(`${RNFS.MainBundlePath}/regula.license`, 'base64');
      }

      if (!licenseBase64) {
        throw new Error('Could not find regula.license file in assets/bundle.');
      }

      const config = new DocReaderConfig();
      config.license = licenseBase64;
      config.delayedNNLoad = true; // Fast startup, loads neural network on first scan

      return new Promise((resolve, reject) => {
        DocumentReader.initializeReader(
          config,
          (_response: string) => {
            this.isInitialized = true;

            // Configure default image capture behavior
            if (ProcessParams) {
              const params = new ProcessParams();
              params.returnUncroppedImage = true; // Full raw frame
              params.returnCroppedBarcode = true;
              DocumentReader.setProcessParams(params, () => {}, () => {});
            }

            resolve(true);
          },
          (error: string) => {
            reject(new Error(`Regula Document Reader initialization failed: ${error}`));
          }
        );
      });
    } catch (error: any) {
      console.error('[RegulaDocService] Init Error:', error);
      throw error;
    }
  }

  /**
   * Launch Document Scanner with the given scenario.
   * Returns scanned data including OCR text fields and images.
   */
  async scanDocument(scenario: string = 'MrzAndLocate'): Promise<ScannedDocumentData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!RNRegulaDocumentReader) {
      throw new Error('RNRegulaDocumentReader native module is not available.');
    }

    return new Promise((resolve, reject) => {
      const eventManager = new NativeEventEmitter(RNRegulaDocumentReader);

      // Clean up any stale subscription
      if (this.activeScanSubscription) {
        this.activeScanSubscription.remove();
      }

      this.activeScanSubscription = eventManager.addListener('completion', async (event: any) => {
        try {
          const rawMsg = event?.msg || event?.message || event;
          const parsed = typeof rawMsg === 'string' ? JSON.parse(rawMsg) : rawMsg;
          const completion = DocumentReaderCompletion.fromJson(parsed);

          const action = completion?.action;
          const COMPLETE = Enum?.DocReaderAction?.COMPLETE ?? 0;
          const TIMEOUT = Enum?.DocReaderAction?.TIMEOUT ?? 6;
          const CANCEL = Enum?.DocReaderAction?.CANCEL ?? 1;

          if (action === CANCEL) {
            this.activeScanSubscription?.remove();
            this.activeScanSubscription = null;
            return reject(new Error('USER_CANCELLED'));
          }

          if (action === COMPLETE || action === TIMEOUT) {
            this.activeScanSubscription?.remove();
            this.activeScanSubscription = null;
            if (!completion?.results) {
              return reject(new Error('No results returned from document scanner.'));
            }

            const data = await this.parseResults(completion.results);
            return resolve(data);
          }
        } catch (err) {
          this.activeScanSubscription?.remove();
          this.activeScanSubscription = null;
          return reject(err);
        }
      });

      // Configure scanner
      const scannerConfig = new ScannerConfig();
      scannerConfig.scenario = scenario;

      DocumentReader.scan(
        scannerConfig,
        () => {},
        (error: any) => {
          this.activeScanSubscription?.remove();
          this.activeScanSubscription = null;
          reject(new Error(typeof error === 'string' ? error : JSON.stringify(error)));
        }
      );
    });
  }

  /**
   * Parse text and images from scan results.
   */
  private async parseResults(results: any): Promise<ScannedDocumentData> {
    const data: ScannedDocumentData = {
      rawResults: results,
    };

    // Helper: Extract String by Field Type
    const getField = (fieldType: number): Promise<string | undefined> =>
      new Promise((res) => {
        results.getTextFieldValueByType(
          fieldType,
          (val: string) => res(val || undefined),
          () => res(undefined)
        );
      });

    // Helper: Extract Image Base64 by Field Type
    const getImage = (fieldType: number): Promise<string | undefined> =>
      new Promise((res) => {
        results.graphicFieldImageByType(
          fieldType,
          (b64: string) => res(b64 || undefined),
          () => res(undefined)
        );
      });

    // Helper: Extract Image from Specific Source (source 3 = raw camera frame)
    const getImageBySource = (fieldType: number, source: number): Promise<string | undefined> =>
      new Promise((res) => {
        results.graphicFieldImageByTypeSource(
          fieldType,
          source,
          (b64: string) => res(b64 || undefined),
          () => res(undefined)
        );
      });

    // --- 1. Extract Text Fields ---
    data.firstName = await getField(Enum.eVisualFieldType.FT_SURNAME_AND_GIVEN_NAMES) ||
                     await getField(Enum.eVisualFieldType.FT_GIVEN_NAMES);
    data.lastName = await getField(Enum.eVisualFieldType.FT_SURNAME);
    data.fullName = [data.firstName, data.lastName].filter(Boolean).join(' ');
    data.documentNumber = await getField(Enum.eVisualFieldType.FT_DOCUMENT_NUMBER);
    data.dateOfBirth = await getField(Enum.eVisualFieldType.FT_DATE_OF_BIRTH);
    data.dateOfExpiry = await getField(Enum.eVisualFieldType.FT_DATE_OF_EXPIRY);
    data.issuingCountry = await getField(Enum.eVisualFieldType.FT_ISSUING_STATE_CODE);
    data.nationality = await getField(Enum.eVisualFieldType.FT_NATIONALITY_CODE);
    data.mrzString = await getField(Enum.eVisualFieldType.FT_MRZ_STRINGS);

    // --- 2. Extract Document Image (Full Front Photo) ---
    let docImage = await getImageBySource(207, 3); // 207 = GF_DOCUMENT_IMAGE, source 3 = raw camera
    if (!docImage) docImage = await getImage(207); // Processed document
    if (!docImage) docImage = await getImage(102); // Front page fallback
    data.documentImageBase64 = docImage;

    // --- 3. Extract Cropped Portrait (Face Photo on Document) ---
    data.portraitImageBase64 = await getImage(201); // 201 = GF_PORTRAIT

    return data;
  }
}

export default new RegulaDocService();
