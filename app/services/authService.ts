import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    reload,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    User
} from 'firebase/auth';
import { auth } from '../../firebase';
import { FirestoreService } from './firestoreService';
import { UserProfile, UserService } from './userService';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string, displayName: string): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the user's display name in Firebase Auth
      await updateProfile(user, {
        displayName: displayName
      });

      // Send email verification
      await sendEmailVerification(user);

      // Create user profile for Firestore
      const userProfile: UserProfile = {
        id: user.uid,
        name: displayName,
        email: user.email || '',
        bio: '',
        avatarColor: UserService.generateAvatarColor(displayName),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save user profile to Firestore
      const firestoreData = FirestoreService.convertUserProfileToFirestore(userProfile);
      await FirestoreService.createUser(firestoreData);

      // Also save to local storage for offline access
      await UserService.saveUserProfile(userProfile);

      return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName,
        photoURL: user.photoURL
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(this.getFirebaseErrorMessage(error.code));
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Try to get user profile from Firestore first
      let userProfile = await FirestoreService.getUser(user.uid);
      
      if (!userProfile) {
        // If no Firestore profile, create one
        userProfile = {
          id: user.uid,
          name: user.displayName || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          email: user.email || '',
          bio: '',
          avatarColor: UserService.generateAvatarColor(user.displayName || email),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Save to both Firestore and local storage
        const firestoreData = FirestoreService.convertUserProfileToFirestore(userProfile);
        await FirestoreService.createUser(firestoreData);
      }
      
      // Always sync to local storage for offline access
      await UserService.saveUserProfile(userProfile);

      return {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName,
        photoURL: user.photoURL
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(this.getFirebaseErrorMessage(error.code));
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
      // Clear local user data
      await UserService.clearUserData();
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  // Get current user
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  static onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  // Check if current user's email is verified
  static async isEmailVerified(): Promise<boolean> {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Reload user to get latest verification status
    await reload(user);
    return user.emailVerified;
  }

  // Send email verification
  static async sendEmailVerification(): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    
    try {
      await sendEmailVerification(user);
    } catch (error: any) {
      console.error('Error sending email verification:', error);
      throw new Error('Failed to send verification email. Please try again.');
    }
  }

  // Reload current user data
  static async reloadUser(): Promise<void> {
    const user = this.getCurrentUser();
    if (user) {
      await reload(user);
    }
  }

  // Convert Firebase error codes to user-friendly messages
  private static getFirebaseErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}