import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, firestore, storage } from '../../firebase';

/**
 * ProfilePictureService
 * Handles all profile picture operations: picking, uploading to Firebase Storage,
 * and updating Firestore with the download URL.
 */

export interface PickImageResult {
  uri: string;
  width: number;
  height: number;
  size?: number;
  type?: string;
}

/**
 * Request camera roll permissions and pick an image
 * @returns Promise<PickImageResult | null> - Image data or null if cancelled
 */
export async function pickImage(): Promise<PickImageResult | null> {
  try {
    // Request media library permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      console.warn('Permission to access media library was denied');
      return null;
    }

    // Launch image picker with square aspect ratio
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [1, 1], // Square image
      quality: 0.9,
      allowsEditing: true,
      base64: false,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      size: asset.fileSize,
      type: asset.type,
    };
  } catch (error) {
    console.error('Error picking image:', error);
    throw new Error('Failed to pick image. Please try again.');
  }
}

/**
 * Upload image to Firebase Storage
 * @param imageUri - Local URI of the image file
 * @param uid - User ID for the storage path
 * @returns Promise<string> - Download URL of the uploaded image
 */
export async function uploadProfileImage(imageUri: string, uid: string): Promise<string> {
  try {
    if (!uid) {
      throw new Error('User ID is required for upload');
    }

    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create storage reference: profileImages/{uid}.jpg
    const storageRef = ref(storage, `profileImages/${uid}.jpg`);

    // Upload the blob
    await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    // Get and return the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Profile image uploaded successfully:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Failed to upload image. Please check your connection and try again.');
  }
}

/**
 * Update user's Firestore document with profile picture URL
 * @param uid - User ID
 * @param profilePicUrl - Download URL from Firebase Storage
 * @returns Promise<void>
 */
export async function updateUserProfilePic(uid: string, profilePicUrl: string): Promise<void> {
  try {
    if (!uid) {
      throw new Error('User ID is required');
    }

    // Reference to user document in Firestore
    const userDocRef = doc(firestore, 'users', uid);

    // Update the profilePic field
    await updateDoc(userDocRef, {
      profilePic: profilePicUrl,
      updatedAt: new Date().toISOString(),
    });

    console.log('User profile picture updated in Firestore');
  } catch (error) {
    console.error('Error updating user profile picture:', error);
    throw new Error('Failed to update profile. Please try again.');
  }
}

/**
 * Delete old profile picture from Firebase Storage (optional cleanup)
 * @param uid - User ID
 * @returns Promise<void>
 */
export async function deleteOldProfileImage(uid: string): Promise<void> {
  try {
    const storageRef = ref(storage, `profileImages/${uid}.jpg`);

    await deleteObject(storageRef);
    console.log('Old profile image deleted');
  } catch (error) {
    // It's ok if the old image doesn't exist
    if ((error as any).code !== 'storage/object-not-found') {
      console.warn('Error deleting old profile image:', error);
    }
  }
}

/**
 * Main controller function: handles the entire flow of changing profile picture
 * 1. Pick image
 * 2. Delete old image (if exists)
 * 3. Upload new image
 * 4. Update Firestore
 * 5. Return new URL for UI update
 * 
 * @returns Promise<string | null> - New profile picture URL or null if cancelled
 */
export async function onChangeProfilePic(): Promise<string | null> {
  try {
    // Step 1: Get current user
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const uid = currentUser.uid;

    // Step 2: Pick image from device
    const imageData = await pickImage();
    if (!imageData) {
      // User cancelled the picker
      return null;
    }

    // Step 3: Delete old profile image (if it exists)
    try {
      await deleteOldProfileImage(uid);
    } catch (error) {
      console.warn('Could not delete old image, continuing...', error);
    }

    // Step 4: Upload new image to Firebase Storage
    const downloadURL = await uploadProfileImage(imageData.uri, uid);

    // Step 5: Update Firestore with new URL
    await updateUserProfilePic(uid, downloadURL);

    // Step 6: Return new URL for UI update
    return downloadURL;
  } catch (error) {
    console.error('Error in profile picture change flow:', error);
    throw error;
  }
}
