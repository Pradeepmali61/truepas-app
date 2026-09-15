import { CameraUnavailable, loadPhotoCapture } from '@/features/liveness/cameraModule';

/** Add family — photo enrollment for under-5 members. The impl lives in
 *  features/liveness/PhotoCapture and is lazy-required: it statically imports
 *  react-native-vision-camera, which throws on builds without NitroModules. */
const Photo = loadPhotoCapture();

export default function FamilyPhotoCaptureScreen() {
  return Photo ? <Photo /> : <CameraUnavailable />;
}
