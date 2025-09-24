
// Using backend pre-signed URLs instead of Amplify client upload
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EditProfileModal } from '../components/ui';
import { Colors, Layout } from '../constants';
import { UserProfile, UserService } from '../services/userService';
// Lightweight UUID v4 generator (no crypto.getRandomValues dependency)
function generateUuidV4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ProfileTab() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // Load user profile data
  const loadUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await UserService.fetchUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh profile data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUserProfile();
    setRefreshing(false);
  }, [loadUserProfile]);

  // Handle profile update
  const handleProfileUpdate = useCallback(async (updates: Partial<UserProfile>) => {
  try {
    const updatedProfile = await UserService.updateUserProfile(updates);
    if (updatedProfile) {
      setUserProfile(updatedProfile);
    }
  } catch (error: any) {
    throw error;
  }
}, []);
  const handleChangeProfilePicture = async () => {
  try {
    // 1. Pick image
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    const response = await fetch(uri);
    const blob = await response.blob();
   const fileKey = `profilePics/${generateUuidV4()}.jpg`;

   // Request pre-signed URL from backend
   const endpoint =
     process.env.EXPO_PUBLIC_UPLOAD_URL ||
     (Constants?.expoConfig as any)?.extra?.EXPO_PUBLIC_UPLOAD_URL ||
     (Constants as any)?.manifest2?.extra?.EXPO_PUBLIC_UPLOAD_URL;
   if (!endpoint) {
     throw new Error('Missing EXPO_PUBLIC_UPLOAD_URL');
   }
  const presignRes = await fetch(endpoint, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ key: fileKey, contentType: 'image/jpeg' }),
   });
   if (!presignRes.ok) {
     const text = await presignRes.text().catch(() => '');
     throw new Error(`Presign failed: ${presignRes.status} ${text}`);
   }
   const { uploadUrl, fileUrl } = await presignRes.json();

   // Upload image directly to S3
   let putRes = await fetch(uploadUrl, {
     method: 'PUT',
     headers: { 'Content-Type': 'image/jpeg' },
     body: blob,
   });
   if (!putRes.ok && (putRes.status === 400 || putRes.status === 403)) {
     // Retry without header in case signature doesn't include Content-Type
     putRes = await fetch(uploadUrl, {
       method: 'PUT',
       body: blob,
     });
   }
   if (!putRes.ok) {
     const text = await putRes.text().catch(() => '');
     throw new Error(`Upload failed: ${putRes.status} ${text}`);
   }

    // Update profile in DynamoDB via UserService
    await handleProfileUpdate({ profilePic: fileUrl });

    Alert.alert('Success', 'Profile picture updated!');
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    Alert.alert('Error', 'Failed to update profile picture');
  }
};

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await UserService.clearUserData();
      // Reset navigation and go to login (index)
      router.dismissAll();
      router.replace('./app/components/auth/Login.tsx');
    } catch (e) {
      Alert.alert('Logout failed', 'Please try again.');
    }
  }, []);

  // Load profile when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [loadUserProfile])
  );

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state if no profile data
  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Feather name="user-x" size={64} color={Colors.textSecondary} />
          <Text style={styles.errorTitle}>Profile Not Found</Text>
          <Text style={styles.errorText}>
            Unable to load your profile. Please try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity 
            style={styles.editIcon}
            onPress={() => setEditModalVisible(true)}
          >
            <Feather name="edit-2" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Avatar and Info */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: userProfile.avatarColor || UserService.generateAvatarColor(userProfile.name), overflow: 'hidden' }]}> 
            {userProfile.profilePic ? (
              <Image source={{ uri: userProfile.profilePic }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Feather name="user" size={56} color={Colors.text} />
            )}
          </View>
          <Text style={styles.name}>{userProfile.name}</Text>
          <Text style={styles.email}>{userProfile.email}</Text>
          {userProfile.bio && (
            <Text style={styles.bio}>{userProfile.bio}</Text>
          )}
        </View>

        {/* Settings List */}
        <View style={styles.settingsSection}>
          <Text style={styles.settingsTitle}>Settings</Text>
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => setEditModalVisible(true)}
          >
            <Text style={styles.settingsLabel}>Edit Profile</Text>
            <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem} onPress={handleChangeProfilePicture}>
            <Text style={styles.settingsLabel}>Change Profile Picture</Text>
            <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.settingsItem}>
            <Text style={styles.settingsLabel}>Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={darkMode ? Colors.primary : '#fff'}
            />
          </View>
          <View style={styles.settingsItem}>
            <Text style={styles.settingsLabel}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={notifications ? Colors.primary : '#fff'}
            />
          </View>
          <TouchableOpacity 
            style={[styles.settingsItem, styles.logoutItem]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Logout</Text>
            <Feather name="log-out" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editModalVisible}
        userProfile={userProfile}
        onClose={() => setEditModalVisible(false)}
        onSave={handleProfileUpdate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Layout.spacing.md,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Layout.spacing.lg,
    marginBottom: Layout.spacing.sm,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.xl,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  editIcon: {
    padding: 6,
    borderRadius: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
    paddingHorizontal: Layout.spacing.lg,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Layout.spacing.xs,
  },
  email: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  bio: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Layout.spacing.lg,
    paddingHorizontal: Layout.spacing.md,
  },
  settingsSection: {
    marginHorizontal: Layout.spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Layout.spacing.lg,
    marginBottom: Layout.spacing.xl,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsLabel: {
    fontSize: 15,
    color: Colors.text,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    fontSize: 15,
    color: '#FF6B6B',
    fontWeight: '500',
  },
});
