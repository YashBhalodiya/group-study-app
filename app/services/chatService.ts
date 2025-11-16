import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp
} from 'firebase/firestore';
import { firestore } from '../../firebase';
import { FirestoreGroupsService } from './firestoreGroupsService';
import { UserService } from './userService';

// Message types
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  fileUrl?: string;
  fileType: 'text' | 'image' | 'pdf' | 'meeting';
  timestamp: any; // Firestore Timestamp
  createdAt: Date;
  meetingData?: {
    description: string;
    meetingLink: string;
    dateTime: string;
  };
}

export class ChatService {
  private static readonly MESSAGES_COLLECTION = 'messages';

  /**
   * Send a text message to a group
   */
  static async sendTextMessage(
    groupId: string,
    userId: string,
    text: string
  ): Promise<string> {
    if (!text.trim()) {
      throw new Error('Message text cannot be empty');
    }

    try {
      // Get sender info
      const userProfile = await UserService.getUserProfileById(userId);
      const senderName = userProfile?.name || 'Anonymous';
      const senderAvatar = userProfile?.profilePic;

      // Create message data
      const messageData = {
        senderId: userId,
        senderName,
        senderAvatar: senderAvatar || null,
        text: text.trim(),
        fileUrl: '',
        fileType: 'text' as const,
        timestamp: serverTimestamp()
      };

      // Add message to group's messages subcollection
      const messagesRef = collection(
        firestore,
        'groups',
        groupId,
        this.MESSAGES_COLLECTION
      );
      const messageDoc = await addDoc(messagesRef, messageData);

      // Update group's last activity
      await FirestoreGroupsService.updateGroupActivity(groupId);

      return messageDoc.id;
    } catch (error: any) {
      console.error('Error sending text message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Send an image message to a group
   */
  static async sendImageMessage(
    groupId: string,
    userId: string,
    imageUrl: string,
    text?: string
  ): Promise<string> {
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    try {
      // Get sender info
      const userProfile = await UserService.getUserProfileById(userId);
      const senderName = userProfile?.name || 'Anonymous';
      const senderAvatar = userProfile?.profilePic;

      // Create message data
      const messageData = {
        senderId: userId,
        senderName,
        senderAvatar: senderAvatar || null,
        text: text?.trim() || '',
        fileUrl: imageUrl,
        fileType: 'image' as const,
        timestamp: serverTimestamp()
      };

      // Add message to group's messages subcollection
      const messagesRef = collection(
        firestore,
        'groups',
        groupId,
        this.MESSAGES_COLLECTION
      );
      const messageDoc = await addDoc(messagesRef, messageData);

      // Update group's last activity
      await FirestoreGroupsService.updateGroupActivity(groupId);

      return messageDoc.id;
    } catch (error: any) {
      console.error('Error sending image message:', error);
      throw new Error(`Failed to send image: ${error.message}`);
    }
  }

  /**
   * Send a PDF message to a group
   */
  static async sendPdfMessage(
    groupId: string,
    userId: string,
    pdfUrl: string,
    fileName?: string
  ): Promise<string> {
    if (!pdfUrl) {
      throw new Error('PDF URL is required');
    }

    try {
      // Get sender info
      const userProfile = await UserService.getUserProfileById(userId);
      const senderName = userProfile?.name || 'Anonymous';
      const senderAvatar = userProfile?.profilePic;

      // Create message data
      const messageData = {
        senderId: userId,
        senderName,
        senderAvatar: senderAvatar || null,
        text: fileName || 'PDF Document',
        fileUrl: pdfUrl,
        fileType: 'pdf' as const,
        timestamp: serverTimestamp()
      };

      // Add message to group's messages subcollection
      const messagesRef = collection(
        firestore,
        'groups',
        groupId,
        this.MESSAGES_COLLECTION
      );
      const messageDoc = await addDoc(messagesRef, messageData);

      // Update group's last activity
      await FirestoreGroupsService.updateGroupActivity(groupId);

      return messageDoc.id;
    } catch (error: any) {
      console.error('Error sending PDF message:', error);
      throw new Error(`Failed to send PDF: ${error.message}`);
    }
  }

  /**
   * Listen to messages in a group using onSnapshot
   */
  static listenToMessages(
    groupId: string,
    callback: (messages: Message[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      // Create query for messages in the group
      const messagesRef = collection(
        firestore,
        'groups',
        groupId,
        this.MESSAGES_COLLECTION
      );
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      // Set up real-time listener
      return onSnapshot(
        q,
        (snapshot) => {
          const messages: Message[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            const message: Message = {
              id: doc.id,
              senderId: data.senderId,
              senderName: data.senderName,
              senderAvatar: data.senderAvatar,
              text: data.text,
              fileUrl: data.fileUrl,
              fileType: data.fileType,
              timestamp: data.timestamp,
              createdAt: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
              meetingData: data.meetingData
            };
            messages.push(message);
          });

          callback(messages);
        },
        (error) => {
          console.error('Error listening to messages:', error);
          onError?.(new Error(`Failed to listen to messages: ${error.message}`));
        }
      );
    } catch (error: any) {
      console.error('Error setting up message listener:', error);
      onError?.(new Error(`Failed to set up listener: ${error.message}`));
      return () => {};
    }
  }

  /**
   * Convert Firestore timestamp to JavaScript Date
   */
  static timestampToDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return new Date(timestamp);
  }

  /**
   * Format message timestamp for display
   */
  static formatMessageTime(timestamp: any): string {
    const date = this.timestampToDate(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours < 1) {
      if (minutes < 1) {
        return 'Just now';
      }
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Delete a message from a group
   */
  static async deleteMessage(
    groupId: string,
    messageId: string,
    userId: string
  ): Promise<void> {
    if (!groupId || !messageId) {
      throw new Error('Group ID and Message ID are required');
    }

    try {
      // Reference to the message document
      const messageRef = doc(
        firestore,
        'groups',
        groupId,
        this.MESSAGES_COLLECTION,
        messageId
      );

      // Delete the message
      await deleteDoc(messageRef);

      console.log('Message deleted successfully:', messageId);
    } catch (error: any) {
      console.error('Error deleting message:', error);
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }
}