# 📄 Complete Step-by-Step Integration Guide: Regula Document Reader SDK (React Native / Expo)

> **Scope**: This guide covers **ONLY Document Scanning, OCR, MRZ Parsing, and Document/Portrait Image Extraction** using Regula Forensics Document Reader SDK. (No Face Liveness SDK).

---

## 📑 Table of Contents
1. [Architecture & Overview](#1-architecture--overview)
2. [Package Dependencies](#2-package-dependencies)
3. [License Setup (`regula.license`)](#3-license-setup-regulalicense)
4. [Native Android & iOS Configuration](#4-native-android--ios-configuration)
   - [Android Maven Repository & Plugin](#android-maven-repository--plugin)
   - [iOS Info.plist & Bundle Resources](#ios-infoplist--bundle-resources)
5. [Document Reader Service Implementation](#5-document-reader-service-implementation)
6. [Scanning Scenarios Guide](#6-scanning-scenarios-guide)
7. [Extracting Scanned Data & Images](#7-extracting-scanned-data--images)
   - [Text Fields (Name, DOB, Expiry, Document No, Country)](#extracting-text-fields)
   - [Graphic Fields (Full Document Photo, Cropped Portrait)](#extracting-graphic-fields)
8. [Complete Drop-in React Native Component](#8-complete-drop-in-react-native-component)
9. [Android Release & ProGuard Rules](#9-android-release--proguard-rules)
10. [Troubleshooting & Gotchas](#10-troubleshooting--gotchas)

---

## 1. Architecture & Overview

Regula Document Reader SDK provides:
* **Native Camera UI**: High-speed auto-capture with edge detection, orientation correction, and glint removal.
* **MRZ Processing**: Reads Machine Readable Zones (Passports, Visas, ID Cards).
* **Visual OCR**: Extracts text (Name, DOB, Document Number, Expiry, Address).
* **Graphic Extraction**: Crops high-resolution document photo and devotee's portrait photo from the ID card.

---

## 2. Package Dependencies

Install the core Document Reader package and filesystem reader:

### For npm:
```bash
npm install @regulaforensics/react-native-document-reader-api@9.1.369 \
            @regulaforensics/react-native-document-reader-core-mrz@9.1.1664 \
            react-native-fs \
            expo-camera
```

### For yarn:
```bash
yarn add @regulaforensics/react-native-document-reader-api@9.1.369 \
         @regulaforensics/react-native-document-reader-core-mrz@9.1.1664 \
         react-native-fs \
         expo-camera
```

> **Note on Core Modules**:
> * `@regulaforensics/react-native-document-reader-core-mrz`: Lightweight core for MRZ parsing (Passport, travel docs).
> * If you require offline RFID chip reading or complete on-device barcode parsing without internet, you can use `@regulaforensics/react-native-document-reader-core-fullrfid`.

---

## 3. License Setup (`regula.license`)

Regula SDK requires a valid license file named **`regula.license`** issued for your exact:
* **iOS Bundle Identifier** (e.g. `com.yourcompany.app` or `ai.facepe.app`)
* **Android Application ID / Package Name** (e.g. `ai.facepe.app`)

### Where to Place `regula.license`:

1. **Android**:
   * Create directory if missing: `android/app/src/main/assets/`
   * Place `regula.license` inside:
     ```text
     android/app/src/main/assets/regula.license
     ```

2. **iOS**:
   * Place `regula.license` in the root of your iOS project folder so it is included in the App Bundle Resources:
     ```text
     ios/<YourProjectName>/regula.license
     ```

---

## 4. Native Android & iOS Configuration

### Android Maven Repository & Plugin

Regula native Android binaries are hosted on Regula's Maven repository (`https://maven.regulaforensics.com/RegulaDocumentReader`).

If using **Expo Prebuild / EAS Build**, create an Expo Config Plugin:

#### `plugins/withRegulaMaven.js`:
```javascript
const { withProjectBuildGradle, withSettingsGradle } = require('@expo/config-plugins');

const REGULA_MAVEN_URL = 'https://maven.regulaforensics.com/RegulaDocumentReader';
const REGULA_MAVEN_LINE = `        maven { url "${REGULA_MAVEN_URL}" } // Regula Document Reader`;

const withRegulaMaven = (config) => {
  // 1. settings.gradle (Expo SDK 50+ / AGP 7+)
  config = withSettingsGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      if (!config.modResults.contents.includes(REGULA_MAVEN_URL)) {
        config.modResults.contents = config.modResults.contents.replace(
          /(dependencyResolutionManagement\s*\{[\s\S]*?repositories\s*\{)/,
          `$1\n${REGULA_MAVEN_LINE}`
        );
      }
    }
    return config;
  });

  // 2. build.gradle fallback
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      if (!config.modResults.contents.includes(REGULA_MAVEN_URL)) {
        if (config.modResults.contents.includes('allprojects')) {
          config.modResults.contents = config.modResults.contents.replace(
            /(allprojects\s*\{[\s\S]*?repositories\s*\{)/,
            `$1\n${REGULA_MAVEN_LINE}`
          );
        }
      }
    }
    return config;
  });

  return config;
};

module.exports = withRegulaMaven;
```

#### Register in `app.config.js` or `app.json`:
```javascript
module.exports = {
  expo: {
    name: "MyApp",
    slug: "my-app",
    ios: {
      bundleIdentifier: "com.yourcompany.app",
      infoPlist: {
        NSCameraUsageDescription: "Camera access is required for document scanning.",
      }
    },
    android: {
      package: "com.yourcompany.app",
      permissions: [
        "android.permission.CAMERA"
      ]
    },
    plugins: [
      "./plugins/withRegulaMaven",
      [
        "expo-camera",
        {
          cameraPermission: "Camera access is required for document scanning."
        }
      ]
    ]
  }
};
```

---

## 5. Document Reader Service Implementation

Create a clean TypeScript service wrapper [`RegulaDocService.ts`](file:///Users/nick/Documents/FacePe/Facepe%20Deployment/facepe-user-frontend/src/services/RegulaDocService.ts):

```typescript
import { NativeEventEmitter, Platform } from 'react-native';
import DocumentReader, {
  DocReaderConfig,
  ScannerConfig,
  ProcessParams,
  DocumentReaderCompletion,
  RNRegulaDocumentReader,
  Enum,
  ScenarioIdentifier,
} from '@regulaforensics/react-native-document-reader-api';
import RNFS from 'react-native-fs';

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

class RegulaDocService {
  private isInitialized = false;
  private activeScanSubscription: any = null;

  /**
   * 1. Initialize Document Reader SDK with license
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

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
      config.delayedNNLoad = true; // Optimization: fast startup, loads neural network on first scan

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
   * 2. Launch Document Scanner
   */
  async scanDocument(scenario: string = 'MrzAndLocate'): Promise<ScannedDocumentData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!RNRegulaDocumentReader) {
        return reject(new Error('RNRegulaDocumentReader native module is not available.'));
      }

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
            return reject(new Error('USER_CANCELLED'));
          }

          if (action === COMPLETE || action === TIMEOUT) {
            this.activeScanSubscription?.remove();
            if (!completion?.results) {
              return reject(new Error('No results returned from document scanner.'));
            }

            const data = await this.parseResults(completion.results);
            return resolve(data);
          }
        } catch (err) {
          this.activeScanSubscription?.remove();
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
          reject(new Error(typeof error === 'string' ? error : JSON.stringify(error)));
        }
      );
    });
  }

  /**
   * 3. Parse Text and Images from Results
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
    // Primary: Source 3 gives pristine uncompressed camera frame
    let docImage = await getImageBySource(207, 3); // 207 = GF_DOCUMENT_IMAGE
    if (!docImage) docImage = await getImage(207); // Processed document
    if (!docImage) docImage = await getImage(102); // Front page fallback
    data.documentImageBase64 = docImage;

    // --- 3. Extract Cropped Devotee Portrait (Face Photo on Document) ---
    data.portraitImageBase64 = await getImage(201); // 201 = GF_PORTRAIT

    return data;
  }
}

export default new RegulaDocService();
```

---

## 6. Scanning Scenarios Guide

When calling `scanDocument(scenario)`, you can choose based on your project requirements:

| Scenario Constant | Identifier | Best Used For |
| :--- | :--- | :--- |
| `ScenarioIdentifier.SCENARIO_MRZ_AND_LOCATE` | `'MrzAndLocate'` | **Recommended**: Automatically detects document edges, auto-captures when sharp & unblurred, and extracts MRZ. |
| `ScenarioIdentifier.SCENARIO_OCR` | `'Ocr'` | Reads non-MRZ documents (e.g. US Driver's Licenses, PAN cards, Voter IDs). |
| `ScenarioIdentifier.SCENARIO_MRZ` | `'Mrz'` | Fast capture strictly requiring Machine Readable Zone. |
| `ScenarioIdentifier.SCENARIO_LOCATE` | `'Locate'` | Locates document boundaries and captures raw photo without on-device OCR. |
| `ScenarioIdentifier.SCENARIO_FULL_PROCESS` | `'FullProcess'` | Complete on-device authentication, OCR, barcode, and MRZ check. |

---

## 7. Extracting Scanned Data & Images

### Common Regula Field Type Constants (`Enum.eVisualFieldType`):

```typescript
Enum.eVisualFieldType.FT_DOCUMENT_NUMBER         // Document / Passport Number
Enum.eVisualFieldType.FT_DATE_OF_BIRTH           // Date of Birth (YYYY-MM-DD or DD/MM/YYYY)
Enum.eVisualFieldType.FT_DATE_OF_EXPIRY          // Expiration Date
Enum.eVisualFieldType.FT_SURNAME                 // Last Name
Enum.eVisualFieldType.FT_GIVEN_NAMES             // First & Middle Names
Enum.eVisualFieldType.FT_ISSUING_STATE_CODE      // 3-letter Country Code (e.g. USA, IND, GBR)
Enum.eVisualFieldType.FT_NATIONALITY_CODE        // Nationality
Enum.eVisualFieldType.FT_ADDRESS                 // Residential Address (if present)
Enum.eVisualFieldType.FT_MRZ_STRINGS             // Raw MRZ text lines
```

### Common Graphic Field Type Constants (`Enum.eGraphicFieldType`):

```typescript
207  // GF_DOCUMENT_IMAGE (Full cropped document image)
201  // GF_PORTRAIT (Cropped face photo from document)
202  // GF_SIGNATURE (Cropped signature from document)
102  // GF_FRONT (Front page scan)
250  // GF_RAW_IMAGE (Raw full camera buffer frame)
```

---

## 8. Complete Drop-in React Native Component

Create [`DocumentScannerScreen.tsx`](file:///Users/nick/Documents/FacePe/Facepe%20Deployment/facepe-user-frontend/app/DocumentScannerScreen.tsx):

```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Camera } from 'expo-camera';
import RegulaDocService, { ScannedDocumentData } from '../services/RegulaDocService';

export default function DocumentScannerScreen() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScannedDocumentData | null>(null);

  useEffect(() => {
    // Initialize Regula on mount
    (async () => {
      try {
        await RegulaDocService.initialize();
      } catch (err: any) {
        Alert.alert('Initialization Failed', err.message);
      } finally {
        setIsInitializing(false);
      }
    })();
  }, []);

  const handleStartScan = async () => {
    // 1. Check Camera Permission
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to scan documents.');
      return;
    }

    setIsScanning(true);
    try {
      // 2. Open Regula Native Scanner
      const data = await RegulaDocService.scanDocument('MrzAndLocate');
      setScanResult(data);
    } catch (error: any) {
      if (error.message !== 'USER_CANCELLED') {
        Alert.alert('Scan Error', error.message || 'Failed to scan document');
      }
    } finally {
      setIsScanning(false);
    }
  };

  if (isInitializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5F15EE" />
        <Text style={styles.loadingText}>Initializing Document Scanner...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.headerTitle}>Document Verification</Text>
      <Text style={styles.subtitle}>Scan your Passport, Driver's License, or ID Card</Text>

      <TouchableOpacity
        style={styles.scanButton}
        onPress={handleStartScan}
        disabled={isScanning}
      >
        {isScanning ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.scanButtonText}>📸 Scan Document</Text>
        )}
      </TouchableOpacity>

      {/* Render Extracted Results */}
      {scanResult && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Extracted Information</Text>

          {/* Portrait Photo from ID */}
          {scanResult.portraitImageBase64 && (
            <View style={styles.portraitContainer}>
              <Text style={styles.fieldLabel}>Extracted Portrait:</Text>
              <Image
                source={{ uri: `data:image/jpeg;base64,${scanResult.portraitImageBase64}` }}
                style={styles.portraitImage}
              />
            </View>
          )}

          {/* Text Fields */}
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Full Name:</Text>
            <Text style={styles.fieldValue}>{scanResult.fullName || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Document Number:</Text>
            <Text style={styles.fieldValue}>{scanResult.documentNumber || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Date of Birth:</Text>
            <Text style={styles.fieldValue}>{scanResult.dateOfBirth || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Date of Expiry:</Text>
            <Text style={styles.fieldValue}>{scanResult.dateOfExpiry || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Issuing Country:</Text>
            <Text style={styles.fieldValue}>{scanResult.issuingCountry || 'N/A'}</Text>
          </View>

          {/* Full Scanned Document Image */}
          {scanResult.documentImageBase64 && (
            <View style={styles.docImageContainer}>
              <Text style={styles.fieldLabel}>Document Image:</Text>
              <Image
                source={{ uri: `data:image/jpeg;base64,${scanResult.documentImageBase64}` }}
                style={styles.docImage}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#111', marginTop: 40 },
  subtitle: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center', marginBottom: 24 },
  scanButton: {
    backgroundColor: '#5F15EE',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  scanButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  resultCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  fieldValue: { fontSize: 14, color: '#111827', fontWeight: '500' },
  portraitContainer: { alignItems: 'center', marginVertical: 12 },
  portraitImage: { width: 100, height: 130, borderRadius: 8, marginTop: 8, borderWidth: 1, borderColor: '#D1D5DB' },
  docImageContainer: { marginTop: 16 },
  docImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 8 },
});
```

---

## 9. Android Release & ProGuard Rules

If you enable minification / ProGuard in Android release builds (`minifyEnabled true`), add the following rules to `android/app/proguard-rules.pro` to prevent Regula native C++ JNI classes from being stripped:

```proguard
# Regula Document Reader SDK
-keep class com.regula.documentreader.api.** { *; }
-keep interface com.regula.documentreader.api.** { *; }
-keep class com.regula.documentreader.api.results.** { *; }
-keep class com.regula.documentreader.api.params.** { *; }
-keep class com.regula.documentreader.api.enums.** { *; }
```

---

## 10. Troubleshooting & Gotchas

1. **`License is invalid or missing`**:
   * Verify that your `regula.license` was generated for the exact `applicationId` (Android) and `bundleIdentifier` (iOS).
   * Verify that the file is located in `android/app/src/main/assets/regula.license` for Android and root bundle for iOS.

2. **Camera immediately closes upon launch**:
   * Ensure `Camera.requestCameraPermissionsAsync()` was granted before calling `DocumentReader.scan()`. On iOS, if permission is missing, Regula native view controller dismisses instantly without an error callback.

3. **Event Listener Double Triggers**:
   * Always remove previous event listener subscriptions before calling `DocumentReader.scan()` to prevent stale callbacks.

4. **Running in Expo Go**:
   * Regula Document Reader uses native C++ vision libraries. It **cannot run inside Expo Go**. You must test using **EAS Build** (`eas build --profile preview`) or a local development build (`npx expo run:android` / `npx expo run:ios`).
