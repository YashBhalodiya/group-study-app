import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    updateDoc,
    where,
    writeBatch
} from 'firebase/firestore';
import { auth, firestore } from '../../firebase';

// Types for Firestore
export interface FirestoreGroupData {
  id?: string;
  name: string;
  description: string;
  subject: string;
  code: string;
  createdBy: string;
  createdByName: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  memberCount: number;
  isPrivate: boolean;
  maxMembers: number;
  members: string[]; // Array of user IDs
  admins: string[]; // Array of user IDs who are admins
  tags: string[];
  lastActivity?: any; // Firestore Timestamp
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: any; // Firestore Timestamp
  lastActive?: any; // Firestore Timestamp
}

export interface UserMembership {
  groupId: string;
  groupCode: string;
  groupName: string;
  joinedAt: any; // Firestore Timestamp
  role: 'admin' | 'member';
}

export class FirestoreGroupsService {
  private static readonly GROUPS_COLLECTION = 'groups';
  private static readonly USERS_COLLECTION = 'users';
  private static readonly GROUP_MEMBERS_COLLECTION = 'group_members';
  
  /**
   * Generate a unique 6-character group code
   */
  static generateUniqueGroupCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }

  /**
   * Check if a group code is already taken
   */
  static async isGroupCodeTaken(code: string): Promise<boolean> {
    try {
      const groupsRef = collection(firestore, this.GROUPS_COLLECTION);
      const q = query(groupsRef, where('code', '==', code.toUpperCase()));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking group code:', error);
      return true; // Assume taken if there's an error
    }
  }

  /**
   * Generate a guaranteed unique group code
   */
  static async generateGuaranteedUniqueCode(): Promise<string> {
    let code: string;
    let isCodeTaken = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (isCodeTaken && attempts < maxAttempts) {
      code = this.generateUniqueGroupCode();
      isCodeTaken = await this.isGroupCodeTaken(code);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      // Fallback: use timestamp to ensure uniqueness
      const timestamp = Date.now().toString().slice(-4);
      code = this.generateUniqueGroupCode().slice(0, 2) + timestamp;
    }

    return code!;
  }

  /**
   * Create a new group
   */
  static async createGroup(
    name: string,
    description: string,
    subject: string,
    isPrivate: boolean = false,
    maxMembers: number = 50
  ): Promise<{ groupId: string; groupCode: string }> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      // Generate unique code
      const groupCode = await this.generateGuaranteedUniqueCode();
      
      // Get user's profile for the createdByName
      const userDoc = await getDoc(doc(firestore, this.USERS_COLLECTION, currentUser.uid));
      const userName = userDoc.exists() ? userDoc.data()?.name : currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown';

      // Prepare group data
      const groupData: FirestoreGroupData = {
        name: name.trim(),
        description: description.trim(),
        subject: subject.trim(),
        code: groupCode,
        createdBy: currentUser.uid,
        createdByName: userName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        memberCount: 1,
        isPrivate,
        maxMembers,
        members: [currentUser.uid],
        admins: [currentUser.uid],
        tags: [subject.toLowerCase()],
        lastActivity: serverTimestamp()
      };

      // Create the group first to get the ID
      const groupsCollection = collection(firestore, this.GROUPS_COLLECTION);
      const groupDocRef = await addDoc(groupsCollection, groupData);
      const groupId = groupDocRef.id;

      // Now update user and create member record in a transaction
      await runTransaction(firestore, async (transaction) => {
        // Add membership to user's document (create or update)
        const userRef = doc(firestore, this.USERS_COLLECTION, currentUser.uid);
        const userDoc = await transaction.get(userRef);
        
        if (userDoc.exists()) {
          // Update existing user document
          transaction.update(userRef, {
            joinedGroups: arrayUnion(groupId),
            updatedAt: serverTimestamp()
          });
        } else {
          // Create user document if it doesn't exist
          transaction.set(userRef, {
            id: currentUser.uid,
            name: userName,
            email: currentUser.email || '',
            joinedGroups: [groupId],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }

        // Create group member record in subcollection
        const memberRef = doc(collection(firestore, this.GROUPS_COLLECTION, groupId, this.GROUP_MEMBERS_COLLECTION), currentUser.uid);
        transaction.set(memberRef, {
          id: currentUser.uid,
          name: userName,
          email: currentUser.email || '',
          role: 'admin',
          joinedAt: serverTimestamp(),
          lastActive: serverTimestamp()
        });
      });

      console.log('Group created successfully:', { groupId, groupCode });
      return { groupId, groupCode };
    } catch (error: any) {
      console.error('Error creating group:', error);
      throw new Error(`Failed to create group: ${error.message}`);
    }
  }

  /**
   * Join a group by code
   */
  static async joinGroupByCode(groupCode: string): Promise<{ groupId: string; groupName: string }> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      // Find group by code
      const groupsRef = collection(firestore, this.GROUPS_COLLECTION);
      const q = query(groupsRef, where('code', '==', groupCode.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Group not found with the provided code');
      }

      const groupDoc = querySnapshot.docs[0];
      const groupData = groupDoc.data() as FirestoreGroupData;
      const groupId = groupDoc.id;

      // Check if user is already a member
      if (groupData.members.includes(currentUser.uid)) {
        throw new Error('You are already a member of this group');
      }

      // Check if group is full
      if (groupData.memberCount >= groupData.maxMembers) {
        throw new Error('This group has reached its maximum capacity');
      }

      // Get user's profile
      const userDoc = await getDoc(doc(firestore, this.USERS_COLLECTION, currentUser.uid));
      const userName = userDoc.exists() ? userDoc.data()?.name : currentUser.displayName || currentUser.email?.split('@')[0] || 'Unknown';

      // Use transaction to join group
      await runTransaction(firestore, async (transaction) => {
        // Add user to group members
        const groupRef = doc(firestore, this.GROUPS_COLLECTION, groupId);
        transaction.update(groupRef, {
          members: arrayUnion(currentUser.uid),
          memberCount: groupData.memberCount + 1,
          lastActivity: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Add group to user's joined groups
        const userRef = doc(firestore, this.USERS_COLLECTION, currentUser.uid);
        transaction.update(userRef, {
          joinedGroups: arrayUnion(groupId),
          updatedAt: serverTimestamp()
        });

        // Create group member record
        const memberRef = doc(collection(firestore, this.GROUPS_COLLECTION, groupId, this.GROUP_MEMBERS_COLLECTION), currentUser.uid);
        transaction.set(memberRef, {
          id: currentUser.uid,
          name: userName,
          email: currentUser.email || '',
          role: 'member',
          joinedAt: serverTimestamp(),
          lastActive: serverTimestamp()
        });
      });

      console.log('Successfully joined group:', { groupId, groupName: groupData.name });
      return { groupId, groupName: groupData.name };
    } catch (error: any) {
      console.error('Error joining group:', error);
      throw new Error(`Failed to join group: ${error.message}`);
    }
  }

  /**
   * Get user's joined groups
   */
  static async getUserGroups(userId?: string): Promise<FirestoreGroupData[]> {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) {
      throw new Error('No authenticated user');
    }

    try {
      // Get groups where user is a member
      const groupsRef = collection(firestore, this.GROUPS_COLLECTION);
      const q = query(
        groupsRef,
        where('members', 'array-contains', uid)
      );
      
      const querySnapshot = await getDocs(q);
      const groups: FirestoreGroupData[] = [];

      querySnapshot.forEach((doc) => {
        groups.push({
          id: doc.id,
          ...doc.data() as FirestoreGroupData
        });
      });

      // Sort on client side by lastActivity (most recent first)
      groups.sort((a, b) => {
        const aTime = a.lastActivity?.toDate?.() || new Date(0);
        const bTime = b.lastActivity?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });

      return groups;
    } catch (error: any) {
      console.error('Error fetching user groups:', error);
      throw new Error(`Failed to fetch groups: ${error.message}`);
    }
  }

  /**
   * Get group details by ID
   */
  static async getGroupById(groupId: string): Promise<FirestoreGroupData | null> {
    try {
      const groupDoc = await getDoc(doc(firestore, this.GROUPS_COLLECTION, groupId));
      
      if (!groupDoc.exists()) {
        return null;
      }

      return {
        id: groupDoc.id,
        ...groupDoc.data() as FirestoreGroupData
      };
    } catch (error: any) {
      console.error('Error fetching group:', error);
      throw new Error(`Failed to fetch group: ${error.message}`);
    }
  }

  /**
   * Get group members
   */
  static async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    try {
      const membersRef = collection(firestore, this.GROUPS_COLLECTION, groupId, this.GROUP_MEMBERS_COLLECTION);
      const q = query(membersRef, orderBy('joinedAt', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const members: GroupMember[] = [];
      querySnapshot.forEach((doc) => {
        members.push(doc.data() as GroupMember);
      });

      return members;
    } catch (error: any) {
      console.error('Error fetching group members:', error);
      throw new Error(`Failed to fetch group members: ${error.message}`);
    }
  }

  /**
   * Leave a group
   */
  static async leaveGroup(groupId: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      // Get group data first
      const groupDoc = await getDoc(doc(firestore, this.GROUPS_COLLECTION, groupId));
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data() as FirestoreGroupData;

      // Check if user is the creator and the only admin
      if (groupData.createdBy === currentUser.uid && groupData.admins.length === 1) {
        throw new Error('Cannot leave group as the only admin. Please transfer admin rights or delete the group.');
      }

      await runTransaction(firestore, async (transaction) => {
        // Remove user from group
        const groupRef = doc(firestore, this.GROUPS_COLLECTION, groupId);
        transaction.update(groupRef, {
          members: arrayRemove(currentUser.uid),
          admins: arrayRemove(currentUser.uid),
          memberCount: Math.max(0, groupData.memberCount - 1),
          lastActivity: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Remove group from user's joined groups
        const userRef = doc(firestore, this.USERS_COLLECTION, currentUser.uid);
        transaction.update(userRef, {
          joinedGroups: arrayRemove(groupId),
          updatedAt: serverTimestamp()
        });

        // Delete group member record
        const memberRef = doc(firestore, this.GROUPS_COLLECTION, groupId, this.GROUP_MEMBERS_COLLECTION, currentUser.uid);
        transaction.delete(memberRef);
      });

      console.log('Successfully left group:', groupId);
    } catch (error: any) {
      console.error('Error leaving group:', error);
      throw new Error(`Failed to leave group: ${error.message}`);
    }
  }

  /**
   * Delete a group (only for admins)
   */
  static async deleteGroup(groupId: string): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      // Check if user is an admin
      const groupDoc = await getDoc(doc(firestore, this.GROUPS_COLLECTION, groupId));
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const groupData = groupDoc.data() as FirestoreGroupData;
      if (!groupData.admins.includes(currentUser.uid)) {
        throw new Error('Only admins can delete the group');
      }

      // Use batch write for cleanup
      const batch = writeBatch(firestore);

      // Delete group document
      const groupRef = doc(firestore, this.GROUPS_COLLECTION, groupId);
      batch.delete(groupRef);

      // Remove group from all members' joinedGroups
      const membersPromises = groupData.members.map(async (memberId) => {
        const memberRef = doc(firestore, this.USERS_COLLECTION, memberId);
        batch.update(memberRef, {
          joinedGroups: arrayRemove(groupId),
          updatedAt: serverTimestamp()
        });
      });

      await Promise.all(membersPromises);

      // Delete all member records (subcollection)
      const membersRef = collection(firestore, this.GROUPS_COLLECTION, groupId, this.GROUP_MEMBERS_COLLECTION);
      const membersSnapshot = await getDocs(membersRef);
      membersSnapshot.forEach((memberDoc) => {
        batch.delete(memberDoc.ref);
      });

      await batch.commit();
      console.log('Successfully deleted group:', groupId);
    } catch (error: any) {
      console.error('Error deleting group:', error);
      throw new Error(`Failed to delete group: ${error.message}`);
    }
  }

  /**
   * Subscribe to real-time updates for user's groups
   */
  static subscribeToUserGroups(
    callback: (groups: FirestoreGroupData[]) => void,
    onError?: (error: Error) => void,
    userId?: string
  ): () => void {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) {
      const error = new Error('No authenticated user');
      onError?.(error);
      return () => {};
    }

    try {
      const groupsRef = collection(firestore, this.GROUPS_COLLECTION);
      // Remove orderBy for now to avoid composite index requirement
      const q = query(
        groupsRef,
        where('members', 'array-contains', uid)
      );

      return onSnapshot(
        q,
        (querySnapshot) => {
          const groups: FirestoreGroupData[] = [];
          console.log('Firestore snapshot received, docs:', querySnapshot.size);
          
          querySnapshot.forEach((doc) => {
            const groupData = { id: doc.id, ...doc.data() as FirestoreGroupData };
            console.log('Group found:', groupData.name, 'ID:', doc.id);
            groups.push(groupData);
          });
          
          // Sort on client side by lastActivity (most recent first)
          groups.sort((a, b) => {
            const aTime = a.lastActivity?.toDate?.() || new Date(0);
            const bTime = b.lastActivity?.toDate?.() || new Date(0);
            return bTime.getTime() - aTime.getTime();
          });
          
          console.log('Calling callback with groups:', groups.length);
          callback(groups);
        },
        (error) => {
          console.error('Error in groups subscription:', error);
          onError?.(new Error(`Failed to subscribe to groups: ${error.message}`));
        }
      );
    } catch (error: any) {
      console.error('Error setting up groups subscription:', error);
      onError?.(new Error(`Failed to set up subscription: ${error.message}`));
      return () => {};
    }
  }

  /**
   * Update group last activity (called when messages are sent, etc.)
   */
  static async updateGroupActivity(groupId: string): Promise<void> {
    try {
      const groupRef = doc(firestore, this.GROUPS_COLLECTION, groupId);
      await updateDoc(groupRef, {
        lastActivity: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error: any) {
      console.error('Error updating group activity:', error);
      // Don't throw error for activity updates
    }
  }

  /**
   * Convert Firestore timestamp to JavaScript Date
   */
  static timestampToDate(timestamp: any): Date {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    return new Date(timestamp);
  }

  /**
   * Check if user is admin of a group
   */
  static async isUserGroupAdmin(groupId: string, userId?: string): Promise<boolean> {
    const uid = userId || auth.currentUser?.uid;
    if (!uid) return false;

    try {
      const groupDoc = await getDoc(doc(firestore, this.GROUPS_COLLECTION, groupId));
      if (!groupDoc.exists()) return false;

      const groupData = groupDoc.data() as FirestoreGroupData;
      return groupData.admins.includes(uid);
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
}