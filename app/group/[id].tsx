import { Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants';

interface Message {
  id: string;
  text: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  type: 'text' | 'image' | 'file' | 'assignment' | 'announcement' | 'meeting';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  meetingTitle?: string;
  meetingLink?: string;
  meetingDate?: Date;
  isOwn: boolean;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  points: number;
  submitted: boolean;
  submissionCount: number;
  totalStudents: number;
}

interface GroupDetails {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  subject: string;
  code: string;
  members: Array<{
    id: string;
    name: string;
    role: 'teacher' | 'student';
    avatar?: string;
  }>;
}

// Storage keys for group members
const GROUPS_STORAGE_KEY = 'user_groups';

// Function to load real group members from storage
const loadGroupMembersFromStorage = async (groupId: string) => {
  try {
    const storedGroups = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
    if (storedGroups) {
      const groups = JSON.parse(storedGroups);
      const currentGroup = groups.find((g: any) => g.id === groupId);
      if (currentGroup && currentGroup.members) {
        return currentGroup.members;
      }
    }
    return [];
  } catch (error) {
    console.error('Error loading group members:', error);
    return [];
  }
};

// Function to save updated group members to storage
const saveGroupMembersToStorage = async (groupId: string, members: any[]) => {
  try {
    const storedGroups = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
    if (storedGroups) {
      const groups = JSON.parse(storedGroups);
      const updatedGroups = groups.map((group: any) => 
        group.id === groupId 
          ? { ...group, members: members, memberCount: members.length }
          : group
      );
      await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(updatedGroups));
    }
  } catch (error) {
    console.error('Error saving group members:', error);
  }
};

export default function GroupChatScreen() {
  const { id, groupData } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [groupDetails, setGroupDetails] = useState<GroupDetails | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showClassroomPanel, setShowClassroomPanel] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    time: '',
    link: '',
  });
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    points: '',
  });
  const flatListRef = useRef<FlatList>(null);

  // Parse group data from params or use fallback
  let currentGroup = null;
  try {
    if (groupData && typeof groupData === 'string') {
      currentGroup = JSON.parse(groupData);
    }
  } catch (error) {
    console.error('Error parsing group data:', error);
  }

  // If no group data passed, try to find in mock groups (for backward compatibility)
  if (!currentGroup) {
    const mockGroups = [
      {
        id: '1',
        name: 'Study Group for Calculus',
        description: 'Advanced calculus concepts and problem solving',
        memberCount: 5,
        isCreator: false,
        subject: 'Mathematics',
        code: 'CALC2024',
      },
      {
        id: '2',
        name: 'Literature Discussion',
        description: 'Modern literature analysis and discussion',
        memberCount: 8,
        isCreator: true,
        subject: 'English Literature',
        code: 'LIT2024',
      },
      {
        id: '3',
        name: 'Physics Study Buddies',
        description: 'Quantum physics and thermodynamics study group',
        memberCount: 3,
        isCreator: false,
        subject: 'Physics',
        code: 'PHY2024',
      },
    ];

    currentGroup = mockGroups.find(group => group.id === id);
  }

  // Mock data - now dynamic based on group
  const mockGroupDetails: GroupDetails = {
    id: id as string,
    name: currentGroup?.name || 'Unknown Group',
    description: currentGroup?.description || 'No description available',
    memberCount: currentGroup?.memberCount || 1,
    subject: currentGroup?.subject || 'General',
    code: currentGroup?.code || 'UNKNOWN',
    members: generateMembers(currentGroup?.memberCount || 1),
  };

  // Generate dynamic members based on actual group members
  async function generateMembers(memberCount: number) {
    // First try to load real members from storage
    const realMembers = await loadGroupMembersFromStorage(id as string);
    
    if (realMembers && realMembers.length > 0) {
      return realMembers;
    }

    // If no real members found, initialize with default creator and current user
    const defaultMembers = [
      { 
        id: 'creator_' + (currentGroup?.code || 'unknown'), 
        name: 'Group Creator', 
        role: 'teacher' as const,
        joinedAt: new Date()
      },
      { 
        id: 'current_user', 
        name: 'You', 
        role: 'student' as const,
        joinedAt: new Date()
      },
    ];

    // Save these default members to storage
    await saveGroupMembersToStorage(id as string, defaultMembers);
    
    return defaultMembers;
  }

  // Dynamic messages based on group
  const getGroupMessages = (): Message[] => {
    const baseMessages = [
      {
        id: '1',
        text: `Welcome to the ${currentGroup?.name || 'study group'}! ${getSubjectEmoji(currentGroup?.subject)}`,
        sender: { id: '1', name: 'John Doe' },
        timestamp: new Date(Date.now() - 86400000),
        type: 'text' as const,
        isOwn: false,
      },
      {
        id: '2',
        text: 'Hi everyone! Excited to study together 🎓',
        sender: { id: '2', name: 'Jane Smith' },
        timestamp: new Date(Date.now() - 82800000),
        type: 'text' as const,
        isOwn: false,
      },
    ];

    // Add subject-specific messages
    if (currentGroup?.subject === 'Mathematics') {
      baseMessages.push({
        id: '3',
        text: 'Can someone help me with derivatives?',
        sender: { id: '5', name: 'You' },
        timestamp: new Date(Date.now() - 3600000),
        type: 'text' as const,
        isOwn: true,
      });
    } else if (currentGroup?.subject === 'English Literature') {
      baseMessages.push({
        id: '3',
        text: 'What do you think about the symbolism in chapter 3?',
        sender: { id: '5', name: 'You' },
        timestamp: new Date(Date.now() - 3600000),
        type: 'text' as const,
        isOwn: true,
      });
    } else if (currentGroup?.subject === 'Physics') {
      baseMessages.push({
        id: '3',
        text: 'The quantum mechanics assignment is challenging! 🤯',
        sender: { id: '5', name: 'You' },
        timestamp: new Date(Date.now() - 3600000),
        type: 'text' as const,
        isOwn: true,
      });
    }

    baseMessages.push({
      id: '4',
      text: `New assignment posted: ${getSubjectAssignment(currentGroup?.subject)}`,
      sender: { id: '1', name: 'John Doe' },
      timestamp: new Date(Date.now() - 1800000),
      type: 'assignment' as const,
      isOwn: false,
    });

    return baseMessages;
  };

  const getSubjectEmoji = (subject?: string) => {
    switch (subject?.toLowerCase()) {
      case 'mathematics':
        return '📐';
      case 'english literature':
        return '📚';
      case 'physics':
        return '⚛️';
      default:
        return '📖';
    }
  };

  const getSubjectAssignment = (subject?: string) => {
    switch (subject?.toLowerCase()) {
      case 'mathematics':
        return 'Limits and Continuity';
      case 'english literature':
        return 'Character Analysis Essay';
      case 'physics':
        return 'Quantum Mechanics Problems';
      default:
        return 'Study Assignment';
    }
  };

  const mockMessages: Message[] = getGroupMessages();

  // Dynamic assignments based on group subject
  const getGroupAssignments = (): Assignment[] => {
    const memberCount = currentGroup?.memberCount || 4;
    
    if (currentGroup?.subject === 'Mathematics') {
      return [
        {
          id: '1',
          title: 'Limits and Continuity',
          description: 'Complete exercises 1-15 from Chapter 2. Show all work and explain your reasoning.',
          dueDate: new Date(Date.now() + 604800000),
          points: 50,
          submitted: false,
          submissionCount: 2,
          totalStudents: memberCount - 1,
        },
        {
          id: '2',
          title: 'Derivative Applications',
          description: 'Solve the optimization problems and graph the functions.',
          dueDate: new Date(Date.now() + 1209600000),
          points: 75,
          submitted: true,
          submissionCount: 1,
          totalStudents: memberCount - 1,
        },
      ];
    } else if (currentGroup?.subject === 'English Literature') {
      return [
        {
          id: '1',
          title: 'Character Analysis Essay',
          description: 'Write a 1000-word essay analyzing the main character development in the assigned novel.',
          dueDate: new Date(Date.now() + 604800000),
          points: 100,
          submitted: false,
          submissionCount: 3,
          totalStudents: memberCount - 1,
        },
        {
          id: '2',
          title: 'Poetry Interpretation',
          description: 'Analyze the themes and literary devices in the selected poems.',
          dueDate: new Date(Date.now() + 1209600000),
          points: 60,
          submitted: true,
          submissionCount: 5,
          totalStudents: memberCount - 1,
        },
      ];
    } else if (currentGroup?.subject === 'Physics') {
      return [
        {
          id: '1',
          title: 'Quantum Mechanics Problems',
          description: 'Solve problems 1-10 from the quantum mechanics chapter. Show wave function calculations.',
          dueDate: new Date(Date.now() + 604800000),
          points: 80,
          submitted: false,
          submissionCount: 1,
          totalStudents: memberCount - 1,
        },
        {
          id: '2',
          title: 'Thermodynamics Lab Report',
          description: 'Complete the lab report with data analysis and conclusions.',
          dueDate: new Date(Date.now() + 1209600000),
          points: 90,
          submitted: false,
          submissionCount: 0,
          totalStudents: memberCount - 1,
        },
      ];
    } else {
      return [
        {
          id: '1',
          title: 'Study Assignment',
          description: 'Complete the assigned reading and submit your notes.',
          dueDate: new Date(Date.now() + 604800000),
          points: 50,
          submitted: false,
          submissionCount: 1,
          totalStudents: memberCount - 1,
        },
      ];
    }
  };

  const mockAssignments: Assignment[] = getGroupAssignments();

  useEffect(() => {
    loadGroupData();
    
    // Refresh data when screen comes into focus (e.g., after joining)
    const interval = setInterval(() => {
      loadGroupData();
    }, 2000); // Refresh every 2 seconds
    
    return () => clearInterval(interval);
  }, []);

  const loadGroupData = async () => {
    const members = await generateMembers(currentGroup?.memberCount || 1);
    
    // Update mock group details with real members
    const updatedGroupDetails: GroupDetails = {
      id: id as string,
      name: currentGroup?.name || 'Unknown Group',
      description: currentGroup?.description || 'No description available',
      memberCount: members.length, // Use actual member count
      subject: currentGroup?.subject || 'General',
      code: currentGroup?.code || 'UNKNOWN',
      members: members,
    };
    
    setGroupDetails(updatedGroupDetails);
    setMessages(mockMessages);
    setAssignments(mockAssignments);
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        sender: { id: '5', name: 'You' },
        timestamp: new Date(),
        type: 'text',
        isOwn: true,
      };
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      // Auto scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleUploadMaterial = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        
        // Create a file message
        const fileMessage: Message = {
          id: Date.now().toString(),
          text: `Uploaded: ${file.name}`,
          sender: { id: '5', name: 'You' },
          timestamp: new Date(),
          type: 'file',
          fileName: file.name,
          fileSize: file.size || 0,
          fileUrl: file.uri,
          isOwn: true,
        };
        
        setMessages(prev => [...prev, fileMessage]);
        
        // Auto scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
        
        Alert.alert('Success', 'File uploaded successfully!');
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    }
  };

  const createMeeting = () => {
    if (!newMeeting.title || !newMeeting.date || !newMeeting.time || !newMeeting.link) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // Combine date and time
    const meetingDateTime = new Date(`${newMeeting.date}T${newMeeting.time}`);
    
    // Create meeting message
    const meetingMessage: Message = {
      id: Date.now().toString(),
      text: `Meeting scheduled: ${newMeeting.title}`,
      sender: { id: '5', name: 'You' },
      timestamp: new Date(),
      type: 'meeting',
      meetingTitle: newMeeting.title,
      meetingLink: newMeeting.link,
      meetingDate: meetingDateTime,
      isOwn: true,
    };

    setMessages(prev => [...prev, meetingMessage]);
    setNewMeeting({ title: '', date: '', time: '', link: '' });
    setShowMeetingModal(false);
    
    // Auto scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    Alert.alert('Success', 'Meeting scheduled successfully!');
  };

  const createAssignment = () => {
    if (!newAssignment.title || !newAssignment.description || !newAssignment.dueDate || !newAssignment.points) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    const assignment: Assignment = {
      id: Date.now().toString(),
      title: newAssignment.title,
      description: newAssignment.description,
      dueDate: new Date(newAssignment.dueDate),
      points: parseInt(newAssignment.points),
      submitted: false,
      submissionCount: 0,
      totalStudents: groupDetails?.memberCount || 0,
    };

    setAssignments(prev => [assignment, ...prev]);
    
    // Add assignment message to chat
    const assignmentMessage: Message = {
      id: Date.now().toString() + '_msg',
      text: `New assignment posted: ${assignment.title}`,
      sender: { id: '5', name: 'You' },
      timestamp: new Date(),
      type: 'assignment',
      isOwn: true,
    };
    setMessages(prev => [...prev, assignmentMessage]);

    setNewAssignment({ title: '', description: '', dueDate: '', points: '' });
    setShowAssignmentModal(false);
    Alert.alert('Success', 'Assignment created successfully!');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      {!item.isOwn && (
        <Text style={styles.senderName}>{item.sender.name}</Text>
      )}
      
      {item.type === 'file' ? (
        // File message bubble
        <View style={[
          styles.messageBubble,
          item.isOwn ? styles.ownBubble : styles.otherBubble,
          styles.fileBubble
        ]}>
          <View style={styles.fileContainer}>
            <Feather name="file" size={24} color={Colors.primary} />
            <View style={styles.fileInfo}>
              <Text style={styles.fileName}>{item.fileName}</Text>
              {item.fileSize && (
                <Text style={styles.fileSize}>
                  {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={() => Alert.alert('Download', `Downloading ${item.fileName}...`)}
            >
              <Feather name="download" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={[
            styles.messageTime,
            item.isOwn ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      ) : item.type === 'meeting' ? (
        // Meeting message bubble
        <View style={[
          styles.messageBubble,
          item.isOwn ? styles.ownBubble : styles.otherBubble,
          styles.meetingBubble
        ]}>
          <View style={styles.meetingContainer}>
            <View style={styles.meetingHeader}>
              <Feather name="video" size={20} color={Colors.primary} />
              <Text style={styles.meetingTitle}>{item.meetingTitle}</Text>
            </View>
            <Text style={styles.meetingDate}>
              {item.meetingDate?.toLocaleDateString()} at {item.meetingDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <TouchableOpacity 
              style={styles.joinMeetingButton}
              onPress={() => {
                Alert.alert(
                  'Join Meeting',
                  `Would you like to join "${item.meetingTitle}"?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Join', onPress: () => Alert.alert('Opening meeting...', item.meetingLink) }
                  ]
                );
              }}
            >
              <Text style={styles.joinMeetingText}>Join Meeting</Text>
            </TouchableOpacity>
          </View>
          <Text style={[
            styles.messageTime,
            item.isOwn ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      ) : (
        // Regular text/assignment message bubble
        <View style={[
          styles.messageBubble,
          item.isOwn ? styles.ownBubble : styles.otherBubble,
          item.type === 'assignment' && styles.assignmentBubble
        ]}>
          {item.type === 'assignment' && (
            <Feather name="clipboard" size={16} color={Colors.primary} style={styles.assignmentIcon} />
          )}
          <Text style={[
            styles.messageText,
            item.isOwn ? styles.ownMessageText : styles.otherMessageText,
            item.type === 'assignment' && styles.assignmentText
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime,
            item.isOwn ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      )}
    </View>
  );

  const renderAssignment = ({ item }: { item: Assignment }) => (
    <View style={styles.assignmentCard}>
      <View style={styles.assignmentHeader}>
        <Text style={styles.assignmentTitle}>{item.title}</Text>
        <Text style={styles.assignmentPoints}>{item.points} pts</Text>
      </View>
      <Text style={styles.assignmentDescription}>{item.description}</Text>
      <View style={styles.assignmentFooter}>
        <Text style={styles.assignmentDue}>Due: {formatDate(item.dueDate)}</Text>
        <Text style={styles.assignmentSubmissions}>
          {item.submissionCount}/{item.totalStudents} submitted
        </Text>
      </View>
      <TouchableOpacity 
        style={[styles.assignmentButton, item.submitted && styles.submittedButton]}
        onPress={() => Alert.alert('Assignment', item.submitted ? 'Already submitted' : 'Submit assignment')}
      >
        <Text style={[styles.assignmentButtonText, item.submitted && styles.submittedButtonText]}>
          {item.submitted ? 'Submitted ✓' : 'Submit'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderMember = ({ item }: { item: typeof mockGroupDetails.members[0] }) => (
    <View style={styles.memberItem}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberAvatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRole}>
          {item.role} {(item as any).joinedAt && ` • Joined ${new Date((item as any).joinedAt).toLocaleDateString()}`}
        </Text>
      </View>
      {item.role === 'teacher' && (
        <Feather name="star" size={16} color={Colors.primary} />
      )}
    </View>
  );

  if (!groupDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.groupName}>Loading...</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.textSecondary }}>Loading group details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if group not found
  if (!currentGroup) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.groupName}>Group Not Found</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Feather name="alert-circle" size={48} color={Colors.error} style={{ marginBottom: 16 }} />
          <Text style={{ color: Colors.error, fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
            Group not found
          </Text>
          <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
            The group you're looking for doesn't exist or may have been deleted. Please try refreshing the groups list.
          </Text>
          <TouchableOpacity 
            style={{ 
              backgroundColor: Colors.primary, 
              paddingHorizontal: 24, 
              paddingVertical: 12, 
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center'
            }}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.groupInfo}
          onPress={() => setShowMembersModal(true)}
        >
          <View style={styles.groupAvatar}>
            <Text style={styles.groupAvatarText}>{groupDetails.name.charAt(0)}</Text>
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.groupName}>{groupDetails.name}</Text>
            <Text style={styles.memberCount}>{groupDetails.memberCount} members</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={() => setShowClassroomPanel(!showClassroomPanel)}
            style={styles.headerButton}
          >
            <MaterialIcons name="school" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Feather name="more-vertical" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Classroom Panel */}
      {showClassroomPanel && (
        <View style={styles.classroomPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={styles.classroomButton}
              onPress={handleUploadMaterial}
            >
              <Feather name="upload" size={20} color={Colors.primary} />
              <Text style={styles.classroomButtonText}>Upload Material</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.classroomButton}
              onPress={() => setShowMeetingModal(true)}
            >
              <Feather name="video" size={20} color={Colors.primary} />
              <Text style={styles.classroomButtonText}>Schedule Meeting</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.attachButton}>
            <Feather name="paperclip" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          
          <TouchableOpacity style={styles.emojiButton}>
            <Feather name="smile" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.sendButton, newMessage.trim() && styles.sendButtonActive]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Feather name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Members Modal */}
      <Modal
        visible={showMembersModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Group Members</Text>
            <TouchableOpacity onPress={() => setShowMembersModal(false)}>
              <Feather name="x" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={groupDetails.members}
            renderItem={renderMember}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.membersList}
          />
          
          <TouchableOpacity style={styles.inviteButton}>
            <Feather name="user-plus" size={20} color="#fff" />
            <Text style={styles.inviteButtonText}>Invite Members</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* Assignment Modal */}
      <Modal
        visible={showAssignmentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Assignment</Text>
            <TouchableOpacity onPress={() => setShowAssignmentModal(false)}>
              <Feather name="x" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.assignmentForm}>
            <Text style={styles.formLabel}>Title *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Assignment title"
              value={newAssignment.title}
              onChangeText={(text) => setNewAssignment(prev => ({ ...prev, title: text }))}
            />
            
            <Text style={styles.formLabel}>Description *</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              placeholder="Assignment description"
              value={newAssignment.description}
              onChangeText={(text) => setNewAssignment(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={4}
            />
            
            <Text style={styles.formLabel}>Due Date *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="YYYY-MM-DD"
              value={newAssignment.dueDate}
              onChangeText={(text) => setNewAssignment(prev => ({ ...prev, dueDate: text }))}
            />
            
            <Text style={styles.formLabel}>Points *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="100"
              value={newAssignment.points}
              onChangeText={(text) => setNewAssignment(prev => ({ ...prev, points: text }))}
              keyboardType="numeric"
            />
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowAssignmentModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={createAssignment}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Meeting Modal */}
      <Modal
        visible={showMeetingModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Meeting</Text>
            <TouchableOpacity onPress={() => setShowMeetingModal(false)}>
              <Feather name="x" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.assignmentForm}>
            <Text style={styles.formLabel}>Meeting Title *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter meeting title"
              value={newMeeting.title}
              onChangeText={(text) => setNewMeeting(prev => ({ ...prev, title: text }))}
            />
            
            <Text style={styles.formLabel}>Date *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="YYYY-MM-DD"
              value={newMeeting.date}
              onChangeText={(text) => setNewMeeting(prev => ({ ...prev, date: text }))}
            />
            
            <Text style={styles.formLabel}>Time *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="HH:MM (24-hour format)"
              value={newMeeting.time}
              onChangeText={(text) => setNewMeeting(prev => ({ ...prev, time: text }))}
            />
            
            <Text style={styles.formLabel}>Meeting Link *</Text>
            <TextInput
              style={[styles.formInput, styles.textArea]}
              placeholder="https://zoom.us/j/... or https://meet.google.com/..."
              value={newMeeting.link}
              onChangeText={(text) => setNewMeeting(prev => ({ ...prev, link: text }))}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.meetingTipContainer}>
              <Feather name="info" size={16} color={Colors.primary} />
              <Text style={styles.meetingTip}>
                Tip: You can use Zoom, Google Meet, Teams, or any other meeting platform link
              </Text>
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowMeetingModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={createMeeting}
            >
              <Text style={styles.createButtonText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  groupName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberCount: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
  },
  classroomPanel: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    maxHeight: height * 0.4,
  },
  classroomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    marginVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  classroomButtonText: {
    marginLeft: 8,
    color: Colors.primary,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  assignmentsList: {
    maxHeight: 200,
  },
  assignmentCard: {
    backgroundColor: '#fff',
    margin: 8,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  assignmentPoints: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  assignmentDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  assignmentDue: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  assignmentSubmissions: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  assignmentButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  submittedButton: {
    backgroundColor: Colors.success,
  },
  assignmentButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  submittedButtonText: {
    color: '#fff',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 2,
    marginHorizontal: 16,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    marginLeft: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    position: 'relative',
  },
  ownBubble: {
    backgroundColor: Colors.primary,
  },
  otherBubble: {
    backgroundColor: '#f1f1f1',
  },
  assignmentBubble: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  assignmentIcon: {
    position: 'absolute',
    top: 8,
    left: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: Colors.text,
  },
  assignmentText: {
    color: Colors.primary,
    fontWeight: '500',
    paddingLeft: 24,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: Colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f1f1f1',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  attachButton: {
    marginRight: 8,
    marginBottom: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
    paddingVertical: 4,
  },
  emojiButton: {
    marginLeft: 8,
    marginBottom: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  membersList: {
    padding: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  memberRole: {
    fontSize: 14,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  assignmentForm: {
    flex: 1,
    padding: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  formInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // File message styles
  fileBubble: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  fileSize: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  downloadButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  // Meeting message styles
  meetingBubble: {
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: Colors.success,
  },
  meetingContainer: {
    paddingVertical: 4,
  },
  meetingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  meetingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
    flex: 1,
  },
  meetingDate: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  joinMeetingButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  joinMeetingText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  meetingTipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  meetingTip: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});
