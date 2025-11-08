
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
import { Layout } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { AuthService } from '../services/authService';
import { UserProfile, UserService } from '../services/userService';

export default function ProfileTab() {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const styles = useThemedStyles(colors);
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

  // Subscribe to real-time profile updates
  useFocusEffect(
    useCallback(() => {
      let unsubscribe: (() => void) | null = null;

      const setupRealtimeSync = async () => {
        // Initial load
        await loadUserProfile();

        // Subscribe to real-time updates
        unsubscribe = UserService.subscribeToProfileUpdates((profile) => {
          if (profile) {
            setUserProfile(profile);
            setLoading(false);
          }
        });
      };

      setupRealtimeSync();

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }, [loadUserProfile])
  );

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
      // Pick image from library
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      
      // For now, just store the local URI (no cloud storage)
      // In a real app, you might want to implement local file storage or use a different service
      await handleProfileUpdate({ profilePic: uri });

      Alert.alert('Success', 'Profile picture updated locally!');
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    }
  };

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await AuthService.signOut();
      // router.dismissAll();
      router.replace('/components/auth/Login');
    } catch (error: any) {
      Alert.alert('Logout failed', error.message || 'Please try again.');
    }
  }, []);

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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
          <Feather name="user-x" size={64} color={colors.textSecondary} />
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
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
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
            <Feather name="edit-2" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Avatar and Info */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: userProfile.avatarColor || UserService.generateAvatarColor(userProfile.name), overflow: 'hidden' }]}> 
            {userProfile.profilePic ? (
              <Image source={{ uri: userProfile.profilePic }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Feather name="user" size={56} color={colors.text} />
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
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem} onPress={handleChangeProfilePicture}>
            <Text style={styles.settingsLabel}>Change Profile Picture</Text>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.settingsItem}>
            <Text style={styles.settingsLabel}>Dark Mode</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDarkMode ? "#fff" : colors.background}
              ios_backgroundColor={colors.border}
            />
          </View>
          <View style={styles.settingsItem}>
            <Text style={styles.settingsLabel}>Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={notifications ? "#fff" : colors.background}
              ios_backgroundColor={colors.border}
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

// Move to using themed styles
import { useThemedStyles } from '../styles/themedStyles';
