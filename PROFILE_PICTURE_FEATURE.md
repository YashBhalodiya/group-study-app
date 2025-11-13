# Profile Picture Change Feature - Complete Guide

## Overview
This document describes the "Change Profile Picture" feature implementation for your React Native + Firebase app using Expo Image Picker, Firebase Storage, and Firestore.

## Architecture

### File Structure
```
app/
├── services/
│   └── profilePictureService.ts          # Core service functions
├── hooks/
│   └── useProfilePicture.ts              # Custom React hook
├── components/
│   └── profile/
│       └── ProfilePictureSection.tsx     # Reusable UI component
└── (tabs)/
    └── profile.tsx                        # Integrated profile screen
firebase.js                                # Firebase initialization (updated)
```

## Components & Functions

### 1. **profilePictureService.ts**
Core service with all Firebase operations.

#### Functions:

##### `pickImage(): Promise<PickImageResult | null>`
- Opens Expo Image Picker
- Requests media library permissions
- Returns image data with square aspect ratio (1:1)
- Returns `null` if user cancels
- **Error handling**: Throws if permissions denied

##### `uploadProfileImage(imageUri: string, uid: string): Promise<string>`
- Converts image URI to blob
- Uploads to Firebase Storage at path: `profileImages/{uid}.jpg`
- Sets metadata with upload timestamp
- **Returns**: Download URL string
- **Error handling**: Validates UID, handles network errors

##### `updateUserProfilePic(uid: string, profilePicUrl: string): Promise<void>`
- Updates Firestore document at path: `users/{uid}`
- Updates fields: `profilePic` (URL) and `updatedAt` (timestamp)
- **Error handling**: Validates UID, handles Firestore errors

##### `deleteOldProfileImage(uid: string): Promise<void>`
- Optional cleanup function
- Deletes old profile image from Storage (prevents storage bloat)
- Safely handles "not found" errors (doesn't throw)

##### `onChangeProfilePic(): Promise<string | null>`
- **Main controller function** - orchestrates entire flow:
  1. Gets current authenticated user
  2. Calls `pickImage()`
  3. Deletes old image (if exists)
  4. Uploads new image via `uploadProfileImage()`
  5. Updates Firestore via `updateUserProfilePic()`
  6. Returns new URL or `null` if cancelled
- **Error handling**: Comprehensive error messages

---

### 2. **useProfilePicture.ts**
Custom React Hook managing profile picture state and side effects.

#### Hook Signature
```typescript
useProfilePicture(initialProfilePic?: string | null): UseProfilePictureReturn

// Returns object with:
{
  profilePic: string | null,           // Current profile picture URL
  loading: boolean,                    // Upload in progress?
  error: string | null,                // Error message (if any)
  changeProfilePic: () => Promise<void>, // Trigger upload flow
  clearError: () => void,              // Dismiss error
  setProfilePic: (uri: string | null) => void  // Manually set URL
}
```

#### Usage Example
```typescript
const { profilePic, loading, error, changeProfilePic, clearError } = 
  useProfilePicture(userProfile?.profilePic);
```

---

### 3. **ProfilePictureSection.tsx**
Reusable React Native component for displaying and editing profile picture.

#### Props
```typescript
interface ProfilePictureSectionProps {
  profilePic: string | null;              // Current image URL
  loading: boolean;                       // Show loading spinner?
  error: string | null;                   // Error message
  onChangePress: () => void;              // Callback for edit button
  onErrorDismiss?: () => void;            // Callback to clear error
  userName?: string;                      // For initials fallback
  primaryColor?: string;                  // Theme primary color
  surfaceColor?: string;                  // Theme surface color
  textColor?: string;                     // Theme text color
  size?: 'small' | 'medium' | 'large';   // Component size
}
```

#### Features
- **Responsive sizes**: Small (80px), Medium (120px), Large (160px)
- **Smart fallback**: Shows user initials in colored circle if no image
- **Loading state**: Overlay spinner during upload
- **Error handling**: Auto-dismisses error alerts
- **Accessibility**: Touch-friendly edit button with camera emoji
- **Styling**: Shadows, rounded corners, theme-aware colors

---

### 4. **profile.tsx** (Updated)
Integrated profile screen using the new feature.

#### Key Changes
- Imports `useProfilePicture` hook
- Imports `ProfilePictureSection` component
- Removed old `ImagePicker.launchImageLibraryAsync()` code
- Replaces avatar section with new `<ProfilePictureSection />`
- Syncs profile picture state with Firestore updates in real-time

#### Integration Flow
```typescript
// 1. Initialize hook with user's existing picture
const { profilePic, loading, error, changeProfilePic, clearError, setProfilePic } 
  = useProfilePicture(userProfile?.profilePic || null);

// 2. Subscribe to Firestore updates
useProfilePicture.subscribeToProfileUpdates((profile) => {
  if (profile.profilePic) setProfilePic(profile.profilePic);
});

// 3. Render with component
<ProfilePictureSection
  profilePic={profilePic || userProfile.profilePic || null}
  loading={loading}
  error={error}
  onChangePress={handleChangeProfilePicture}
  onErrorDismiss={clearError}
  userName={userProfile.name}
  primaryColor={colors.primary}
  {...themeColors}
/>
```

---

## Firebase Setup

### Required Firebase Services
1. **Firebase Authentication** (already configured)
2. **Cloud Firestore** (already configured)
3. **Cloud Storage** (needs initialization)

### Firebase Storage Rules

**Set these security rules for user profile pictures:**

```javascript
// firebase/storage.rules

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow users to upload/read their own profile image
    match /profileImages/{uid}.jpg {
      allow read: if true;  // Public read access
      allow write: if request.auth.uid == uid;  // Only owner can write
      allow delete: if request.auth.uid == uid;  // Only owner can delete
    }
    
    // Catch-all: deny by default
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

**Deploy rules via Firebase CLI:**
```bash
firebase deploy --only storage:rules
```

### Firestore Rules

**Ensure users can update their own `profilePic` field:**

```javascript
// firebase/firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/update their own document
    match /users/{uid} {
      allow read: if request.auth.uid == uid;
      allow update: if request.auth.uid == uid && 
                       request.resource.data.keys().hasAny(['profilePic', 'updatedAt']);
      allow create: if request.auth.uid == uid;
    }
    
    // Catch-all: deny by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Error Handling

The feature includes comprehensive error handling at each stage:

### Error Scenarios & Messages
| Scenario | Message | Handler |
|----------|---------|---------|
| User denies permissions | "Permission to access media library was denied" | Console warning |
| User cancels picker | Returns `null` (no error) | Handled gracefully |
| Invalid UID | "User ID is required for upload" | Thrown as Error |
| Upload failure | "Failed to upload image. Please check your connection and try again." | User Alert |
| Firestore update fails | "Failed to update profile. Please try again." | User Alert |
| Not authenticated | "User not authenticated" | Thrown as Error |

### Error Flow
```
1. pickImage() fails
   └─> onChangeProfilePic() catches error
       └─> Throws error to changeProfilePic()
           └─> Hook catches error
               └─> Sets error state
                   └─> ProfilePictureSection displays alert
```

---

## Data Flow Diagram

```
User taps "Change" button
        ↓
changeProfilePic() called (hook)
        ↓
onChangeProfilePic() executed (service)
        ├─> pickImage()
        │   └─> Expo Image Picker opens
        │       └─> User selects image ✓ or cancels ✗
        │
        ├─> deleteOldProfileImage() (cleanup)
        │   └─> Remove old image from Storage
        │
        ├─> uploadProfileImage()
        │   └─> Fetch image blob
        │   └─> Upload to Storage at profileImages/{uid}.jpg
        │   └─> Get downloadURL
        │
        ├─> updateUserProfilePic()
        │   └─> Update Firestore users/{uid}.profilePic
        │
        └─> Return downloadURL to hook
            ↓
        Hook updates local state
            ↓
        ProfilePictureSection re-renders with new image
            ↓
        Real-time subscription updates remaining views
```

---

## Installation & Dependencies

### Required Packages (already in your project)
```json
{
  "expo": "^50.0.0",
  "expo-image-picker": "^14.0.0",
  "react-native": "^0.73.0",
  "firebase": "^10.0.0"
}
```

### Installation (if missing)
```bash
npx expo install expo-image-picker
npm install firebase
```

---

## Usage Example in Components

### Basic Usage
```typescript
import { useProfilePicture } from '../hooks/useProfilePicture';
import { ProfilePictureSection } from '../components/profile/ProfilePictureSection';

export function MyProfileComponent() {
  const { profilePic, loading, error, changeProfilePic, clearError } = 
    useProfilePicture();

  return (
    <>
      <ProfilePictureSection
        profilePic={profilePic}
        loading={loading}
        error={error}
        onChangePress={changeProfilePic}
        onErrorDismiss={clearError}
        userName="John Doe"
        size="large"
      />
      {/* ... rest of profile UI ... */}
    </>
  );
}
```

### With Custom Colors
```typescript
<ProfilePictureSection
  profilePic={profilePic}
  loading={loading}
  error={error}
  onChangePress={changeProfilePic}
  onErrorDismiss={clearError}
  userName={userProfile.name}
  primaryColor="#6366F1"      // Your theme color
  surfaceColor="#FFFFFF"       // Background
  textColor="#1F2937"          // Text color
  size="medium"
/>
```

---

## Best Practices

### 1. **Image Quality**
- Image picker limited to 0.9 quality (balance size vs. quality)
- Uploaded images compressed as JPEG
- Consider adding client-side compression for very large images

### 2. **Storage Optimization**
- Delete old images to prevent storage bloat
- Consider implementing cleanup for deleted accounts
- Monitor storage usage in Firebase Console

### 3. **Performance**
- Loading state prevents double-tap uploads
- Error clearing improves UX
- Real-time subscriptions keep UI in sync

### 4. **Security**
- Storage rules enforce user-only write access
- Firestore rules validate uid in request
- Sensitive data not exposed in client code

### 5. **Accessibility**
- Touch targets ≥ 44x44 points
- Loading/error states properly communicated
- Initials fallback for users without images

---

## Troubleshooting

### Common Issues

**"Permission to access media library was denied"**
- User didn't grant permissions
- Check phone Settings → App Permissions → Photos
- Solution: Request permissions again or show instructions

**"Failed to upload image"**
- Network connectivity issue
- Firebase Storage quota exceeded
- Storage rules too restrictive
- Solution: Check internet, Firebase Console quota, and rules

**"Failed to update profile"**
- User not authenticated (session expired)
- Firestore rules blocking write
- User UID mismatch
- Solution: Re-authenticate user, check Firestore rules

**Image not showing after upload**
- Cache issue
- Download URL expired
- Solution: Force refresh, clear app cache

**"User ID is required"**
- auth.currentUser is null
- User logged out during upload
- Solution: Require authentication before allowing upload

---

## Testing Checklist

- [ ] User can pick image from library
- [ ] Uploading shows loading spinner
- [ ] Upload completes and image displays
- [ ] Firestore document updated with new URL
- [ ] Old image deleted from Storage
- [ ] Initials show if no profile picture
- [ ] Error messages display correctly
- [ ] Works in light and dark modes
- [ ] Permissions dialog appears on first use
- [ ] Handles network errors gracefully
- [ ] Multiple users can have different images
- [ ] Images persist after app restart

---

## Version History

**v1.0.0** (Nov 13, 2025)
- Initial implementation
- Firebase Storage integration
- Firestore auto-update
- Real-time profile sync

---

## Support & Questions

For questions or issues:
1. Check Firebase Console logs
2. Enable verbose console logging in `profilePictureService.ts`
3. Verify Storage/Firestore rules in Firebase Console
4. Test with sample image under 5MB

---

**Last Updated**: November 13, 2025
