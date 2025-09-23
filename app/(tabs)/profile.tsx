
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
import { EditProfileModal } from '../components/ui';
import { Colors, Layout } from '../constants';
import { UserProfile, UserService } from '../services/userService';

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

  // Handle logout
  const handleLogout = useCallback(async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await UserService.clearUserData();
            router.replace('/');
          },
        },
      ]
    );
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
          <View style={[styles.avatar, { backgroundColor: userProfile.avatarColor || UserService.generateAvatarColor(userProfile.name) }]}> 
            <Feather name="user" size={56} color={Colors.text} />
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
          <TouchableOpacity style={styles.settingsItem}>
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
