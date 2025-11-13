import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from './authService';
import { FirestoreService } from './firestoreService';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatarColor?: string;
  createdAt: string;
  updatedAt: string;
  profilePic?: string;
  joinedGroups?: string[];
}

export class UserService {
  private static readonly USER_PROFILE_KEY = 'userProfile';
  private static readonly USER_TOKEN_KEY = 'userToken';

  // Get user profile from local storage
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profileData = await AsyncStorage.getItem(this.USER_PROFILE_KEY);
      return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Save user profile to local storage
  static async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  // Get user token
  static async getUserToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.USER_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting user token:', error);
      return null;
    }
  }

  // Fetch user profile from Firestore with local fallback
  static async fetchUserProfile(): Promise<UserProfile | null> {
    try {
      // Check if user is authenticated with Firebase
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        return null;
      }

      try {
        // Try to get profile from Firestore first
        const firestoreProfile = await FirestoreService.getUser(currentUser.uid);
        if (firestoreProfile) {
          // Update local storage with Firestore data
          await this.saveUserProfile(firestoreProfile);
          return firestoreProfile;
        }
      } catch (firestoreError) {
        console.warn('Firestore fetch failed, falling back to local:', firestoreError);
      }

      // Fallback to local profile
      const localProfile = await this.getUserProfile();
      if (localProfile && localProfile.id === currentUser.uid) {
        return localProfile;
      }

      // If no profile anywhere, create from Firebase user
      const profile: UserProfile = {
        id: currentUser.uid,
        name: currentUser.displayName || currentUser.email?.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'User',
        email: currentUser.email || '',
        bio: '',
        avatarColor: this.generateAvatarColor(currentUser.displayName || currentUser.email || 'User'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save the profile to both Firestore and local storage
      try {
        const firestoreData = FirestoreService.convertUserProfileToFirestore(profile);
        await FirestoreService.createUser(firestoreData);
      } catch (firestoreError) {
        console.warn('Failed to save to Firestore:', firestoreError);
      }
      
      await this.saveUserProfile(profile);
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Update user profile in both Firestore and local storage
  static async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      // Check if user is authenticated
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const currentProfile = await this.getUserProfile();
      if (!currentProfile) {
        throw new Error('No user profile found');
      }

      // Ensure the profile belongs to the current user
      if (currentProfile.id !== currentUser.uid) {
        throw new Error('Profile ID mismatch');
      }

      // Merge updates with current profile
      const updatedProfile = {
        ...currentProfile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Save to both Firestore and local storage
      try {
        // Update in Firestore
        const firestoreUpdates = FirestoreService.convertUserProfileToFirestore(updatedProfile);
        const { uid, ...updateData } = firestoreUpdates; // Remove uid from updates
        await FirestoreService.updateUser(currentUser.uid, updateData);
      } catch (firestoreError) {
        console.warn('Failed to update Firestore, continuing with local update:', firestoreError);
      }

      // Always update local storage
      await this.saveUserProfile(updatedProfile);

      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Clear user data (for logout)
  static async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.USER_PROFILE_KEY, this.USER_TOKEN_KEY]);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Subscribe to real-time user profile updates
  static subscribeToProfileUpdates(callback: (profile: UserProfile | null) => void): () => void {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      callback(null);
      return () => {}; // Return empty unsubscribe function
    }

    return FirestoreService.subscribeToUser(currentUser.uid, async (profile) => {
      if (profile) {
        // Update local storage when Firestore updates
        await this.saveUserProfile(profile);
      }
      callback(profile);
    });
  }

  // Get user profile by ID from Firestore
  static async getUserProfileById(userId: string): Promise<UserProfile | null> {
    try {
      const firestoreProfile = await FirestoreService.getUser(userId);
      return firestoreProfile;
    } catch (error) {
      console.error('Error getting user profile by ID:', error);
      return null;
    }
  }

  // Generate avatar color based on user name
  static generateAvatarColor(name: string): string {
    const colors = [
      '#F9C9A7', '#A8E6CF', '#FFD3A5', '#FFAAA5', '#A8E6CF',
      '#FFD3A5', '#FFAAA5', '#FFB6C1', '#87CEEB', '#DDA0DD'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }
}
