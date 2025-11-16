import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { AuthService } from '../services/authService';
import { ChatService } from '../services/chatService';
import { CloudinaryService } from '../services/cloudinaryService';

interface FileHandlerProps {
  groupId: string;
  colors: any;
}

export const FileHandler = {
  /**
   * Send image message to group
   */
  sendImageMessage: async (groupId: string, useCamera: boolean = false): Promise<void> => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      // Pick or take image
      const pickedImage = useCamera
        ? await CloudinaryService.takePhoto()
        : await CloudinaryService.pickImage();

      if (!pickedImage) {
        return; // User cancelled
      }

      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadImageToCloudinary(pickedImage.uri);

      if (uploadResult.success && uploadResult.url) {
        // Send message to Firestore
        await ChatService.sendImageMessage(groupId, currentUser.uid, uploadResult.url);
      } else {
        throw new Error(uploadResult.error || 'Failed to upload image');
      }
    } catch (error: any) {
      console.error('Error sending image:', error);
      throw new Error(error.message || 'Failed to send image');
    }
  },

  /**
   * Send PDF message to group
   */
  sendPDFMessage: async (groupId: string): Promise<void> => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      // Pick PDF document
      const pickedPdf = await CloudinaryService.pickPDF();

      if (!pickedPdf) {
        return; // User cancelled
      }

      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadPDFToCloudinary(
        pickedPdf.uri, 
        pickedPdf.name
      );

      if (uploadResult.success && uploadResult.url) {
        // Send message to Firestore
        await ChatService.sendPdfMessage(groupId, currentUser.uid, uploadResult.url, pickedPdf.name);
      } else {
        throw new Error(uploadResult.error || 'Failed to upload PDF');
      }
    } catch (error: any) {
      console.error('Error sending PDF:', error);
      throw new Error(error.message || 'Failed to send PDF');
    }
  },

  /**
   * Open PDF file in browser or system PDF viewer
   */
  openPDF: async (url: string): Promise<void> => {
    try {
      // Format the PDF URL using Cloudinary service helper
      const pdfUrl = CloudinaryService.formatPDFUrl(url);
      
      // For Cloudinary raw files, we need to download first then open
      // This is more reliable than trying to open the URL directly
      if (pdfUrl.includes('cloudinary.com') && pdfUrl.includes('/raw/upload/')) {
        try {
          // Create a local file path
          const fileName = pdfUrl.split('/').pop() || `document_${Date.now()}.pdf`;
          // Clean the fileName to remove query parameters if any
          const cleanFileName = fileName.split('?')[0];
          const fileUri = `${FileSystem.cacheDirectory}${cleanFileName}`;
          
          // Download the PDF file
          const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);
          
          if (downloadResult.status === 200) {
            // Try to get content URI (Android) or use file URI directly
            try {
              const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);
              const canOpen = await Linking.canOpenURL(contentUri);
              if (canOpen) {
                await Linking.openURL(contentUri);
                return;
              }
            } catch (contentUriError) {
              // If getContentUriAsync fails, try with the file URI directly
              console.log('Content URI failed, trying file URI:', contentUriError);
            }
            
            // Fallback: try opening the file URI directly
            const canOpenFile = await Linking.canOpenURL(downloadResult.uri);
            if (canOpenFile) {
              await Linking.openURL(downloadResult.uri);
              return;
            } else {
              // Last resort: try opening the original URL
              await Linking.openURL(pdfUrl);
            }
          } else {
            throw new Error(`Failed to download PDF: Status ${downloadResult.status}`);
          }
        } catch (downloadError: any) {
          console.log('Download failed, trying direct URL:', downloadError);
          // Fallback to direct URL opening
          const canOpen = await Linking.canOpenURL(pdfUrl);
          if (canOpen) {
            await Linking.openURL(pdfUrl);
          } else {
            await WebBrowser.openBrowserAsync(pdfUrl, {
              showTitle: true,
              enableBarCollapsing: true,
              showInRecents: true,
            });
          }
        }
      } else {
        // For non-Cloudinary URLs, try direct opening
        try {
          const canOpen = await Linking.canOpenURL(pdfUrl);
          if (canOpen) {
            await Linking.openURL(pdfUrl);
            return;
          }
        } catch (linkingError) {
          console.log('Linking failed, trying WebBrowser:', linkingError);
        }
        
        // Fallback to WebBrowser
        await WebBrowser.openBrowserAsync(pdfUrl, {
          showTitle: true,
          enableBarCollapsing: true,
          showInRecents: true,
        });
      }
    } catch (error: any) {
      console.error('Error opening PDF:', error);
      Alert.alert(
        'Error Opening PDF', 
        error.message || 'Failed to open PDF file. The file may be corrupted or inaccessible. Please try again later.'
      );
    }
  },

  /**
   * Show attachment options modal
   */
  showAttachmentOptions: (
    onTakePhoto: () => void,
    onChooseImage: () => void,
    onChoosePDF: () => void
  ): void => {
    Alert.alert(
      'Send Attachment',
      'Choose what you want to send',
      [
        {
          text: 'Take Photo',
          onPress: onTakePhoto,
          style: 'default',
        },
        {
          text: 'Choose Image',
          onPress: onChooseImage,
          style: 'default',
        },
        {
          text: 'Send PDF',
          onPress: onChoosePDF,
          style: 'default',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  },

  /**
   * Change profile picture using Cloudinary
   */
  changeProfilePicture: async (): Promise<string | null> => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    return new Promise((resolve, reject) => {
      Alert.alert(
        'Change Profile Picture',
        'How would you like to update your profile picture?',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              try {
                const photo = await CloudinaryService.takePhoto();
                if (photo) {
                  const uploadResult = await CloudinaryService.uploadProfileToCloudinary(photo.uri);
                  if (uploadResult.success && uploadResult.url) {
                    resolve(uploadResult.url);
                  } else {
                    reject(new Error(uploadResult.error || 'Upload failed'));
                  }
                } else {
                  resolve(null);
                }
              } catch (error) {
                reject(error);
              }
            },
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              try {
                const image = await CloudinaryService.pickImage();
                if (image) {
                  const uploadResult = await CloudinaryService.uploadProfileToCloudinary(image.uri);
                  if (uploadResult.success && uploadResult.url) {
                    resolve(uploadResult.url);
                  } else {
                    reject(new Error(uploadResult.error || 'Upload failed'));
                  }
                } else {
                  resolve(null);
                }
              } catch (error) {
                reject(error);
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { 
          cancelable: true,
          onDismiss: () => resolve(null),
        }
      );
    });
  },
};

/**
 * Utility functions for file operations
 */
export const FileUtils = {
  /**
   * Get optimized image URL from Cloudinary
   */
  getOptimizedImageUrl: (
    originalUrl: string,
    width: number = 400,
    height: number = 400,
    crop: string = 'fill'
  ): string => {
    return CloudinaryService.getOptimizedImageUrl(originalUrl, width, height, crop);
  },

  /**
   * Format file size
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Check if URL is an image
   */
  isImageUrl: (url: string): boolean => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext)) || lowerUrl.includes('image');
  },

  /**
   * Check if URL is a PDF
   */
  isPDFUrl: (url: string): boolean => {
    return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('pdf');
  },

  /**
   * Get file name from URL
   */
  getFileNameFromUrl: (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split('/').pop() || 'file';
    } catch (error) {
      return 'file';
    }
  },
};