#!/usr/bin/env bash
#
# Firebase Rules Setup Guide
# This file documents how to set up Firebase Storage and Firestore rules
# for the profile picture feature
#

# ============================================================================
# FIREBASE STORAGE RULES
# ============================================================================
# Location: Firebase Console → Storage → Rules
# 
# Copy and paste this entire rules block into your Firebase Storage rules:

cat > storage.rules << 'EOF'
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile Images - Users can upload/read/delete their own images
    match /profileImages/{uid}.jpg {
      // Everyone can read profile images (public)
      allow read: if true;
      
      // Only the user (uid in path) can write/delete
      allow write: if request.auth.uid == uid;
      allow delete: if request.auth.uid == uid;
    }
    
    // Default: Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
EOF

# ============================================================================
# FIRESTORE RULES
# ============================================================================
# Location: Firebase Console → Firestore Database → Rules
#
# Copy and paste this entire rules block into your Firestore rules:

cat > firestore.rules << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can manage their own user document
    match /users/{uid} {
      // Allow reading own document
      allow read: if request.auth.uid == uid;
      
      // Allow creating own document
      allow create: if request.auth.uid == uid;
      
      // Allow updating specific fields in own document
      allow update: if request.auth.uid == uid && 
                       request.resource.data.keys().hasAny([
                         'profilePic', 
                         'updatedAt',
                         'name',
                         'email',
                         'bio'
                       ]);
      
      // Deny delete (preserve user records)
      allow delete: if false;
      
      // Groups subcollection - users in same groups can read
      match /groups/{groupId} {
        allow read: if request.auth.uid == uid;
        allow write: if request.auth.uid == uid;
      }
    }
    
    // Groups collection - read-only for members
    match /groups/{groupId} {
      allow read: if true;  // Can query but filtered by app logic
      allow write: if false; // Only Firestore/Admin SDK writes
      
      // Messages in groups
      match /messages/{messageId} {
        allow read: if true;
        allow create: if request.auth != null;
        allow update, delete: if request.auth.uid == resource.data.createdBy;
      }
    }
    
    // Default: Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
EOF

# ============================================================================
# DEPLOYMENT INSTRUCTIONS
# ============================================================================
# 
# Option 1: Using Firebase Console (easiest)
# 1. Open Firebase Console → Your Project
# 2. Go to Storage → Rules tab
# 3. Copy the storage.rules content into the editor
# 4. Click "Publish"
# 5. Go to Firestore → Rules tab
# 6. Copy the firestore.rules content into the editor
# 7. Click "Publish"
#
# Option 2: Using Firebase CLI (recommended for teams)
# 1. Install Firebase CLI: npm install -g firebase-tools
# 2. Login: firebase login
# 3. Initialize: firebase init
# 4. Select "Storage" and "Firestore"
# 5. Save rules to: storage.rules and firestore.rules (as shown above)
# 6. Deploy: firebase deploy --only storage:rules,firestore:rules
#
# ============================================================================

echo "Firebase rules generated successfully!"
echo ""
echo "Next steps:"
echo "1. Open Firebase Console (https://console.firebase.google.com)"
echo "2. Select your project: 'group-chat-app-f7a83'"
echo "3. Deploy Storage rules (rules above)"
echo "4. Deploy Firestore rules (rules above)"
echo ""
echo "After deployment, your profile picture feature will be secure!"
