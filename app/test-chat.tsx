import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './contexts/ThemeContext';
import { AuthService } from './services/authService';
import { ChatService, Message } from './services/chatService';
import { CloudinaryService } from './services/cloudinaryService';
import { FileHandler } from './utils/fileHandler';

export default function ChatTestScreen() {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Test group ID - replace with actual group ID
  const testGroupId = 'test-group-123';
  const currentUser = AuthService.getCurrentUser();

  // Test functions
  const testSendTextMessage = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await ChatService.sendTextMessage(
        testGroupId,
        currentUser.uid,
        'Hello! This is a test message from the Group Study App 📚'
      );
      Alert.alert('Success', 'Text message sent!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testSendImage = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await FileHandler.sendImageMessage(testGroupId, false);
      Alert.alert('Success', 'Image sent!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testTakePhoto = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await FileHandler.sendImageMessage(testGroupId, true);
      Alert.alert('Success', 'Photo sent!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testSendPDF = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await FileHandler.sendPDFMessage(testGroupId);
      Alert.alert('Success', 'PDF sent!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testChangeProfilePic = async () => {
    setLoading(true);
    try {
      const newUrl = await FileHandler.changeProfilePicture();
      if (newUrl) {
        Alert.alert('Success', 'Profile picture updated!');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testCloudinaryUpload = async () => {
    setLoading(true);
    try {
      const image = await CloudinaryService.pickImage();
      if (image) {
        const result = await CloudinaryService.uploadImageToCloudinary(image.uri);
        if (result.success) {
          Alert.alert('Success', `Image uploaded!\nURL: ${result.url?.substring(0, 50)}...`);
        } else {
          Alert.alert('Error', result.error || 'Upload failed');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Listen to messages for testing
  useEffect(() => {
    const unsubscribe = ChatService.listenToMessages(
      testGroupId,
      (newMessages: Message[]) => {
        setMessages(newMessages);
      },
      (error: Error) => {
        console.error('Message listener error:', error);
      }
    );

    return unsubscribe;
  }, []);

  const testButtons = [
    {
      title: '💬 Send Test Message',
      onPress: testSendTextMessage,
      color: colors.primary,
    },
    {
      title: '🖼️ Send Image from Gallery',
      onPress: testSendImage,
      color: '#4CAF50',
    },
    {
      title: '📷 Take & Send Photo',
      onPress: testTakePhoto,
      color: '#2196F3',
    },
    {
      title: '📄 Send PDF Document',
      onPress: testSendPDF,
      color: '#FF5722',
    },
    {
      title: '👤 Change Profile Picture',
      onPress: testChangeProfilePic,
      color: '#9C27B0',
    },
    {
      title: '☁️ Test Cloudinary Upload',
      onPress: testCloudinaryUpload,
      color: '#FF9800',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Chat & File Upload Tests
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Test all implemented features
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📱 Feature Tests
          </Text>
          
          {testButtons.map((button, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.testButton,
                { 
                  backgroundColor: button.color + '15',
                  borderColor: button.color + '30',
                }
              ]}
              onPress={button.onPress}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: button.color }]}>
                {button.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            📊 Test Results
          </Text>
          
          <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {messages.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Messages Received
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {messages.filter(m => m.fileType === 'image').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Images
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {messages.filter(m => m.fileType === 'pdf').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                PDFs
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            ✅ Implementation Status
          </Text>
          
          <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
            <StatusItem title="Firebase Real-time Chat" status="✅" colors={colors} />
            <StatusItem title="Cloudinary Image Upload" status="✅" colors={colors} />
            <StatusItem title="PDF Document Upload" status="✅" colors={colors} />
            <StatusItem title="Profile Picture Upload" status="✅" colors={colors} />
            <StatusItem title="Message Bubbles UI" status="✅" colors={colors} />
            <StatusItem title="File Opening (PDF)" status="✅" colors={colors} />
            <StatusItem title="Real-time Listeners" status="✅" colors={colors} />
            <StatusItem title="Error Handling" status="✅" colors={colors} />
          </View>
        </View>

        {loading && (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.surface + 'CC' }]}>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Processing...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const StatusItem: React.FC<{ title: string; status: string; colors: any }> = ({
  title,
  status,
  colors,
}) => (
  <View style={styles.statusItem}>
    <Text style={[styles.statusTitle, { color: colors.text }]}>{title}</Text>
    <Text style={styles.statusIcon}>{status}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  testButton: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 12,
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
  statusCard: {
    padding: 16,
    borderRadius: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusTitle: {
    fontSize: 14,
  },
  statusIcon: {
    fontSize: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
});