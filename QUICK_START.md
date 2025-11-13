# Quick Start: Profile Picture Feature

## ⚡ 5-Minute Setup

### What You Get
✅ Change profile picture button  
✅ Image picker (square crop)  
✅ Firebase Storage upload  
✅ Firestore auto-sync  
✅ Loading states & error handling  
✅ Default initials fallback  

---

## Step 1: Deploy Firebase Rules (2 min)

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project: **group-chat-app-f7a83**

### Deploy Storage Rules
1. Go to **Storage → Rules**
2. Replace everything with:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profileImages/{uid}.jpg {
      allow read: if true;
      allow write: if request.auth.uid == uid;
    }
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```
3. Click **Publish**

### Deploy Firestore Rules
1. Go to **Firestore Database → Rules**
2. Replace everything with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth.uid == uid;
      allow update: if request.auth.uid == uid && 
                       request.resource.data.keys().hasAny(['profilePic', 'updatedAt']);
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
3. Click **Publish**

---

## Step 2: Test in Your App (3 min)

```bash
# From your project root
npx expo start
```

Then:
1. Open the Profile tab
2. Tap the "Change" button (camera icon)
3. Select a photo from your device
4. Watch it upload and save! ✨

---

## 📁 Files Created/Modified

### New Files Created
```
✅ app/services/profilePictureService.ts
✅ app/hooks/useProfilePicture.ts
✅ app/components/profile/ProfilePictureSection.tsx
✅ PROFILE_PICTURE_FEATURE.md
✅ PROFILE_PICTURE_README.md
✅ setup-firebase-rules.sh
```

### Files Modified
```
✅ app/(tabs)/profile.tsx (integrated component)
✅ firebase.js (added storage export)
```

---

## 🔍 How It Works

```
User taps "Change"
    ↓
Image Picker opens
    ↓
User selects photo
    ↓
Uploads to Firebase Storage (profileImages/{uid}.jpg)
    ↓
Updates Firestore (users/{uid}.profilePic)
    ↓
UI updates instantly with new image
    ↓
Old image auto-deleted (cleanup)
```

---

## 🎨 Customize (Optional)

### Change colors in ProfilePictureSection
```typescript
<ProfilePictureSection
  {...props}
  primaryColor="#YOUR_COLOR"      // Theme color
  surfaceColor="#FFFFFF"           // Background
  textColor="#1F2937"              // Text
  size="medium"                    // small|medium|large
/>
```

---

## ❌ If Something Goes Wrong

| Problem | Solution |
|---------|----------|
| "Module not found" | Run `npm install` |
| Image won't upload | Check Firebase rules published ✓ |
| Image shows then disappears | Check internet connection, try offline |
| Permissions error | Allow media library access in Settings |
| Very slow upload | Check image size (should be <5MB) |

---

## 📚 Need More Details?

- **Full Guide**: `PROFILE_PICTURE_FEATURE.md`
- **Implementation Details**: Read code comments in service files
- **Firebase Setup**: `setup-firebase-rules.sh`

---

## ✨ Features at a Glance

| Feature | Status |
|---------|--------|
| Image picker with square crop | ✅ |
| Firebase Storage upload | ✅ |
| Firestore auto-update | ✅ |
| Loading spinner | ✅ |
| Error handling & alerts | ✅ |
| Initials fallback avatar | ✅ |
| Real-time sync | ✅ |
| Dark mode support | ✅ |
| Responsive sizing | ✅ |
| Accessibility labels | ✅ |

---

## 🚀 You're All Set!

Your profile picture feature is complete and production-ready.

**Next**: Test it out and customize colors if needed!

---

*Last Updated: November 13, 2025*
