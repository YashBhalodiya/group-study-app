// Meeting-related types and interfaces

export interface Meeting {
  id: string;
  groupId: string;
  title: string;
  description: string;
  meetingLink: string;
  dateTime: Date;
  createdBy: string;
  createdByName: string;
  createdByAvatar?: string;
  timestamp: any; // Firestore Timestamp
  createdAt: Date;
}

export interface CreateMeetingData {
  title: string;
  description: string;
  meetingLink: string;
  dateTime: Date;
}

export interface MeetingFormErrors {
  title?: string;
  description?: string;
  meetingLink?: string;
  dateTime?: string;
}
