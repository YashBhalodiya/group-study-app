import {
    addDoc,
    collection,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    where
} from 'firebase/firestore';
import { firestore } from '../../firebase';
import { CreateMeetingData, Meeting } from '../types/meeting';
import { FirestoreGroupsService } from './firestoreGroupsService';
import { UserService } from './userService';

export class MeetingService {
  private static readonly MESSAGES_COLLECTION = 'messages';
  private static readonly MEETINGS_COLLECTION = 'meetings';

  /**
   * Create a new meeting in a group
   * This will:
   * 1. Save meeting data to the group's meetings subcollection
   * 2. Create a meeting message in the group chat
   */
  static async createMeeting(
    groupId: string,
    userId: string,
    meetingData: CreateMeetingData
  ): Promise<string> {
    try {
      // Validate meeting data
      this.validateMeetingData(meetingData);

      // Get user profile
      const userProfile = await UserService.getUserProfileById(userId);
      const userName = userProfile?.name || 'Anonymous';
      const userAvatar = userProfile?.profilePic;

      // Create meeting object
      const meeting = {
        groupId,
        title: meetingData.title.trim(),
        description: meetingData.description.trim(),
        meetingLink: meetingData.meetingLink.trim(),
        dateTime: meetingData.dateTime,
        createdBy: userId,
        createdByName: userName,
        createdByAvatar: userAvatar || null,
        timestamp: serverTimestamp()
      };

      // Save to meetings subcollection
      const meetingsRef = collection(
        firestore,
        'groups',
        groupId,
        this.MEETINGS_COLLECTION
      );
      const meetingDoc = await addDoc(meetingsRef, meeting);

      // Create a message in the chat to announce the meeting
      const messageData = {
        senderId: userId,
        senderName: userName,
        senderAvatar: userAvatar || null,
        text: meetingData.title,
        fileUrl: meetingDoc.id, // Store meeting ID in fileUrl
        fileType: 'meeting' as const,
        timestamp: serverTimestamp(),
        meetingData: {
          description: meetingData.description,
          meetingLink: meetingData.meetingLink,
          dateTime: meetingData.dateTime.toISOString()
        }
      };

      const messagesRef = collection(
        firestore,
        'groups',
        groupId,
        this.MESSAGES_COLLECTION
      );
      await addDoc(messagesRef, messageData);

      // Update group's last activity
      await FirestoreGroupsService.updateGroupActivity(groupId);

      return meetingDoc.id;
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      throw new Error(`Failed to create meeting: ${error.message}`);
    }
  }

  /**
   * Get all meetings for a group
   */
  static async getGroupMeetings(groupId: string): Promise<Meeting[]> {
    try {
      const meetingsRef = collection(
        firestore,
        'groups',
        groupId,
        this.MEETINGS_COLLECTION
      );
      
      const q = query(
        meetingsRef,
        orderBy('dateTime', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const meetings: Meeting[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        meetings.push({
          id: doc.id,
          groupId: data.groupId,
          title: data.title,
          description: data.description,
          meetingLink: data.meetingLink,
          dateTime: data.dateTime?.toDate ? data.dateTime.toDate() : new Date(data.dateTime),
          createdBy: data.createdBy,
          createdByName: data.createdByName,
          createdByAvatar: data.createdByAvatar,
          timestamp: data.timestamp,
          createdAt: data.timestamp?.toDate ? data.timestamp.toDate() : new Date()
        });
      });

      return meetings;
    } catch (error: any) {
      console.error('Error fetching meetings:', error);
      throw new Error(`Failed to fetch meetings: ${error.message}`);
    }
  }

  /**
   * Get upcoming meetings for a group
   */
  static async getUpcomingMeetings(groupId: string): Promise<Meeting[]> {
    try {
      const meetingsRef = collection(
        firestore,
        'groups',
        groupId,
        this.MEETINGS_COLLECTION
      );
      
      const now = new Date();
      const q = query(
        meetingsRef,
        where('dateTime', '>=', now),
        orderBy('dateTime', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const meetings: Meeting[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        meetings.push({
          id: doc.id,
          groupId: data.groupId,
          title: data.title,
          description: data.description,
          meetingLink: data.meetingLink,
          dateTime: data.dateTime?.toDate ? data.dateTime.toDate() : new Date(data.dateTime),
          createdBy: data.createdBy,
          createdByName: data.createdByName,
          createdByAvatar: data.createdByAvatar,
          timestamp: data.timestamp,
          createdAt: data.timestamp?.toDate ? data.timestamp.toDate() : new Date()
        });
      });

      return meetings;
    } catch (error: any) {
      console.error('Error fetching upcoming meetings:', error);
      throw new Error(`Failed to fetch upcoming meetings: ${error.message}`);
    }
  }

  /**
   * Validate meeting data
   */
  private static validateMeetingData(data: CreateMeetingData): void {
    if (!data.title || !data.title.trim()) {
      throw new Error('Meeting title is required');
    }

    if (!data.description || !data.description.trim()) {
      throw new Error('Meeting description is required');
    }

    if (!data.meetingLink || !data.meetingLink.trim()) {
      throw new Error('Meeting link is required');
    }

    // Validate URL format
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(data.meetingLink.trim())) {
      throw new Error('Please enter a valid meeting link');
    }

    // Validate date is in the future
    const now = new Date();
    if (data.dateTime <= now) {
      throw new Error('Meeting date must be in the future');
    }
  }

  /**
   * Format meeting date for display
   */
  static formatMeetingDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Check if meeting is upcoming (within next 24 hours)
   */
  static isUpcoming(meetingDate: Date): boolean {
    const now = new Date();
    const diff = meetingDate.getTime() - now.getTime();
    const hours = diff / (1000 * 60 * 60);
    return hours > 0 && hours <= 24;
  }

  /**
   * Check if meeting is happening now (within 30 minutes before/after)
   */
  static isHappeningNow(meetingDate: Date): boolean {
    const now = new Date();
    const diff = Math.abs(meetingDate.getTime() - now.getTime());
    const minutes = diff / (1000 * 60);
    return minutes <= 30;
  }
}
