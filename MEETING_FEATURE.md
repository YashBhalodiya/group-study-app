# Meeting Feature Implementation

## Overview
The Meeting Feature allows users to create and schedule meetings within group chats. When a meeting is created, it's saved to the database and appears as a special message in the group chat so all members can see it.

## Features Implemented

### 1. Create Meeting Option
- Added "Create Meeting" option to the attachment menu in group chats
- Users can access it by tapping the paperclip/attachment button in the chat input

### 2. Meeting Creation Modal
- **Title**: Required field for meeting name (max 100 characters)
- **Description**: Required field for meeting agenda (max 500 characters)
- **Meeting Link**: Required field with URL validation for Google Meet, Zoom, etc.
- **Date & Time**: Required field with date and time pickers (must be in future)
- **Form Validation**: Client-side validation with error messages

### 3. Meeting Display in Chat
- Meetings appear as special message bubbles with distinct UI
- Display includes:
  - Meeting badge indicator
  - Meeting title
  - Description
  - Date and time (formatted)
  - "Join Meeting" button to open the meeting link
  - Visual indicators (calendar icon, clock icon, video icon)

### 4. Data Storage
- Meetings are stored in two places:
  1. `groups/{groupId}/meetings` - Dedicated meetings subcollection
  2. `groups/{groupId}/messages` - As a special message type for chat visibility

### 5. Meeting Message Properties
```typescript
{
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string; // Meeting title
  fileUrl: string; // Meeting ID reference
  fileType: 'meeting';
  timestamp: Firestore.Timestamp;
  meetingData: {
    description: string;
    meetingLink: string;
    dateTime: string; // ISO format
  }
}
```

## Files Created/Modified

### New Files
1. **app/types/meeting.ts** - TypeScript interfaces for meeting data
2. **app/services/meetingService.ts** - Meeting CRUD operations and Firebase integration
3. **app/components/chat/CreateMeetingModal.tsx** - Meeting creation modal UI

### Modified Files
1. **app/components/chat/ChatInput.tsx**
   - Added `onCreateMeeting` prop
   - Updated attachment options to include "Create Meeting"

2. **app/components/chat/ChatBubble.tsx**
   - Added meeting message rendering
   - Added styles for meeting display
   - Added meeting link opening functionality

3. **app/services/chatService.ts**
   - Updated Message type to include 'meeting' fileType
   - Added meetingData field to Message interface
   - Updated message listener to handle meeting data

4. **app/group/[id].tsx**
   - Added meeting modal state
   - Added meeting creation handler
   - Integrated CreateMeetingModal component

## Usage

### Creating a Meeting
1. Open a group chat
2. Tap the attachment (paperclip) button
3. Select "Create Meeting"
4. Fill in the meeting details:
   - Enter a descriptive title
   - Provide meeting agenda/description
   - Add the meeting link (Google Meet, Zoom, etc.)
   - Select date and time (must be in future)
5. Tap "Create Meeting"
6. Meeting will appear in the chat for all group members

### Viewing a Meeting
- Meetings appear as special cards in the chat
- Show meeting title, description, and scheduled time
- Tap "Join Meeting" button to open the meeting link in browser

### Meeting Validation
- All fields are required
- Meeting link must be a valid URL
- Date and time must be in the future
- Client-side validation provides immediate feedback

## Technical Details

### Date/Time Handling
- Uses `@react-native-community/datetimepicker` for native date/time selection
- Separate pickers for date and time on Android
- Spinner-style picker on iOS
- Default meeting time is 1 hour from current time

### URL Validation
- Regular expression pattern: `/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/`
- Validates common meeting platforms (Google Meet, Zoom, Teams, etc.)

### Firebase Structure
```
groups/
  {groupId}/
    messages/
      {messageId} - Meeting announcement message
    meetings/
      {meetingId} - Full meeting details
```

### Error Handling
- Try-catch blocks in all async operations
- User-friendly error messages via Alert dialogs
- Validation errors displayed inline in the form
- Loading states during meeting creation

## Styling

### Meeting Message Card
- Distinct visual design with rounded corners
- Header section with calendar icon and meeting badge
- Detail rows with icons for description and time
- "Join Meeting" button with video icon
- Color-coded for current user vs other users
- Responsive to theme colors

### Modal Design
- Slide-up animation
- Semi-transparent overlay
- Rounded top corners
- Scrollable form content
- Fixed header and footer
- Keyboard-aware layout

## Dependencies Added
- `@react-native-community/datetimepicker` - Native date/time picker component

## Future Enhancements (Optional)
1. Meeting reminders/notifications
2. Meeting edit/delete functionality
3. Recurring meetings
4. Calendar integration
5. Meeting attendance tracking
6. In-app video calling
7. Meeting notes/minutes
8. Meeting history view
9. RSVP functionality
10. Meeting search and filtering

## Testing Checklist
- [x] Create meeting with all fields filled
- [x] Validate empty fields
- [x] Validate invalid URL format
- [x] Validate past date/time
- [x] Meeting appears in chat after creation
- [x] Meeting displays correctly for sender
- [x] Meeting displays correctly for receivers
- [x] Join meeting button opens link in browser
- [x] Modal closes on cancel
- [x] Modal closes on successful creation
- [x] Form resets after submission
- [x] Date/time picker works on iOS/Android
- [x] Integration with existing chat functionality
- [x] No breaking of existing features

## Notes
- Meetings are stored permanently in Firebase
- All group members can see meetings
- Meeting creator information is preserved
- Meetings integrate seamlessly with existing chat messages
- The feature maintains app's existing design language and UX patterns
