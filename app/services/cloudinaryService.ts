import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

// Cloudinary configuration
const CLOUD_NAME = 'dmxl5oa3h';
const UPLOAD_PRESET = 'Group-Study-App Upload';

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export interface PickedImage {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

export interface PickedDocument {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

export class CloudinaryService {
  /**
   * Pick image from gallery or camera
   */
  static async pickImage(useCamera: boolean = false): Promise<PickedImage | null> {
    try {
      // Request permissions
      const { status } = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Permission to access camera/gallery was denied');
      }

      // Launch picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
          size: asset.fileSize
        };
      }

      return null;
    } catch (error: any) {
      console.error('Error picking image:', error);
      throw new Error(`Failed to pick image: ${error.message}`);
    }
  }

  /**
   * Take photo with camera
   */
  static async takePhoto(): Promise<PickedImage | null> {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Permission to access camera was denied');
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          size: asset.fileSize
        };
      }

      return null;
    } catch (error: any) {
      console.error('Error taking photo:', error);
      throw new Error(`Failed to take photo: ${error.message}`);
    }
  }

  /**
   * Pick PDF document
   */
  static async pickPDF(): Promise<PickedDocument | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          type: asset.mimeType || 'application/pdf',
          name: asset.name,
          size: asset.size || undefined
        };
      }

      return null;
    } catch (error: any) {
      console.error('Error picking PDF:', error);
      throw new Error(`Failed to pick PDF: ${error.message}`);
    }
  }

  /**
   * Upload image to Cloudinary
   */
  static async uploadImageToCloudinary(imageUri: string): Promise<CloudinaryUploadResult> {
    try {
      if (!imageUri) {
        throw new Error('Image URI is required');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `image_${Date.now()}.jpg`,
      } as any);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('cloud_name', CLOUD_NAME);

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.secure_url) {
        return {
          success: true,
          url: responseData.secure_url,
          publicId: responseData.public_id,
        };
      } else {
        console.error('Cloudinary upload error:', responseData);
        return {
          success: false,
          error: responseData.error?.message || 'Upload failed',
        };
      }
    } catch (error: any) {
      console.error('Error uploading image to Cloudinary:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  }

  /**
   * Upload PDF to Cloudinary
   */
  static async uploadPDFToCloudinary(pdfUri: string, fileName?: string): Promise<CloudinaryUploadResult> {
    try {
      if (!pdfUri) {
        throw new Error('PDF URI is required');
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', {
        uri: pdfUri,
        type: 'application/pdf',
        name: fileName || `document_${Date.now()}.pdf`,
      } as any);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('cloud_name', CLOUD_NAME);

      // Upload to Cloudinary as raw file
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.secure_url) {
        return {
          success: true,
          url: responseData.secure_url,
          publicId: responseData.public_id,
        };
      } else {
        console.error('Cloudinary PDF upload error:', responseData);
        return {
          success: false,
          error: responseData.error?.message || 'Upload failed',
        };
      }
    } catch (error: any) {
      console.error('Error uploading PDF to Cloudinary:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  }

  /**
   * Upload profile picture to Cloudinary
   */
  static async uploadProfileToCloudinary(imageUri: string): Promise<CloudinaryUploadResult> {
    try {
      if (!imageUri) {
        throw new Error('Image URI is required');
      }

      // Create FormData with profile-specific settings
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `profile_${Date.now()}.jpg`,
      } as any);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('cloud_name', CLOUD_NAME);
      formData.append('folder', 'profile_pictures');
      formData.append('transformation', 'c_fill,g_face,h_400,w_400');

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const responseData = await response.json();

      if (response.ok && responseData.secure_url) {
        return {
          success: true,
          url: responseData.secure_url,
          publicId: responseData.public_id,
        };
      } else {
        console.error('Cloudinary profile upload error:', responseData);
        return {
          success: false,
          error: responseData.error?.message || 'Upload failed',
        };
      }
    } catch (error: any) {
      console.error('Error uploading profile image to Cloudinary:', error);
      return {
        success: false,
        error: error.message || 'Upload failed',
      };
    }
  }

  /**
   * Delete image from Cloudinary (optional)
   */
  static async deleteFromCloudinary(publicId: string): Promise<boolean> {
    try {
      // Note: For security, deletion should typically be done from your backend
      // This is a simplified version for development
      console.log('Delete operation for publicId:', publicId);
      
      // In a production app, you would make a request to your backend
      // which would then handle the deletion using Cloudinary's Admin API
      
      return true;
    } catch (error: any) {
      console.error('Error deleting from Cloudinary:', error);
      return false;
    }
  }

  /**
   * Get optimized image URL for different sizes
   */
  static getOptimizedImageUrl(
    originalUrl: string,
    width: number = 400,
    height: number = 400,
    crop: string = 'fill'
  ): string {
    try {
      // Extract public ID from Cloudinary URL
      const urlParts = originalUrl.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      
      if (uploadIndex === -1) {
        return originalUrl;
      }

      // Insert transformation parameters
      const beforeTransformation = urlParts.slice(0, uploadIndex + 1);
      const afterTransformation = urlParts.slice(uploadIndex + 1);
      
      const transformation = `c_${crop},w_${width},h_${height},f_auto,q_auto`;
      
      return [...beforeTransformation, transformation, ...afterTransformation].join('/');
    } catch (error) {
      console.error('Error creating optimized URL:', error);
      return originalUrl;
    }
  }

  /**
   * Format PDF URL for proper viewing
   * Ensures Cloudinary PDF URLs are accessible and properly formatted
   */
  static formatPDFUrl(url: string): string {
    try {
      // Cloudinary raw file URLs should be directly accessible as-is
      // The URL format is: https://res.cloudinary.com/{cloud_name}/raw/upload/{version}/{public_id}
      // We don't need to modify the URL structure, just return it
      // The system PDF viewer or browser should handle it correctly
      return url;
    } catch (error) {
      console.error('Error formatting PDF URL:', error);
      return url;
    }
  }
}