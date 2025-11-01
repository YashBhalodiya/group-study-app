import {
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
    Timestamp,
    updateDoc
} from 'firebase/firestore';
import { firestore } from '../../firebase';
import { UserProfile } from './userService';

// Firestore user document structure
export interface FirestoreUser {
  uid: string;
  name: string;
  email: string;
  bio?: string;
  avatarColor?: string;
  profilePic?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class FirestoreService {
  private static readonly USERS_COLLECTION = 'users';

  // Create a new user document in Firestore
  static async createUser(user: Omit<FirestoreUser, 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const userRef = doc(firestore, this.USERS_COLLECTION, user.uid);
      
      // Filter out undefined values
      const filteredUser: any = {};
      Object.entries(user).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          filteredUser[key] = value;
        }
      });
      
      const userData: FirestoreUser = {
        ...filteredUser,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      await setDoc(userRef, userData);
      console.log('User created in Firestore:', user.uid);
    } catch (error) {
      console.error('Error creating user in Firestore:', error);
      throw new Error('Failed to create user profile');
    }
  }

  // Get user document from Firestore
  static async getUser(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(firestore, this.USERS_COLLECTION, uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as FirestoreUser;
        return this.convertFirestoreToUserProfile(data);
      } else {
        console.log('No user document found for:', uid);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user from Firestore:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  // Update user document in Firestore
  static async updateUser(uid: string, updates: Partial<Omit<FirestoreUser, 'uid' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const userRef = doc(firestore, this.USERS_COLLECTION, uid);
      
      // Filter out undefined values from updates
      const filteredUpdates: any = {};
      
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          filteredUpdates[key] = value;
        }
      });
      
      const updateData = {
        ...filteredUpdates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userRef, updateData);
      console.log('User updated in Firestore:', uid);
    } catch (error) {
      console.error('Error updating user in Firestore:', error);
      throw new Error('Failed to update user profile');
    }
  }

  // Listen to real-time updates for a user
  static subscribeToUser(uid: string, callback: (user: UserProfile | null) => void): () => void {
    const userRef = doc(firestore, this.USERS_COLLECTION, uid);
    
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as FirestoreUser;
        const userProfile = this.convertFirestoreToUserProfile(data);
        callback(userProfile);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Error listening to user updates:', error);
      callback(null);
    });
  }

  // Check if user document exists
  static async userExists(uid: string): Promise<boolean> {
    try {
      const userRef = doc(firestore, this.USERS_COLLECTION, uid);
      const userSnap = await getDoc(userRef);
      return userSnap.exists();
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  }

  // Convert Firestore data to UserProfile format
  private static convertFirestoreToUserProfile(firestoreUser: FirestoreUser): UserProfile {
    return {
      id: firestoreUser.uid,
      name: firestoreUser.name,
      email: firestoreUser.email,
      bio: firestoreUser.bio || '',
      avatarColor: firestoreUser.avatarColor,
      profilePic: firestoreUser.profilePic,
      createdAt: firestoreUser.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: firestoreUser.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    };
  }

  // Convert UserProfile to Firestore format (filters out undefined values)
  static convertUserProfileToFirestore(userProfile: UserProfile): Omit<FirestoreUser, 'createdAt' | 'updatedAt'> {
    const firestoreData: any = {
      uid: userProfile.id,
      name: userProfile.name,
      email: userProfile.email,
    };

    // Only add optional fields if they have values
    if (userProfile.bio !== undefined && userProfile.bio !== null) {
      firestoreData.bio = userProfile.bio;
    }
    
    if (userProfile.avatarColor !== undefined && userProfile.avatarColor !== null) {
      firestoreData.avatarColor = userProfile.avatarColor;
    }
    
    if (userProfile.profilePic !== undefined && userProfile.profilePic !== null) {
      firestoreData.profilePic = userProfile.profilePic;
    }

    return firestoreData;
  }
}