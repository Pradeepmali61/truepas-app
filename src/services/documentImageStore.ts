/**
 * Local filesystem-backed store for captured document images.
 *
 * The backend GET /documents/{id} does not return the captured photo,
 * so we persist the front (and optional back/selfie) image to the device
 * filesystem keyed by documentId. This lets the document detail screen
 * show the originally captured photo when the user taps a document.
 *
 * Uses the SDK 57 expo-file-system API (Directory / File classes).
 * Files are stored under: <documentDirectory>/doc-images/<documentId>/
 */
import { Directory, EncodingType, File, Paths } from 'expo-file-system';

const BASE_DIR_NAME = 'doc-images';

function docDir(documentId: string): Directory {
  return new Directory(Paths.document, BASE_DIR_NAME, documentId);
}

function docFile(documentId: string, kind: 'front' | 'back' | 'selfie'): File {
  return new File(docDir(documentId), `${kind}.jpg`);
}

/**
 * Save captured images for a document.
 * Accepts raw base64 (without data-uri prefix) or data-uri strings.
 */
export async function saveDocumentImages(
  documentId: string,
  images: { front?: string; back?: string; selfie?: string },
): Promise<void> {
  if (!documentId) return;

  const base = new Directory(Paths.document, BASE_DIR_NAME);
  if (!base.exists) {
    base.create({ idempotent: true });
  }

  const dir = docDir(documentId);
  if (!dir.exists) {
    dir.create({ idempotent: true });
  }

  const kinds: Array<'front' | 'back' | 'selfie'> = ['front', 'back', 'selfie'];
  for (const kind of kinds) {
    const data = images[kind];
    if (!data) continue;
    const base64 = stripDataUri(data);
    const file = docFile(documentId, kind);
    file.write(base64, { encoding: EncodingType.Base64 });
  }
}

/**
 * Get the local file URI for a document's captured image.
 * Returns null if the file does not exist.
 */
export async function getDocumentImageUri(
  documentId: string,
  kind: 'front' | 'back' | 'selfie' = 'front',
): Promise<string | null> {
  if (!documentId) return null;
  const file = docFile(documentId, kind);
  return file.exists ? file.uri : null;
}

/**
 * Remove stored images for a document.
 */
export async function clearDocumentImages(documentId: string): Promise<void> {
  if (!documentId) return;
  const dir = docDir(documentId);
  if (dir.exists) {
    dir.delete();
  }
}

/** Strip a data-uri prefix (e.g. "data:image/jpeg;base64,") if present. */
function stripDataUri(data: string): string {
  const commaIdx = data.indexOf(',');
  if (commaIdx !== -1 && data.startsWith('data:')) {
    return data.substring(commaIdx + 1);
  }
  return data;
}
