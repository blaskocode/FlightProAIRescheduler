import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

/**
 * Request camera permissions
 */
export async function requestCameraPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * Take a photo using camera
 */
export async function takePhoto(): Promise<ImagePicker.ImagePickerResult> {
  const hasPermission = await requestCameraPermissions();
  
  if (!hasPermission) {
    throw new Error('Camera permission not granted');
  }

  return await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
}

/**
 * Pick an image from gallery
 */
export async function pickImage(): Promise<ImagePicker.ImagePickerResult> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  if (status !== 'granted') {
    throw new Error('Media library permission not granted');
  }

  return await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });
}

/**
 * Upload photo to backend
 */
export async function uploadPhoto(
  uri: string,
  flightId: string,
  type: 'pre-flight' | 'post-flight'
): Promise<void> {
  const formData = new FormData();
  formData.append('photo', {
    uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);
  formData.append('flightId', flightId);
  formData.append('type', type);

  // Note: This would need proper authentication token
  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/flights/upload-photo`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to upload photo');
  }
}

