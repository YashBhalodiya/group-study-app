import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatarColor?: string;
  createdAt: string;
  updatedAt: string;
   profilePic?: string; 
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

  // Fetch user profile from backend API
  static async fetchUserProfile(): Promise<UserProfile | null> {
    try {
      // For now, just return local profile data (no API calls)
      const localProfile = await this.getUserProfile();
      if (localProfile) {
        return localProfile;
      }

      // If no local profile, return null
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Update user profile via backend API
  static async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      // For now, just update local storage (no API calls)
      const currentProfile = await this.getUserProfile();
      if (!currentProfile) {
        throw new Error('No user profile found');
      }

      // Merge updates with current profile
      const updatedProfile = {
        ...currentProfile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Save updated profile locally
      await this.saveUserProfile(updatedProfile);

      // Attempt to persist to backend if configured
      try {
        await this.persistProfileRemote(updatedProfile);
      } catch (remoteError) {
        console.warn('Remote persistence skipped/failed:', remoteError);
      }
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

  // Generate avatar color based on user name
  static generateAvatarColor(name: string): string {
    const colors = [
      '#F9C9A7', '#A8E6CF', '#FFD3A5', '#FFAAA5', '#A8E6CF',
      '#FFD3A5', '#FFAAA5', '#FFB6C1', '#87CEEB', '#DDA0DD'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  // Optional remote persistence via API Gateway / backend
  private static async persistProfileRemote(profile: UserProfile): Promise<void> {
    const endpoint = process.env.EXPO_PUBLIC_DDB_WRITE_URL;
    if (!endpoint) {
      throw new Error('EXPO_PUBLIC_DDB_WRITE_URL not set');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Remote persistence failed: ${response.status} ${text}`);
    }
  }
}
