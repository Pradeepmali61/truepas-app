/**
 * Local device storage for the user's profile picture.
 *
 * The backend profile-picture endpoint (S3-backed) is not available yet, so
 * the picked image is persisted locally and shown instantly. When the backend
 * ships, the upload call takes precedence and this file acts as an offline
 * fallback.
 *
 * Uses the SDK 57 expo-file-system API (Directory / File classes).
 * Stored at: <documentDirectory>/profile-image.jpg
 */
import { Directory, EncodingType, File, Paths } from 'expo-file-system';

const FILE_NAME = 'profile-image.jpg';

function profileFile(): File {
  return new File(Paths.document, FILE_NAME);
}

/** Save a picked image locally (accepts a file URI). Returns the local URI. */
export async function saveLocalProfileImage(imageUri: string): Promise<string> {
  const dir = Paths.document;
  if (!(dir instanceof Directory ? dir.exists : true)) {
    new Directory(dir).create({ idempotent: true });
  }
  const dest = profileFile();
  const src = new File(imageUri);
  if (dest.exists) dest.delete();
  // Copy via base64 round-trip (keeps it simple and consistent with docImageStore).
  const base64 = await src.base64();
  dest.write(base64, { encoding: EncodingType.Base64 });
  return dest.uri;
}

/** Get the locally stored profile image URI, or null. */
export async function getLocalProfileImage(): Promise<string | null> {
  const file = profileFile();
  return file.exists ? file.uri : null;
}

/** Remove the locally stored profile image. */
export async function clearLocalProfileImage(): Promise<void> {
  const file = profileFile();
  if (file.exists) file.delete();
}

// ── Family member profile pictures ──────────────────────────────────────
// Stored per member: <documentDirectory>/member-<personId>-image.jpg

function memberFile(personId: string): File {
  return new File(Paths.document, `member-${personId}-image.jpg`);
}

/** Save a family member's profile picture locally. Returns the local URI. */
export async function saveMemberProfileImage(personId: string, imageUri: string): Promise<string> {
  const dir = Paths.document;
  if (!(dir instanceof Directory ? dir.exists : true)) {
    new Directory(dir).create({ idempotent: true });
  }
  const dest = memberFile(personId);
  const src = new File(imageUri);
  if (dest.exists) dest.delete();
  const base64 = await src.base64();
  dest.write(base64, { encoding: EncodingType.Base64 });
  return dest.uri;
}

/** Get a family member's locally stored profile picture URI, or null. */
export async function getMemberProfileImage(personId: string): Promise<string | null> {
  const file = memberFile(personId);
  return file.exists ? file.uri : null;
}
