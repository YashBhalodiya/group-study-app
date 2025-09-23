import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Layout } from '../../constants';
import { UserProfile } from '../../services/userService';
import { Button } from './Button';

interface EditProfileModalProps {
  visible: boolean;
  userProfile: UserProfile;
  onClose: () => void;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  userProfile,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(userProfile.name);
  const [bio, setBio] = useState(userProfile.bio || '');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  const validateName = (name: string) => {
    if (!name.trim()) {
      setNameError('Name is required');
      return false;
    }
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSave = async () => {
    if (!validateName(name)) {
      return;
    }

    setLoading(true);
    try {
      const updates: Partial<UserProfile> = {
        name: name.trim(),
        bio: bio.trim(),
      };

      await onSave(updates);
      Alert.alert('Success', 'Profile updated successfully!');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName(userProfile.name);
    setBio(userProfile.bio || '');
    setNameError('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            
            {/* Name Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={[styles.input, nameError && styles.inputError]}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) validateName(text);
                }}
                placeholder="Enter your full name"
                autoCapitalize="words"
                autoComplete="name"
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            {/* Email Field (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>{userProfile.email}</Text>
              </View>
              <Text style={styles.helperText}>Email cannot be changed</Text>
            </View>

            {/* Bio Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
              />
              <Text style={styles.helperText}>
                {bio.length}/200 characters
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: Layout.spacing.sm,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.spacing.lg,
  },
  section: {
    paddingTop: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.lg,
  },
  inputGroup: {
    marginBottom: Layout.spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  readOnlyInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    backgroundColor: Colors.background,
  },
  readOnlyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: Layout.spacing.xs,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.xs,
  },
  footer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    width: '100%',
  },
});
