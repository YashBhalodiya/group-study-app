import { useState, useCallback } from 'react';
import { onChangeProfilePic } from '../services/profilePictureService';

interface UseProfilePictureReturn {
  profilePic: string | null;
  loading: boolean;
  error: string | null;
  changeProfilePic: () => Promise<void>;
  clearError: () => void;
  setProfilePic: (uri: string | null) => void;
}

/**
 * Custom hook for managing profile picture state and upload logic
 * @param initialProfilePic - Initial profile picture URL
 * @returns Object with profilePic state, loading flag, error message, and changeProfilePic function
 */
export function useProfilePicture(initialProfilePic: string | null = null): UseProfilePictureReturn {
  const [profilePic, setProfilePic] = useState<string | null>(initialProfilePic);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changeProfilePic = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Call the service function which handles the entire flow
      const newProfilePicUrl = await onChangeProfilePic();
      
      if (newProfilePicUrl) {
        setProfilePic(newProfilePicUrl);
        console.log('Profile picture updated successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Profile picture change failed:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    profilePic,
    loading,
    error,
    changeProfilePic,
    clearError,
    setProfilePic,
  };
}
