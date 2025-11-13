import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from '../../firebase';
import { CloudinaryService } from './cloudinaryService';

/**
 * ProfilePictureService
 * Handles all profile picture operations: picking, uploading to Cloudinary,
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
 * Upload profile image to Cloudinary
 * @param imageUri - Local URI of the image file
 * @returns Promise<string> - Download URL of the uploaded image
 */
export async function uploadProfileImage(imageUri: string): Promise<string> {
  try {
    // Upload to Cloudinary using the profile-specific method
    const uploadResult = await CloudinaryService.uploadProfileToCloudinary(imageUri);

    if (uploadResult.success && uploadResult.url) {
      console.log('Profile image uploaded successfully to Cloudinary:', uploadResult.url);
      return uploadResult.url;
    } else {
      throw new Error(uploadResult.error || 'Failed to upload image to Cloudinary');
    }
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error('Failed to upload image. Please check your connection and try again.');
  }
}

/**
 * Update user's Firestore document with profile picture URL
 * @param uid - User ID
 * @param profilePicUrl - Download URL from Cloudinary
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
 * Save profile pic URL to Firestore
 * @param uid - User ID
 * @param cloudinaryUrl - Cloudinary secure_url
 * @returns Promise<void>
 */
export async function saveProfilePicToFirestore(uid: string, cloudinaryUrl: string): Promise<void> {
  try {
    await updateUserProfilePic(uid, cloudinaryUrl);
  } catch (error) {
    console.error('Error saving profile pic to Firestore:', error);
    throw error;
  }
}

/**
 * Pick profile image and get URI
 * @returns Promise<string | null> - Image URI or null if cancelled
 */
export async function pickProfileImage(): Promise<string | null> {
  try {
    const imageData = await pickImage();
    return imageData ? imageData.uri : null;
  } catch (error) {
    console.error('Error picking profile image:', error);
    throw error;
  }
}

/**
 * Main controller function: handles the entire flow of changing profile picture
 * 1. Pick image
 * 2. Upload to Cloudinary
 * 3. Update Firestore
 * 4. Return new URL for UI update
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

    // Step 3: Upload image to Cloudinary
    const downloadURL = await uploadProfileImage(imageData.uri);

    // Step 4: Update Firestore with new URL
    await updateUserProfilePic(uid, downloadURL);

    // Step 5: Return new URL for UI update
    return downloadURL;
  } catch (error) {
    console.error('Error in profile picture change flow:', error);
    throw error;
  }
}
