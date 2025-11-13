# Group Study App - Chat & File Sharing Implementation

## 🔥 Features Implemented

### 1. Firebase Real-time Group Chat
- Real-time messaging using Firestore `onSnapshot` listeners
- Message structure: `groups/{groupId}/messages/{messageId}`
- Support for text, image, and PDF messages
- Auto-scroll to bottom on new messages
- Message timestamps and sender information

### 2. Cloudinary File Upload System
- **Cloud Configuration**: 
  - Cloud Name: `dmxl5oa3h`
  - Upload Preset: `Group-Study-App Upload`
- Image uploads with automatic optimization
- PDF document uploads
- Profile picture uploads with transformations

### 3. Profile Picture Management
- User can select images from gallery or camera
- Automatic upload to Cloudinary
- Profile picture saved to Firestore: `users/{uid}/profilePic`
- Circular image display with fallback to initials

### 4. Chat UI Components
- Message bubbles for different file types
- Image preview in chat
- PDF "open file" button using WebBrowser
- Loading indicators during uploads
- Optimized image loading

## 🚀 Usage Guide

### Chat Screen (`/group/[id].tsx`)

```typescript
// Navigate to chat screen
router.push({
  pathname: `/group/[id]`,
  params: { 
    id: groupId,
    groupData: JSON.stringify(groupInfo)
  }
});
```

### Sending Messages

#### Text Message
```typescript
await ChatService.sendTextMessage(groupId, userId, messageText);
```

#### Image Message
```typescript
// Pick and upload image
const image = await CloudinaryService.pickImage();
const uploadResult = await CloudinaryService.uploadImageToCloudinary(image.uri);
await ChatService.sendImageMessage(groupId, userId, uploadResult.url);
```

#### PDF Message
```typescript
// Pick and upload PDF
const pdf = await CloudinaryService.pickPDF();
const uploadResult = await CloudinaryService.uploadPDFToCloudinary(pdf.uri, pdf.name);
await ChatService.sendPdfMessage(groupId, userId, uploadResult.url, pdf.name);
```

### Profile Picture Management

```typescript
// Change profile picture
const newUrl = await FileHandler.changeProfilePicture();
if (newUrl) {
  await UserService.updateUserProfile({ profilePic: newUrl });
}
```

### Real-time Message Listener

```typescript
// Set up message listener
const unsubscribe = ChatService.listenToMessages(
  groupId,
  (messages) => {
    setMessages(messages);
    // Auto-scroll to bottom
    flatListRef.current?.scrollToEnd({ animated: true });
  },
  (error) => {
    console.error('Message error:', error);
  }
);

// Clean up listener
return unsubscribe;
```

## 📁 File Structure

```
app/
├── services/
│   ├── chatService.ts           # Firebase chat operations
│   ├── cloudinaryService.ts    # Cloudinary uploads
│   └── profilePictureService.ts # Profile picture management
├── components/
│   ├── chat/
│   │   ├── ChatBubble.tsx      # Message bubble component
│   │   ├── ChatInput.tsx       # Chat input with attachments
│   │   └── MessageActions.tsx  # File selection actions
│   └── profile/
│       └── ProfileScreenComponent.tsx # Profile with picture upload
├── group/
│   └── [id].tsx                # Chat screen
└── utils/
    └── fileHandler.ts          # File operation utilities
```

## 🛠️ Key Services

### ChatService
- `sendTextMessage(groupId, userId, text)`
- `sendImageMessage(groupId, userId, imageUrl, caption?)`
- `sendPdfMessage(groupId, userId, pdfUrl, fileName)`
- `listenToMessages(groupId, callback, onError)`

### CloudinaryService
- `pickImage(useCamera?)` - Select image from gallery/camera
- `takePhoto()` - Take photo with camera
- `pickPDF()` - Select PDF document
- `uploadImageToCloudinary(uri)` - Upload image
- `uploadPDFToCloudinary(uri, fileName)` - Upload PDF
- `uploadProfileToCloudinary(uri)` - Upload profile picture

### FileHandler (Utility)
- `sendImageMessage(groupId, useCamera?)` - Complete image flow
- `sendPDFMessage(groupId)` - Complete PDF flow
- `openPDF(url)` - Open PDF in browser
- `changeProfilePicture()` - Profile picture flow

## 🎨 UI Components

### ChatBubble
- Displays different message types (text, image, PDF)
- Sender avatar and name
- Timestamp formatting
- Optimized image loading

### ChatInput
- Text input with attachment button
- Upload progress indicators
- Send button with loading state

### ProfileScreenComponent
- Profile picture with upload functionality
- Stats display
- Quick actions menu

## 🔧 Configuration

### Cloudinary Settings
```typescript
const CLOUD_NAME = 'dmxl5oa3h';
const UPLOAD_PRESET = 'Group-Study-App Upload';
```

### Message Structure (Firestore)
```typescript
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  fileUrl?: string;
  fileType: 'text' | 'image' | 'pdf';
  timestamp: Timestamp;
}
```

## 📱 Error Handling

All services include comprehensive error handling:
- Network errors during uploads
- Permission errors for camera/gallery
- Firestore write errors
- User authentication checks

## 🚨 Important Notes

1. **Permissions**: App requests camera and media library permissions
2. **File Size**: No explicit file size limits set (handled by Cloudinary)
3. **Security**: Upload preset configured in Cloudinary dashboard
4. **Offline**: Basic offline support through Firestore persistence
5. **Performance**: Images automatically optimized by Cloudinary

## 🔍 Testing

Test the following flows:
1. Send text message ✅
2. Send image from gallery ✅
3. Take photo and send ✅
4. Send PDF document ✅
5. Open PDF in browser ✅
6. Change profile picture ✅
7. Real-time message updates ✅

All components are production-ready with error handling and loading states!