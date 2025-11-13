import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { AuthService } from '../../services/authService';
import { CloudinaryService } from '../../services/cloudinaryService';
import {
    pickProfileImage,
    saveProfilePicToFirestore,
    uploadProfileImage
} from '../../services/profilePictureService';
import { UserProfile } from '../../services/userService';

interface ProfileScreenComponentProps {
  userProfile: UserProfile;
  onProfileUpdate: (updates: Partial<UserProfile>) => Promise<void>;
}

export const ProfileScreenComponent: React.FC<ProfileScreenComponentProps> = ({
  userProfile,
  onProfileUpdate,
}) => {
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [currentProfilePic, setCurrentProfilePic] = useState(userProfile.profilePic);

  const handleChangeProfilePicture = useCallback(async () => {
    if (uploading) return;

    try {
      setUploading(true);

      // Show options for profile picture
      Alert.alert(
        'Change Profile Picture',
        'Choose how you want to update your profile picture',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              try {
                const photo = await CloudinaryService.takePhoto();
                if (photo) {
                  await handleUploadProfilePic(photo.uri);
                }
              } catch (error: any) {
                console.error('Error taking photo:', error);
                Alert.alert('Error', 'Failed to take photo');
                setUploading(false);
              }
            },
          },
          {
            text: 'Choose from Gallery',
            onPress: async () => {
              try {
                const imageUri = await pickProfileImage();
                if (imageUri) {
                  await handleUploadProfilePic(imageUri);
                }
              } catch (error: any) {
                console.error('Error picking image:', error);
                Alert.alert('Error', 'Failed to pick image');
                setUploading(false);
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setUploading(false),
          },
        ],
        { cancelable: true, onDismiss: () => setUploading(false) }
      );
    } catch (error: any) {
      console.error('Error changing profile picture:', error);
      Alert.alert('Error', 'Failed to change profile picture');
      setUploading(false);
    }
  }, [uploading]);

  const handleUploadProfilePic = useCallback(async (imageUri: string) => {
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadProfileImage(imageUri);
      
      // Save to Firestore
      await saveProfilePicToFirestore(currentUser.uid, cloudinaryUrl);
      
      // Update local state
      setCurrentProfilePic(cloudinaryUrl);
      
      // Update parent component
      await onProfileUpdate({ profilePic: cloudinaryUrl });
      
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      Alert.alert('Error', error.message || 'Failed to update profile picture');
    } finally {
      setUploading(false);
    }
  }, [onProfileUpdate]);

  const getOptimizedAvatarUrl = useCallback((url?: string) => {
    if (!url) return null;
    return CloudinaryService.getOptimizedImageUrl(url, 200, 200, 'fill');
  }, []);

  const renderProfilePicture = () => {
    const optimizedUrl = getOptimizedAvatarUrl(currentProfilePic);
    
    return (
      <View style={styles.profilePictureContainer}>
        <View style={[
          styles.profilePicture,
          { backgroundColor: userProfile.avatarColor || colors.primary }
        ]}>
          {optimizedUrl ? (
            <Image
              source={{ uri: optimizedUrl }}
              style={styles.profileImage}
            />
          ) : (
            <Text style={styles.profileInitial}>
              {userProfile.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        
        <TouchableOpacity
          style={[styles.changePictureButton, { backgroundColor: colors.primary }]}
          onPress={handleChangeProfilePicture}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Feather name="camera" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section */}
        <View style={styles.profileSection}>
          {renderProfilePicture()}
          
          <Text style={[styles.userName, { color: colors.text }]}>
            {userProfile.name}
          </Text>
          
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {userProfile.email}
          </Text>
          
          {userProfile.bio && (
            <Text style={[styles.userBio, { color: colors.textSecondary }]}>
              {userProfile.bio}
            </Text>
          )}
        </View>

        {/* Profile Stats Section */}
        <View style={[styles.statsSection, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {userProfile.joinedGroups?.length || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Groups Joined
            </Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {Math.floor(Math.random() * 50) + 10}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Messages Sent
            </Text>
          </View>
          
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {Math.floor(Math.random() * 10) + 1}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Files Shared
            </Text>
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          
          <TouchableOpacity
            style={[styles.actionItem, { backgroundColor: colors.surface }]}
          >
            <Feather name="edit-3" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Edit Profile
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionItem, { backgroundColor: colors.surface }]}
          >
            <Feather name="bell" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Notification Settings
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionItem, { backgroundColor: colors.surface }]}
          >
            <Feather name="shield" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Privacy Settings
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileInitial: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  changePictureButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 8,
  },
  userBio: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  statsSection: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 16,
  },
  actionsSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
});