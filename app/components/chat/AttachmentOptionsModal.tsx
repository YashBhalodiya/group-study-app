import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AttachmentOption {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  onPress: () => void;
}

interface AttachmentOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseImage: () => void;
  onSendPDF: () => void;
  onCreateMeeting?: () => void;
  colors: any;
}

export const AttachmentOptionsModal: React.FC<AttachmentOptionsModalProps> = ({
  visible,
  onClose,
  onTakePhoto,
  onChooseImage,
  onSendPDF,
  onCreateMeeting,
  colors,
}) => {
  const options: AttachmentOption[] = [
    {
      id: 'photo',
      title: 'Take Photo',
      subtitle: 'Capture with camera',
      icon: 'camera-alt',
      color: '#4CAF50',
      onPress: () => {
        onClose();
        setTimeout(onTakePhoto, 300);
      },
    },
    {
      id: 'image',
      title: 'Choose Image',
      subtitle: 'Select from gallery',
      icon: 'photo-library',
      color: '#2196F3',
      onPress: () => {
        onClose();
        setTimeout(onChooseImage, 300);
      },
    },
    {
      id: 'pdf',
      title: 'Send PDF',
      subtitle: 'Share document',
      icon: 'picture-as-pdf',
      color: '#FF5722',
      onPress: () => {
        onClose();
        setTimeout(onSendPDF, 300);
      },
    },
  ];

  // Add Create Meeting option if handler is provided
  if (onCreateMeeting) {
    options.push({
      id: 'meeting',
      title: 'Create Meeting',
      subtitle: 'Schedule group meeting',
      icon: 'event',
      color: '#9C27B0',
      onPress: () => {
        onClose();
        setTimeout(onCreateMeeting, 300);
      },
    });
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handleBar} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Send Attachment
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Choose what you want to send
            </Text>
          </View>

          {/* Options - All 4 in a horizontal row */}
          <View style={styles.optionsContainer}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionCard}
                onPress={option.onPress}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: option.color },
                  ]}
                >
                  <MaterialIcons
                    name={option.icon}
                    size={24}
                    color="#fff"
                  />
                </View>
                <Text style={[styles.optionTitle, { color: colors.text }]} numberOfLines={2}>
                  {option.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 20,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  optionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  optionTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
});
