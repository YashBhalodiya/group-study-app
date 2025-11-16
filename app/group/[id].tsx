import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { CreateMeetingModal } from '../components/chat/CreateMeetingModal';
import { useTheme } from '../contexts/ThemeContext';
import { AuthService } from '../services/authService';
import { ChatService, Message } from '../services/chatService';
import { MeetingService } from '../services/meetingService';
import { CreateMeetingData } from '../types/meeting';

interface ChatScreenProps {}

export default function ChatScreen({}: ChatScreenProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  
  // Parse group data from params
  const groupId = params.id as string;
  const groupData = params.groupData ? JSON.parse(params.groupData as string) : null;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingModalVisible, setMeetingModalVisible] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const currentUser = AuthService.getCurrentUser();

  // Listen to messages
  useEffect(() => {
    if (!groupId) return;

    const unsubscribe = ChatService.listenToMessages(
      groupId,
      (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
        // Auto scroll to bottom when new messages arrive
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
      (error) => {
        console.error('Message listener error:', error);
        setLoading(false);
        Alert.alert('Error', 'Failed to load messages');
      }
    );

    return unsubscribe;
  }, [groupId]);

  // Send text message
  const handleSendMessage = useCallback(async (text: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    await ChatService.sendTextMessage(groupId, currentUser.uid, text);
  }, [groupId, currentUser]);

  // Send image message
  const handleSendImage = useCallback(async (imageUrl: string, caption?: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    await ChatService.sendImageMessage(groupId, currentUser.uid, imageUrl, caption);
  }, [groupId, currentUser]);

  // Send PDF message
  const handleSendPDF = useCallback(async (pdfUrl: string, fileName: string) => {
    if (!currentUser) throw new Error('User not authenticated');
    await ChatService.sendPdfMessage(groupId, currentUser.uid, pdfUrl, fileName);
  }, [groupId, currentUser]);

  // Create meeting
  const handleCreateMeeting = useCallback(async (meetingData: CreateMeetingData) => {
    if (!currentUser) throw new Error('User not authenticated');
    await MeetingService.createMeeting(groupId, currentUser.uid, meetingData);
  }, [groupId, currentUser]);

  // Open meeting modal
  const openMeetingModal = useCallback(() => {
    setMeetingModalVisible(true);
  }, []);

  // Render message bubble
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isCurrentUser = item.senderId === currentUser?.uid;
    const showAvatar = !isCurrentUser && (index === 0 || messages[index - 1].senderId !== item.senderId);
    const showSenderName = !isCurrentUser && showAvatar;

    return (
      <ChatBubble
        message={item}
        isCurrentUser={isCurrentUser}
        showAvatar={showAvatar}
        showSenderName={showSenderName}
        colors={colors}
      />
    );
  }, [currentUser, messages, colors]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading messages...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => router.push(`/group/info/${groupId}`)}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {groupData?.name || 'Group Chat'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {groupData?.memberCount || 0} members
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => router.push(`/group/info/${groupId}`)}
        >
          <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No messages yet. Start the conversation!
              </Text>
            </View>
          }
        />

        {/* Message input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onSendImage={handleSendImage}
          onSendPDF={handleSendPDF}
          onCreateMeeting={openMeetingModal}
          colors={colors}
        />
      </KeyboardAvoidingView>

      {/* Create Meeting Modal */}
      <CreateMeetingModal
        visible={meetingModalVisible}
        onClose={() => setMeetingModalVisible(false)}
        onSubmit={handleCreateMeeting}
        colors={colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});