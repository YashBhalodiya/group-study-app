import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { ProfilePictureSection } from '../components/profile/ProfilePictureSection';
import { EditProfileModal } from '../components/ui';
import { useTheme } from '../contexts/ThemeContext';
import { useProfilePicture } from '../hooks/useProfilePicture';
import { AuthService } from '../services/authService';
import { UserProfile, UserService } from '../services/userService';

export default function ProfileTab() {
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const [notifications, setNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  // Use the profile picture hook with initial value
  const { 
    profilePic, 
    loading: picLoading, 
    error: picError, 
    changeProfilePic, 
    clearError,
    setProfilePic 
  } = useProfilePicture(userProfile?.profilePic || null);

  // Move styles INSIDE the component where colors is available
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.text,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 32,
    },
    errorTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
    },
    editIcon: {
      padding: 8,
    },
    avatarSection: {
      alignItems: 'center',
      paddingVertical: 32,
      backgroundColor: colors.surface,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatarImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    email: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    bio: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    settingsSection: {
      marginTop: 24,
      paddingHorizontal: 20,
    },
    settingsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    settingsItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      marginBottom: 8,
      borderRadius: 8,
    },
    settingsLabel: {
      fontSize: 16,
      color: colors.text,
    },
    logoutSection: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 40,
    },
    logoutButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#FF6B6B20',
    },
    logoutItem: {
      marginTop: 24,
    },
    logoutText: {
      fontSize: 16,
      color: '#FF6B6B',
      marginLeft: 8,
      fontWeight: '600',
    },
  });

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

  // Subscribe to real-time profile updates and sync profile pic
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
            // Sync profile pic state with fetched data
            if (profile.profilePic) {
              setProfilePic(profile.profilePic);
            }
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
    }, [loadUserProfile, setProfilePic])
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
      await changeProfilePic();
      // If successful, update the user profile in state
      if (userProfile) {
        const updatedProfile: UserProfile = {
          ...userProfile,
          profilePic: profilePic || userProfile.profilePic,
        };
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Error changing profile picture:', error);
    }
  };

  // Handle logout
  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.signOut();
              router.replace('/');
            } catch (error: any) {
              Alert.alert('Logout failed', error.message || 'Please try again.');
            }
          },
        },
      ]
    );
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
        contentContainerStyle={styles.scrollContent}
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

        {/* Avatar and Info with Profile Picture Section */}
        <View style={styles.avatarSection}>
          <ProfilePictureSection
            profilePic={profilePic || userProfile.profilePic || null}
            loading={picLoading}
            error={picError}
            onChangePress={handleChangeProfilePicture}
            onErrorDismiss={clearError}
            userName={userProfile.name}
            primaryColor={colors.primary}
            surfaceColor={colors.surface}
            textColor={colors.text}
            size="large"
          />
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
        </View>

        {/* Logout Section - Separate for better visibility */}
        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={20} color="#FF6B6B" />
            <Text style={styles.logoutText}>Logout</Text>
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
