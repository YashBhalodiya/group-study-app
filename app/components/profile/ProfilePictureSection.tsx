import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

interface ProfilePictureSectionProps {
  profilePic: string | null;
  loading: boolean;
  error: string | null;
  onChangePress: () => void;
  onErrorDismiss?: () => void;
  userName?: string;
  primaryColor?: string;
  surfaceColor?: string;
  textColor?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Reusable component for displaying and changing profile picture
 * Shows profile image with edit button and handles loading/error states
 */
export const ProfilePictureSection: React.FC<ProfilePictureSectionProps> = ({
  profilePic,
  loading,
  error,
  onChangePress,
  onErrorDismiss,
  userName = 'User',
  primaryColor = '#6366F1',
  surfaceColor = '#FFFFFF',
  textColor = '#1F2937',
  size = 'large',
}) => {
  // Size configurations
  const sizeConfig = {
    small: { imageSize: 80, fontSize: 14, iconSize: 24 },
    medium: { imageSize: 120, fontSize: 16, iconSize: 28 },
    large: { imageSize: 160, fontSize: 18, iconSize: 32 },
  };

  const config = sizeConfig[size];

  // Default avatar (initials)
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Show error alert
  React.useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        {
          text: 'OK',
          onPress: onErrorDismiss,
        },
      ]);
    }
  }, [error, onErrorDismiss]);

  return (
    <View style={styles.container}>
      {/* Profile Picture Display */}
      <View
        style={[
          styles.imageWrapper,
          {
            width: config.imageSize,
            height: config.imageSize,
            borderRadius: config.imageSize / 2,
            backgroundColor: primaryColor + '15', // Light primary color background
          },
        ]}
      >
        {profilePic ? (
          <Image
            source={{ uri: profilePic }}
            style={[
              styles.profileImage,
              {
                width: config.imageSize,
                height: config.imageSize,
                borderRadius: config.imageSize / 2,
              },
            ]}
          />
        ) : (
          <View
            style={[
              styles.defaultAvatar,
              {
                width: config.imageSize,
                height: config.imageSize,
                borderRadius: config.imageSize / 2,
                backgroundColor: primaryColor,
              },
            ]}
          >
            <Text
              style={[
                styles.initialsText,
                {
                  fontSize: config.fontSize,
                  color: surfaceColor,
                },
              ]}
            >
              {getInitials(userName)}
            </Text>
          </View>
        )}

        {/* Loading Overlay */}
        {loading && (
          <View
            style={[
              styles.loadingOverlay,
              {
                width: config.imageSize,
                height: config.imageSize,
                borderRadius: config.imageSize / 2,
              },
            ]}
          >
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        )}
      </View>

      {/* Change Picture Button */}
      <TouchableOpacity
        disabled={loading}
        onPress={onChangePress}
        style={[
          styles.editButton,
          {
            backgroundColor: primaryColor,
            opacity: loading ? 0.6 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={surfaceColor} />
        ) : (
          <>
            <Text
              style={[
                styles.editButtonIcon,
                {
                  fontSize: config.iconSize * 0.6,
                  color: surfaceColor,
                },
              ]}
            >
              📸
            </Text>
            <Text
              style={[
                styles.editButtonText,
                {
                  color: surfaceColor,
                  fontSize: config.fontSize * 0.75,
                },
              ]}
            >
              Change
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  imageWrapper: {
    marginBottom: -8, // Negative margin to overlap edit button
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 6,
  },
  profileImage: {
    resizeMode: 'cover',
  },
  defaultAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontWeight: '700',
  },
  loadingOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 16,
    minWidth: 120,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  editButtonIcon: {
    marginRight: 6,
  },
  editButtonText: {
    fontWeight: '600',
  },
});
