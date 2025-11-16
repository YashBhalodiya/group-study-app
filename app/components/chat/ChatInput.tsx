import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CloudinaryService } from '../../services/cloudinaryService';
import { AttachmentOptionsModal } from './AttachmentOptionsModal';

interface ChatInputProps {
  onSendMessage: (text: string) => Promise<void>;
  onSendImage: (imageUrl: string, caption?: string) => Promise<void>;
  onSendPDF: (pdfUrl: string, fileName: string) => Promise<void>;
  onCreateMeeting?: () => void;
  colors: any;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onSendImage,
  onSendPDF,
  onCreateMeeting,
  colors,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState<'image' | 'pdf' | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || sending || disabled) return;

    setSending(true);
    try {
      await onSendMessage(message.trim());
      setMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSendImage = async (useCamera: boolean = false) => {
    if (uploading || disabled) return;

    try {
      setUploading('image');
      
      // Pick image
      const pickedImage = useCamera 
        ? await CloudinaryService.takePhoto()
        : await CloudinaryService.pickImage();
        
      if (!pickedImage) {
        setUploading(null);
        return;
      }

      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadImageToCloudinary(pickedImage.uri);
      
      if (uploadResult.success && uploadResult.url) {
        await onSendImage(uploadResult.url);
      } else {
        throw new Error(uploadResult.error || 'Failed to upload image');
      }
    } catch (error: any) {
      console.error('Error sending image:', error);
      Alert.alert('Error', error.message || 'Failed to send image');
    } finally {
      setUploading(null);
    }
  };

  const handleSendPDF = async () => {
    if (uploading || disabled) return;

    try {
      setUploading('pdf');
      
      // Pick PDF
      const pickedPdf = await CloudinaryService.pickPDF();
      if (!pickedPdf) {
        setUploading(null);
        return;
      }

      // Upload to Cloudinary
      const uploadResult = await CloudinaryService.uploadPDFToCloudinary(
        pickedPdf.uri, 
        pickedPdf.name
      );
      
      if (uploadResult.success && uploadResult.url) {
        await onSendPDF(uploadResult.url, pickedPdf.name);
      } else {
        throw new Error(uploadResult.error || 'Failed to upload PDF');
      }
    } catch (error: any) {
      console.error('Error sending PDF:', error);
      Alert.alert('Error', error.message || 'Failed to send PDF');
    } finally {
      setUploading(null);
    }
  };

  const showAttachmentOptions = () => {
    if (disabled || !!uploading) return;
    setShowAttachmentModal(true);
  };

  return (
    <>
      {/* Upload indicator */}
      {uploading && (
        <View style={[styles.uploadIndicator, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.uploadText, { color: colors.text }]}>
            {uploading === 'image' ? 'Uploading image...' : 'Uploading PDF...'}
          </Text>
        </View>
      )}

      {/* Input container */}
      <View style={[
        styles.inputContainer,
        { 
          backgroundColor: colors.surface,
          borderTopColor: colors.border
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.attachButton,
            { backgroundColor: colors.background },
            (disabled || !!uploading) && styles.disabledButton
          ]}
          onPress={showAttachmentOptions}
          disabled={disabled || !!uploading}
        >
          <Feather 
            name="paperclip" 
            size={20} 
            color={disabled || !!uploading ? colors.textSecondary : colors.primary} 
          />
        </TouchableOpacity>
        
        <TextInput
          style={[
            styles.messageInput,
            { 
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border
            }
          ]}
          placeholder="Type a message..."
          placeholderTextColor={colors.textSecondary}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
          editable={!disabled && !uploading}
          blurOnSubmit={false}
          returnKeyType="send"
          onSubmitEditing={Platform.OS === 'ios' ? handleSend : undefined}
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            { 
              backgroundColor: (message.trim() && !disabled && !uploading) 
                ? colors.primary 
                : colors.border 
            }
          ]}
          onPress={handleSend}
          disabled={!message.trim() || sending || disabled || !!uploading}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name="send"
              size={18}
              color={(message.trim() && !disabled && !uploading) ? '#fff' : colors.textSecondary}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Attachment Options Modal */}
      <AttachmentOptionsModal
        visible={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        onTakePhoto={() => handleSendImage(true)}
        onChooseImage={() => handleSendImage(false)}
        onSendPDF={handleSendPDF}
        onCreateMeeting={onCreateMeeting}
        colors={colors}
      />
    </>
  );
};

const styles = StyleSheet.create({
  uploadIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  uploadText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 120,
    marginRight: 8,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});