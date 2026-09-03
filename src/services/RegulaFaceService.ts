import { Platform } from 'react-native';

// Dynamic require wrapped in try/catch so app doesn't crash in Expo Go
let FaceSDKClass: any = null;
let FaceSDKInstance: any = null;
let RNFS: any = null;

try {
  const faceModule = require('@regulaforensics/face-sdk');
  FaceSDKClass = faceModule.FaceSDK;
  FaceSDKInstance = FaceSDKClass?.instance;
  RNFS = require('react-native-fs');
} catch {
  // Native modules unavailable (running in Expo Go)
}

export interface LivenessResult {
  /** 0 = PASSED, 1 = FAILED */
  liveness: number;
  /** Captured selfie in base64 */
  image: string;
  /** Optional session ID for backend tracking */
  sessionId?: string;
  /** Whether liveness check passed */
  passed: boolean;
}

/** Returns true if Regula Face SDK native module is available. */
export function isRegulaFaceAvailable(): boolean {
  return FaceSDKInstance !== null && RNFS !== null;
}

class RegulaFaceService {
  private isInitialized = false;

  /**
   * Initialize Face SDK with license.
   * Reads the license file from platform-specific location.
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (!FaceSDKInstance || !RNFS) {
      throw new Error('Regula Face SDK native module is not available. Requires a development build.');
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

      const [success, error] = await FaceSDKInstance.initialize({ license: licenseBase64 });
      if (success) {
        this.isInitialized = true;
        return true;
      } else {
        throw new Error(`Face SDK initialization failed: ${error}`);
      }
    } catch (error: any) {
      console.error('[RegulaFaceService] Init Error:', error);
      throw error;
    }
  }

  /**
   * Start automatic liveness detection.
   * Regula opens native camera UI, runs random challenges (blink, smile,
   * head turn), performs anti-spoofing, and auto-captures a selfie.
   *
   * @returns LivenessResult with liveness status and captured selfie base64
   */
  async startLiveness(): Promise<LivenessResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!FaceSDKInstance) {
      throw new Error('Regula Face SDK is not available.');
    }

    const response = await FaceSDKInstance.startLiveness();

    return {
      liveness: response.liveness,
      image: response.image,
      sessionId: response.sessionId,
      passed: response.liveness === 0, // 0 = PASSED, 1 = FAILED
    };
  }

  /** Check if the Face SDK is initialized and ready. */
  isReady(): boolean {
    return this.isInitialized && FaceSDKInstance !== null;
  }
}

export default new RegulaFaceService();
