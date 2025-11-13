/**
 * PROFILE PICTURE FEATURE - CODE EXAMPLES
 * 
 * Quick reference for using the profile picture feature in your components
 */

// ============================================================================
// EXAMPLE 1: Basic Usage in Profile Screen (Already Implemented)
// ============================================================================

import { useProfilePicture } from '../hooks/useProfilePicture';
import { ProfilePictureSection } from '../components/profile/ProfilePictureSection';

export function BasicProfileScreen() {
  const { profilePic, loading, error, changeProfilePic, clearError } = 
    useProfilePicture();

  return (
    <ProfilePictureSection
      profilePic={profilePic}
      loading={loading}
      error={error}
      onChangePress={changeProfilePic}
      onErrorDismiss={clearError}
      userName="John Doe"
      size="large"
    />
  );
}

// ============================================================================
// EXAMPLE 2: Using with Theme Colors (Already Implemented in profile.tsx)
// ============================================================================

import { useTheme } from '../contexts/ThemeContext';

export function ThemedProfileScreen() {
  const { colors } = useTheme();
  const { profilePic, loading, error, changeProfilePic, clearError } = 
    useProfilePicture();

  return (
    <ProfilePictureSection
      profilePic={profilePic}
      loading={loading}
      error={error}
      onChangePress={changeProfilePic}
      onErrorDismiss={clearError}
      userName="Jane Smith"
      primaryColor={colors.primary}
      surfaceColor={colors.surface}
      textColor={colors.text}
      size="large"
    />
  );
}

// ============================================================================
// EXAMPLE 3: Using Just the Service Functions (Advanced)
// ============================================================================

import { onChangeProfilePic } from '../services/profilePictureService';

async function handleProfilePictureChange() {
  try {
    const newProfilePicUrl = await onChangeProfilePic();
    
    if (newProfilePicUrl) {
      // Image uploaded successfully
      console.log('New profile picture URL:', newProfilePicUrl);
      // Update local state or UI here
    } else {
      // User cancelled the image picker
      console.log('User cancelled image selection');
    }
  } catch (error) {
    console.error('Profile picture change failed:', error);
    // Show error to user
  }
}

// ============================================================================
// EXAMPLE 4: Multiple Size Options
// ============================================================================

export function SizedProfilePictures() {
  const { profilePic, loading, error, changeProfilePic, clearError } = 
    useProfilePicture();

  return (
    <View>
      {/* Small profile picture */}
      <ProfilePictureSection
        {...profilePic}
        loading={loading}
        error={error}
        onChangePress={changeProfilePic}
        size="small"
      />

      {/* Medium profile picture */}
      <ProfilePictureSection
        {...profilePic}
        loading={loading}
        error={error}
        onChangePress={changeProfilePic}
        size="medium"
      />

      {/* Large profile picture */}
      <ProfilePictureSection
        {...profilePic}
        loading={loading}
        error={error}
        onChangePress={changeProfilePic}
        size="large"
      />
    </View>
  );
}

// ============================================================================
// EXAMPLE 5: Custom Image Display Without Component
// ============================================================================

import { View, Image, Text } from 'react-native';

export function CustomProfileDisplay() {
  const { profilePic } = useProfilePicture('user@example.com');
  const userName = 'John Doe';

  return (
    <View style={{ alignItems: 'center' }}>
      {profilePic ? (
        <Image
          source={{ uri: profilePic }}
          style={{ width: 100, height: 100, borderRadius: 50 }}
        />
      ) : (
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: '#6366F1',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>
            {userName.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
      )}
      <Text style={{ marginTop: 12, fontSize: 18, fontWeight: 'bold' }}>
        {userName}
      </Text>
    </View>
  );
}

// ============================================================================
// EXAMPLE 6: Handling Errors Manually
// ============================================================================

export function ProfileWithManualErrorHandling() {
  const [localError, setLocalError] = useState<string | null>(null);
  const { 
    profilePic, 
    loading, 
    error, 
    changeProfilePic, 
    clearError 
  } = useProfilePicture();

  const handleChange = async () => {
    try {
      setLocalError(null);
      await changeProfilePic();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setLocalError(message);
      
      // Custom error handling
      if (message.includes('permission')) {
        // Handle permission error
        Alert.alert('Permission Required', 'Please enable media library access');
      } else if (message.includes('upload')) {
        // Handle upload error
        Alert.alert('Upload Failed', 'Please check your internet connection');
      }
    }
  };

  return (
    <>
      <ProfilePictureSection
        profilePic={profilePic}
        loading={loading}
        error={error || localError}
        onChangePress={handleChange}
        onErrorDismiss={() => {
          clearError();
          setLocalError(null);
        }}
      />
    </>
  );
}

// ============================================================================
// EXAMPLE 7: Syncing with User Data
// ============================================================================

import { UserService } from '../services/userService';

export function SyncedProfileScreen() {
  const [userProfile, setUserProfile] = useState(null);
  const { profilePic, setProfilePic, loading, error, changeProfilePic, clearError } = 
    useProfilePicture(userProfile?.profilePic);

  useEffect(() => {
    // Load user profile
    UserService.fetchUserProfile().then(profile => {
      setUserProfile(profile);
      if (profile?.profilePic) {
        setProfilePic(profile.profilePic);
      }
    });

    // Subscribe to updates
    const unsubscribe = UserService.subscribeToProfileUpdates(profile => {
      setUserProfile(profile);
      if (profile?.profilePic) {
        setProfilePic(profile.profilePic);
      }
    });

    return unsubscribe;
  }, [setProfilePic]);

  if (!userProfile) return <Text>Loading...</Text>;

  return (
    <ProfilePictureSection
      profilePic={profilePic}
      loading={loading}
      error={error}
      onChangePress={changeProfilePic}
      userName={userProfile.name}
    />
  );
}

// ============================================================================
// EXAMPLE 8: Service Functions Direct Usage
// ============================================================================

import {
  pickImage,
  uploadProfileImage,
  updateUserProfilePic,
  deleteOldProfileImage,
} from '../services/profilePictureService';
import { auth } from '../../firebase';

async function manualProfilePictureUpload() {
  try {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');

    // Step 1: Pick image
    const image = await pickImage();
    if (!image) {
      console.log('User cancelled');
      return;
    }

    // Step 2: Delete old image (optional cleanup)
    try {
      await deleteOldProfileImage(uid);
    } catch (e) {
      console.warn('Could not delete old image');
    }

    // Step 3: Upload new image
    const downloadUrl = await uploadProfileImage(image.uri, uid);

    // Step 4: Update Firestore
    await updateUserProfilePic(uid, downloadUrl);

    console.log('Success! URL:', downloadUrl);
  } catch (error) {
    console.error('Failed:', error);
  }
}

// ============================================================================
// EXAMPLE 9: Retry Logic
// ============================================================================

export function ProfileWithRetry() {
  const [retryCount, setRetryCount] = useState(0);
  const { profilePic, loading, error, changeProfilePic, clearError } = 
    useProfilePicture();

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    clearError();
    await changeProfilePic();
  };

  return (
    <ProfilePictureSection
      profilePic={profilePic}
      loading={loading}
      error={error}
      onChangePress={retryCount === 0 ? changeProfilePic : handleRetry}
      onErrorDismiss={clearError}
    />
  );
}

// ============================================================================
// EXAMPLE 10: Avatar in List/Group Context
// ============================================================================

export function GroupMemberAvatar({ user }) {
  const [memberProfilePic, setMemberProfilePic] = useState(user.profilePic);

  return (
    <View style={{ alignItems: 'center', marginRight: 12 }}>
      {memberProfilePic ? (
        <Image
          source={{ uri: memberProfilePic }}
          style={{ width: 50, height: 50, borderRadius: 25 }}
        />
      ) : (
        <View
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: '#6366F1',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#fff' }}>
            {user.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
      )}
      <Text style={{ marginTop: 8, fontSize: 12 }}>{user.name}</Text>
    </View>
  );
}

// ============================================================================
// NOTES & TIPS
// ============================================================================

/*
BEST PRACTICES:
1. Always use the hook (useProfilePicture) for automatic state management
2. Use ProfilePictureSection component for consistent UI
3. Only use service functions directly if you need custom logic
4. Always wrap async functions in try-catch
5. Test with offline mode to ensure error handling works
6. Remember images are public-readable by design (modify rules if needed)

COMMON PATTERNS:
- Initialize hook with user's existing picture: useProfilePicture(user.profilePic)
- Sync with Firestore in useEffect with subscriptions
- Use size="medium" for list items, size="large" for profile page
- Customize colors with useTheme() hook

FIREBASE RULES:
- Storage: allow read to everyone, write only to owner
- Firestore: allow read/update only to document owner
- See setup-firebase-rules.sh for exact rules

PERFORMANCE:
- Images compressed to JPEG 0.9 quality
- Old images auto-deleted to save storage
- Real-time sync keeps UI in sync across sessions
- Network errors handled gracefully with retries
*/
