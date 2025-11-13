import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface MessageActionsProps {
  onTakePhoto: () => void;
  onChooseImage: () => void;
  onChoosePDF: () => void;
  colors: any;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  onTakePhoto,
  onChooseImage,
  onChoosePDF,
  colors,
}) => {
  const actions = [
    {
      icon: 'camera-alt',
      title: 'Camera',
      subtitle: 'Take a photo',
      onPress: onTakePhoto,
      color: '#4CAF50',
    },
    {
      icon: 'photo-library',
      title: 'Gallery',
      subtitle: 'Choose from gallery',
      onPress: onChooseImage,
      color: '#2196F3',
    },
    {
      icon: 'picture-as-pdf',
      title: 'PDF',
      subtitle: 'Share a document',
      onPress: onChoosePDF,
      color: '#FF5722',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Send Attachment
      </Text>
      
      {actions.map((action, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.actionItem, { borderBottomColor: colors.border }]}
          onPress={action.onPress}
        >
          <View style={[styles.iconContainer, { backgroundColor: action.color + '20' }]}>
            <MaterialIcons name={action.icon as any} size={24} color={action.color} />
          </View>
          
          <View style={styles.actionText}>
            <Text style={[styles.actionTitle, { color: colors.text }]}>
              {action.title}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
              {action.subtitle}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
  },
});