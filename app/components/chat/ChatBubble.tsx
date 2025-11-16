import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { ChatService, Message } from '../../services/chatService';
import { CloudinaryService } from '../../services/cloudinaryService';
import { MeetingService } from '../../services/meetingService';

interface ChatBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  showAvatar: boolean;
  showSenderName: boolean;
  colors: any;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isCurrentUser,
  showAvatar,
  showSenderName,
  colors,
}) => {
  const handleOpenPDF = async (url: string) => {
    try {
      // Format the PDF URL using Cloudinary service helper
      const pdfUrl = CloudinaryService.formatPDFUrl(url);
      
      // For Cloudinary raw files, we need to download first then open
      // This is more reliable than trying to open the URL directly
      if (pdfUrl.includes('cloudinary.com') && pdfUrl.includes('/raw/upload/')) {
        try {
          // Create a local file path
          const fileName = pdfUrl.split('/').pop() || `document_${Date.now()}.pdf`;
          // Clean the fileName to remove query parameters if any
          const cleanFileName = fileName.split('?')[0];
          const fileUri = `${FileSystem.cacheDirectory}${cleanFileName}`;
          
          // Download the PDF file
          const downloadResult = await FileSystem.downloadAsync(pdfUrl, fileUri);
          
          if (downloadResult.status === 200) {
            // Try to get content URI (Android) or use file URI directly
            try {
              const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);
              const canOpen = await Linking.canOpenURL(contentUri);
              if (canOpen) {
                await Linking.openURL(contentUri);
                return;
              }
            } catch (contentUriError) {
              // If getContentUriAsync fails, try with the file URI directly
              console.log('Content URI failed, trying file URI:', contentUriError);
            }
            
            // Fallback: try opening the file URI directly
            const canOpenFile = await Linking.canOpenURL(downloadResult.uri);
            if (canOpenFile) {
              await Linking.openURL(downloadResult.uri);
              return;
            } else {
              // Last resort: try opening the original URL
              await Linking.openURL(pdfUrl);
            }
          } else {
            throw new Error(`Failed to download PDF: Status ${downloadResult.status}`);
          }
        } catch (downloadError: any) {
          console.log('Download failed, trying direct URL:', downloadError);
          // Fallback to direct URL opening
          const canOpen = await Linking.canOpenURL(pdfUrl);
          if (canOpen) {
            await Linking.openURL(pdfUrl);
          } else {
            await WebBrowser.openBrowserAsync(pdfUrl, {
              showTitle: true,
              enableBarCollapsing: true,
              showInRecents: true,
            });
          }
        }
      } else {
        // For non-Cloudinary URLs, try direct opening
        try {
          const canOpen = await Linking.canOpenURL(pdfUrl);
          if (canOpen) {
            await Linking.openURL(pdfUrl);
            return;
          }
        } catch (linkingError) {
          console.log('Linking failed, trying WebBrowser:', linkingError);
        }
        
        // Fallback to WebBrowser
        await WebBrowser.openBrowserAsync(pdfUrl, {
          showTitle: true,
          enableBarCollapsing: true,
          showInRecents: true,
        });
      }
    } catch (error: any) {
      console.error('Error opening PDF:', error);
      Alert.alert(
        'Error Opening PDF', 
        error.message || 'Failed to open PDF. The file may be corrupted or inaccessible. Please try again later.'
      );
    }
  };

  const handleOpenMeetingLink = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      console.error('Error opening meeting link:', error);
      Alert.alert('Error', 'Failed to open meeting link');
    }
  };

  const handleImagePress = (imageUrl: string) => {
    // You can implement full-screen image viewer here
    Alert.alert('Image Viewer', 'Full-screen image viewer can be implemented here');
  };

  const getOptimizedImageUrl = (url: string) => {
    return CloudinaryService.getOptimizedImageUrl(url, 300, 300, 'fill');
  };

  return (
    <View style={[
      styles.messageContainer,
      isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
    ]}>
      {/* Avatar for other users */}
      {showAvatar && !isCurrentUser && (
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          {message.senderAvatar ? (
            <Image
              source={{ uri: getOptimizedImageUrl(message.senderAvatar) }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>
              {message.senderName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
      )}
      
      {/* Message content */}
      <View style={[
        styles.messageContent,
        isCurrentUser 
          ? [styles.currentUserBubble, { backgroundColor: colors.primary }] 
          : [styles.otherUserBubble, { backgroundColor: colors.surface }],
        !showAvatar && !isCurrentUser && styles.messageContentWithoutAvatar
      ]}>
        {showSenderName && (
          <Text style={[styles.senderName, { color: colors.primary }]}>
            {message.senderName}
          </Text>
        )}
        
        {/* Text message */}
        {message.fileType === 'text' && (
          <Text style={[
            styles.messageText,
            { color: isCurrentUser ? '#fff' : colors.text }
          ]}>
            {message.text}
          </Text>
        )}
        
        {/* Image message */}
        {message.fileType === 'image' && (
          <View style={styles.imageMessage}>
            <TouchableOpacity
              onPress={() => handleImagePress(message.fileUrl!)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: getOptimizedImageUrl(message.fileUrl!) }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
            {message.text && (
              <Text style={[
                styles.messageText,
                { color: isCurrentUser ? '#fff' : colors.text, marginTop: 8 }
              ]}>
                {message.text}
              </Text>
            )}
          </View>
        )}
        
        {/* PDF message */}
        {message.fileType === 'pdf' && (
          <TouchableOpacity
            style={[
              styles.pdfMessage,
              { backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.1)' : colors.background }
            ]}
            onPress={() => handleOpenPDF(message.fileUrl!)}
            activeOpacity={0.7}
          >
            <View style={styles.pdfIcon}>
              <MaterialIcons name="picture-as-pdf" size={32} color="#FF6B6B" />
            </View>
            <View style={styles.pdfInfo}>
              <Text style={[
                styles.pdfFileName,
                { color: isCurrentUser ? '#fff' : colors.text }
              ]} numberOfLines={1}>
                {message.text}
              </Text>
              <Text style={[
                styles.pdfAction,
                { color: isCurrentUser ? 'rgba(255,255,255,0.8)' : colors.primary }
              ]}>
                Tap to open PDF
              </Text>
            </View>
            <MaterialIcons 
              name="open-in-new" 
              size={16} 
              color={isCurrentUser ? 'rgba(255,255,255,0.6)' : colors.textSecondary} 
            />
          </TouchableOpacity>
        )}

        {/* Meeting message */}
        {message.fileType === 'meeting' && (
          <View
            style={[
              styles.meetingMessage,
              { backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.1)' : colors.background }
            ]}
          >
            <View style={[styles.meetingHeader, { borderBottomColor: isCurrentUser ? 'rgba(255,255,255,0.2)' : colors.border }]}>
              <View style={[styles.meetingIconContainer, { backgroundColor: isCurrentUser ? 'rgba(255,255,255,0.2)' : colors.primary }]}>
                <MaterialIcons 
                  name="event" 
                  size={24} 
                  color={isCurrentUser ? '#fff' : '#fff'} 
                />
              </View>
              <View style={styles.meetingTitleContainer}>
                <Text style={[styles.meetingBadge, { color: isCurrentUser ? 'rgba(255,255,255,0.9)' : colors.primary }]}>
                  MEETING SCHEDULED
                </Text>
                <Text style={[
                  styles.meetingTitle,
                  { color: isCurrentUser ? '#fff' : colors.text }
                ]} numberOfLines={2}>
                  {message.text}
                </Text>
              </View>
            </View>
            
            {message.meetingData && (
              <View style={styles.meetingDetails}>
                <View style={styles.meetingDetailRow}>
                  <MaterialIcons 
                    name="description" 
                    size={16} 
                    color={isCurrentUser ? 'rgba(255,255,255,0.8)' : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.meetingDescription,
                    { color: isCurrentUser ? 'rgba(255,255,255,0.9)' : colors.text }
                  ]} numberOfLines={3}>
                    {message.meetingData.description}
                  </Text>
                </View>

                <View style={styles.meetingDetailRow}>
                  <MaterialIcons 
                    name="access-time" 
                    size={16} 
                    color={isCurrentUser ? 'rgba(255,255,255,0.8)' : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.meetingDateTime,
                    { color: isCurrentUser ? 'rgba(255,255,255,0.9)' : colors.text }
                  ]}>
                    {MeetingService.formatMeetingDate(new Date(message.meetingData.dateTime))}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.meetingLinkButton,
                    { backgroundColor: isCurrentUser ? '#fff' : colors.primary }
                  ]}
                  onPress={() => handleOpenMeetingLink(message.meetingData!.meetingLink)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons 
                    name="videocam" 
                    size={18} 
                    color={isCurrentUser ? colors.primary : '#fff'} 
                  />
                  <Text style={[
                    styles.meetingLinkText,
                    { color: isCurrentUser ? colors.primary : '#fff' }
                  ]}>
                    Join Meeting
                  </Text>
                  <MaterialIcons 
                    name="arrow-forward" 
                    size={16} 
                    color={isCurrentUser ? colors.primary : '#fff'} 
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        
        {/* Timestamp */}
        <Text style={[
          styles.messageTime,
          { color: isCurrentUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
        ]}>
          {ChatService.formatMessageTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  currentUserMessage: {
    justifyContent: 'flex-end',
  },
  otherUserMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageContent: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  messageContentWithoutAvatar: {
    marginLeft: 40,
  },
  currentUserBubble: {
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  imageMessage: {
    minWidth: 200,
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  pdfMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  pdfIcon: {
    marginRight: 12,
  },
  pdfInfo: {
    flex: 1,
  },
  pdfFileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  pdfAction: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  meetingMessage: {
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 250,
    maxWidth: '100%',
  },
  meetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  meetingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  meetingTitleContainer: {
    flex: 1,
  },
  meetingBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  meetingDetails: {
    padding: 12,
  },
  meetingDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  meetingDescription: {
    fontSize: 14,
    lineHeight: 18,
    flex: 1,
  },
  meetingDateTime: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  meetingLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 4,
    gap: 6,
  },
  meetingLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});