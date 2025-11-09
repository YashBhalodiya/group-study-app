import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui/Button';
import { Layout } from '../constants';
import { useTheme } from '../contexts/ThemeContext';

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isCreator: boolean;
  subject: string;
  code: string;
  isJoined?: boolean; // Track if current user is a member
  joinedAt?: Date; // When the user joined
}

interface UserMembership {
  groupId: string;
  groupCode: string;
  joinedAt: Date;
  role: 'creator' | 'member';
}

export default function GroupsDashboard() {
  const router = useRouter();
  const { isDarkMode, colors } = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [userMemberships, setUserMemberships] = useState<UserMembership[]>([]);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    subject: '',
    code: '',
  });

  // Mock data - replace with actual API calls
  const mockGroups: Group[] = [
    {
      id: '1',
      name: 'Study Group for Calculus',
      description: 'Advanced calculus concepts and problem solving',
      memberCount: 5,
      isCreator: false,
      subject: 'Mathematics',
      code: 'CALC2024',
      isJoined: true,
      joinedAt: new Date(Date.now() - 86400000 * 7), // Joined 7 days ago
    },
    {
      id: '2',
      name: 'Literature Discussion',
      description: 'Modern literature analysis and discussion',
      memberCount: 8,
      isCreator: true,
      subject: 'English Literature',
      code: 'LIT2024',
      isJoined: true,
      joinedAt: new Date(Date.now() - 86400000 * 14), // Created 14 days ago
    },
    {
      id: '3',
      name: 'Physics Study Buddies',
      description: 'Quantum physics and thermodynamics study group',
      memberCount: 3,
      isCreator: false,
      subject: 'Physics',
      code: 'PHY2024',
      isJoined: true,
      joinedAt: new Date(Date.now() - 86400000 * 3), // Joined 3 days ago
    },
  ];

  // Mock initial memberships
  const mockMemberships: UserMembership[] = [
    {
      groupId: '1',
      groupCode: 'CALC2024',
      joinedAt: new Date(Date.now() - 86400000 * 7),
      role: 'member',
    },
    {
      groupId: '2',
      groupCode: 'LIT2024',
      joinedAt: new Date(Date.now() - 86400000 * 14),
      role: 'creator',
    },
    {
      groupId: '3',
      groupCode: 'PHY2024',
      joinedAt: new Date(Date.now() - 86400000 * 3),
      role: 'member',
    },
  ];

  // Storage keys
  const GROUPS_STORAGE_KEY = 'user_groups';
  const MEMBERSHIPS_STORAGE_KEY = 'user_memberships';

  // Storage functions
  const saveGroupsToStorage = async (groupsData: Group[]) => {
    try {
      await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groupsData));
    } catch (error) {
      console.error('Error saving groups to storage:', error);
    }
  };

  const saveMembershipsToStorage = async (membershipsData: UserMembership[]) => {
    try {
      await AsyncStorage.setItem(MEMBERSHIPS_STORAGE_KEY, JSON.stringify(membershipsData));
    } catch (error) {
      console.error('Error saving memberships to storage:', error);
    }
  };

  const loadGroupsFromStorage = async (): Promise<Group[]> => {
    try {
      const storedGroups = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
      if (storedGroups) {
        return JSON.parse(storedGroups);
      }
      return [];
    } catch (error) {
      console.error('Error loading groups from storage:', error);
      return [];
    }
  };

  const loadMembershipsFromStorage = async (): Promise<UserMembership[]> => {
    try {
      const storedMemberships = await AsyncStorage.getItem(MEMBERSHIPS_STORAGE_KEY);
      if (storedMemberships) {
        return JSON.parse(storedMemberships);
      }
      return [];
    } catch (error) {
      console.error('Error loading memberships from storage:', error);
      return [];
    }
  };

  // Function to add user to group members list
  const addUserToGroupMembers = async (groupId: string, newMember: any) => {
    try {
      const storedGroups = await AsyncStorage.getItem(GROUPS_STORAGE_KEY);
      if (storedGroups) {
        const groups = JSON.parse(storedGroups);
        const updatedGroups = groups.map((group: any) => {
          if (group.id === groupId) {
            // Initialize members array if it doesn't exist
            if (!group.members) {
              group.members = [
                {
                  id: 'creator_' + group.code,
                  name: 'Group Creator',
                  role: 'teacher',
                  joinedAt: new Date(),
                }
              ];
            }
            
            // Check if user is already a member
            const existingMember = group.members.find((member: any) => 
              member.name === newMember.name || member.id === newMember.id
            );
            
            if (!existingMember) {
              return {
                ...group,
                members: [...group.members, newMember],
                memberCount: group.members.length + 1,
              };
            }
          }
          return group;
        });
        
        await AsyncStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(updatedGroups));
      }
    } catch (error) {
      console.error('Error adding user to group members:', error);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      // Load saved groups and memberships from AsyncStorage
      const savedGroups = await loadGroupsFromStorage();
      const savedMemberships = await loadMembershipsFromStorage();
      
      // If no saved data, initialize with mock data for first-time users
      if (savedGroups.length === 0) {
        setGroups(mockGroups);
        setUserMemberships(mockMemberships);
        // Save mock data as initial data
        await saveGroupsToStorage(mockGroups);
        await saveMembershipsToStorage(mockMemberships);
      } else {
        // Use saved data
        setGroups(savedGroups);
        setUserMemberships(savedMemberships);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading groups:', error);
      setLoading(false);
      showToast('Failed to load groups. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const showToast = (message: string) => {
    Alert.alert('StudyHub', message);
  };

  // Generate unique group code
  const generateUniqueGroupCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // Generate a 6-character code
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-3);
    result = result.slice(0, 3) + timestamp;
    
    // Check if code already exists in current groups
    const existingCodes = groups.map(group => group.code);
    if (existingCodes.includes(result)) {
      // If code exists, generate a new one recursively
      return generateUniqueGroupCode();
    }
    
    return result;
  };

  const handleCreateGroup = () => {
    // Auto-generate a unique code when creating a group
    const uniqueCode = generateUniqueGroupCode();
    setNewGroup(prev => ({ ...prev, code: uniqueCode }));
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setNewGroup({ name: '', description: '', subject: '', code: '' });
  };

  const handleModalSubmit = async () => {
    if (!newGroup.name || !newGroup.subject) {
      showToast('Please fill all required fields');
      return;
    }
    
    // Use the auto-generated code or generate a new one if somehow missing
    const groupCode = newGroup.code || generateUniqueGroupCode();
    
    // Add the new group to the list
    const newGroupData: Group = {
      id: Date.now().toString(), // Use timestamp for unique ID
      name: newGroup.name,
      description: newGroup.description,
      memberCount: 1,
      isCreator: true,
      subject: newGroup.subject,
      code: groupCode,
      isJoined: true,
      joinedAt: new Date(),
    };

    // Initialize group with creator as first member
    const initialMembers = [
      {
        id: 'creator_' + groupCode,
        name: 'You (Creator)',
        role: 'teacher' as const,
        joinedAt: new Date(),
      }
    ];

    // Add members to the group data
    const newGroupWithMembers = {
      ...newGroupData,
      members: initialMembers,
    };
    
    // Add membership record for the creator
    const newMembership: UserMembership = {
      groupId: newGroupData.id,
      groupCode: groupCode,
      joinedAt: new Date(),
      role: 'creator',
    };
    
    // Update state
    const updatedGroups = [newGroupWithMembers, ...groups];
    const updatedMemberships = [newMembership, ...userMemberships];
    
    setGroups(updatedGroups);
    setUserMemberships(updatedMemberships);
    
    // Save to AsyncStorage
    await saveGroupsToStorage(updatedGroups);
    await saveMembershipsToStorage(updatedMemberships);
    
    handleModalClose();
    
    // Show success message with the group code
    Alert.alert(
      'Group Created Successfully!',
      `Your group "${newGroup.name}" has been created.\n\nGroup Code: ${groupCode}\n\nShare this code with others so they can join your group.`,
      [
        {
          text: 'Copy Code',
          onPress: () => {
            // In a real app, you would copy to clipboard
            showToast(`Group code ${groupCode} copied!`);
          }
        },
        {
          text: 'OK',
          style: 'default'
        }
      ]
    );
  };

  const handleJoinGroup = () => {
    setJoinCode('');
    setJoinModalVisible(true);
  };

  const handleJoinSubmit = () => {
    if (!joinCode.trim()) {
      showToast('Please enter a group code');
      return;
    }
    
    const code = joinCode.trim().toUpperCase();
    setJoinModalVisible(false);
    
    // Small delay to let the modal close before showing alerts
    setTimeout(() => {
      joinGroupByCode(code);
    }, 100);
  };

  const handleJoinModalClose = () => {
    setJoinModalVisible(false);
    setJoinCode('');
  };

  const joinGroupByCode = (code: string) => {
    // Validate code format (should be 6 characters)
    if (!code || code.length !== 6) {
      Alert.alert(
        'Invalid Code',
        'Group codes must be exactly 6 characters long. Please check the code and try again.',
        [
          {
            text: 'Try Again',
            onPress: () => handleJoinGroup()
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return;
    }

    // Check if user is already a member of this group
    const existingMembership = userMemberships.find(membership => membership.groupCode === code);
    if (existingMembership) {
      const existingGroup = groups.find(group => group.code === code);
      Alert.alert(
        'Already a Member',
        `You are already a member of "${existingGroup?.name || 'this group'}". You cannot join the same group twice.`,
        [
          {
            text: 'View Group',
            onPress: () => {
              if (existingGroup) {
                handleGroupPress(existingGroup);
              }
            }
          },
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
      return;
    }

    // Find group by code in all available groups (including those not yet joined)
    // In a real app, this would be an API call to search all public groups
    const allAvailableGroups = [
      ...groups,
      // Add some example groups that user hasn't joined yet
      {
        id: 'temp_1',
        name: 'Advanced Chemistry',
        description: 'Organic chemistry study group',
        memberCount: 12,
        isCreator: false,
        subject: 'Chemistry',
        code: 'CHEM01',
        isJoined: false,
      },
      {
        id: 'temp_2',
        name: 'Machine Learning Basics',
        description: 'Introduction to ML concepts',
        memberCount: 20,
        isCreator: false,
        subject: 'Computer Science',
        code: 'ML2024',
        isJoined: false,
      },
      {
        id: 'temp_3',
        name: 'Spanish Conversation',
        description: 'Practice Spanish speaking skills',
        memberCount: 8,
        isCreator: false,
        subject: 'Languages',
        code: 'ESP101',
        isJoined: false,
      },
    ];

    const groupToJoin = allAvailableGroups.find(group => group.code === code);
    
    if (groupToJoin) {
      // Check if the group is available for joining
      if (groupToJoin.memberCount >= 50) { // Max capacity check
        Alert.alert(
          'Group Full',
          'This group has reached its maximum capacity of 50 members. Please try joining a different group.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Confirm join action
      Alert.alert(
        'Join Group',
        `Do you want to join "${groupToJoin.name}"?\n\nSubject: ${groupToJoin.subject}\nCurrent Members: ${groupToJoin.memberCount}\nDescription: ${groupToJoin.description || 'No description available'}`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Join Group',
            onPress: async () => {
              // Add user to the group
              const updatedGroup: Group = {
                ...groupToJoin,
                memberCount: groupToJoin.memberCount + 1,
                isCreator: false,
                isJoined: true,
                joinedAt: new Date(),
                id: groupToJoin.id.startsWith('temp_') ? (groups.length + 1).toString() : groupToJoin.id,
              };

              // Create membership record
              const newMembership: UserMembership = {
                groupId: updatedGroup.id,
                groupCode: code,
                joinedAt: new Date(),
                role: 'member',
              };

              // Update groups list
              let updatedGroups: Group[];
              if (groupToJoin.id.startsWith('temp_')) {
                // This was a new group, add it to the list
                updatedGroups = [updatedGroup, ...groups];
                setGroups(updatedGroups);
              } else {
                // Update existing group
                updatedGroups = groups.map(group => 
                  group.code === code ? updatedGroup : group
                );
                setGroups(updatedGroups);
              }

              // Add membership
              const updatedMemberships = [newMembership, ...userMemberships];
              setUserMemberships(updatedMemberships);
              
              // Add current user to the group's members list
              await addUserToGroupMembers(updatedGroup.id, {
                id: 'current_user_' + Date.now(),
                name: 'You',
                role: 'student' as const,
                joinedAt: new Date(),
              });
              
              // Save to AsyncStorage
              saveGroupsToStorage(updatedGroups);
              saveMembershipsToStorage(updatedMemberships);
              
              Alert.alert(
                'Successfully Joined!',
                `Welcome to "${updatedGroup.name}"!\n\nYou are now member #${updatedGroup.memberCount} of this study group.`,
                [
                  {
                    text: 'View Group',
                    onPress: () => handleGroupPress(updatedGroup)
                  },
                  {
                    text: 'OK',
                    style: 'default'
                  }
                ]
              );
            }
          }
        ]
      );
    } else {
      Alert.alert(
        'Group Not Found',
        `No group found with the code "${code}". Please check the code and try again.\n\nMake sure you have entered the correct 6-character code provided by the group creator.`,
        [
          {
            text: 'Try Again',
            onPress: () => handleJoinGroup()
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    }
  };

  const handleGroupPress = (group: Group) => {
    // Navigate to group chat screen with group data
    router.push({
      pathname: `/group/[id]`,
      params: { 
        id: group.id,
        groupData: JSON.stringify(group)
      }
    });
  };

  const getLastActivityText = (memberCount: number) => {
    const timeAgo = Math.floor(Math.random() * 10) + 1; // Random time for demo
    return `Last activity ${timeAgo}d ago`;
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics':
        return '📐';
      case 'english literature':
        return '📚';
      case 'physics':
        return '⚛️';
      case 'computer science':
        return '💻';
      default:
        return '📖';
    }
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity 
      style={[
        styles.groupCard, 
        { 
          backgroundColor: colors.surface,
          borderColor: colors.border 
        }
      ]} 
      onPress={() => handleGroupPress(item)}
    >
      <View style={styles.groupRow}>
        <View style={[styles.groupIcon, { backgroundColor: colors.primary + '22' }]}>
          <Text style={styles.iconText}>{getSubjectIcon(item.subject)}</Text>
        </View>
        <View style={styles.groupDetails}>
          <View style={styles.groupHeader}>
            <Text style={[styles.groupName, { color: colors.text }]}>{item.name}</Text>
            {item.isCreator && (
              <View style={[styles.creatorBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.creatorText}>Creator</Text>
              </View>
            )}
          </View>
          <Text style={[styles.groupActivity, { color: colors.textSecondary }]}>
            {item.memberCount} members • {getLastActivityText(item.memberCount)}
          </Text>
          {item.isCreator && (
            <View style={[styles.codeRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Code: </Text>
              <Text style={[styles.codeText, { color: colors.primary }]}>{item.code}</Text>
              <TouchableOpacity 
                style={[styles.copyCodeButton, { 
                  backgroundColor: colors.background,
                  borderColor: colors.primary 
                }]}
                onPress={() => showToast(`Group code ${item.code} copied!`)}
              >
                <Text style={[styles.copyCodeText, { color: colors.primary }]}>Copy</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>No Groups Yet</Text>
      <Text style={styles.emptySubtitle}>
        You haven't joined or created any study groups yet. Start collaborating with fellow students!
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Create Group"
          onPress={handleCreateGroup}
          style={styles.actionButton}
        />
        <Button
          title="Join with Code"
          onPress={handleJoinGroup}
          variant="outline"
          style={styles.actionButton}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.surface} />
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Groups</Text>
      </View>

      {/* Create Group Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleModalClose}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.surface, maxHeight: '85%' }]}>
            <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 12 }]}>Create New Group</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              <Text style={styles.inputLabel}>Group Name *</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                placeholder="Enter group name"
                placeholderTextColor={colors.textSecondary}
                value={newGroup.name}
                onChangeText={text => setNewGroup({ ...newGroup, name: text })}
              />
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Subject *</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                placeholder="Enter subject"
                placeholderTextColor={colors.textSecondary}
                value={newGroup.subject}
                onChangeText={text => setNewGroup({ ...newGroup, subject: text })}
              />
              <Text style={styles.inputLabel}>Group Code (Auto-generated)</Text>
              <View style={styles.codeContainer}>
                <TextInput
                  style={[
                    styles.input, 
                    styles.codeInput, 
                    { 
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text
                    }
                  ]}
                  placeholder="Code will be generated automatically"
                  placeholderTextColor={colors.textSecondary}
                  value={newGroup.code}
                  editable={false}
                  selectTextOnFocus={true}
                />
                <TouchableOpacity 
                  style={[styles.regenerateButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    const newCode = generateUniqueGroupCode();
                    setNewGroup({ ...newGroup, code: newCode });
                  }}
                >
                  <Text style={[styles.regenerateButtonText, { color: colors.surface }]}>↻</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    height: 80,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text
                  }
                ]}
                placeholder="Enter description (optional)"
                placeholderTextColor={colors.textSecondary}
                value={newGroup.description}
                onChangeText={text => setNewGroup({ ...newGroup, description: text })}
                multiline
              />
            </ScrollView>
            <View style={styles.modalButtonRow}>
              <Pressable
                style={[
                  styles.modalCancelButton,
                  { backgroundColor: colors.background, borderColor: colors.border }
                ]}
                onPress={handleModalClose}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalCreateButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={handleModalSubmit}
              >
                <Text style={[styles.modalCreateText, { color: colors.surface }]}>Create</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={joinModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={{ flex: 1, padding: 24 }}>
              <View style={[
            styles.modalHeader, 
            { 
              borderBottomColor: colors.border,
              backgroundColor: colors.surface 
            }
          ]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Join Group</Text>
                <TouchableOpacity onPress={handleJoinModalClose}>
                  <Text style={[styles.modalCloseButton, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.joinModalBody, { backgroundColor: colors.surface }]}>
                <Text style={[styles.joinModalDescription, { color: colors.textSecondary }]}>
                  Enter the group code to join a study group
                </Text>
                
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Group Code</Text>
                <TextInput
                  style={[
                    styles.input, 
                    styles.joinCodeInput,
                    { 
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text 
                    }
                  ]}
                  placeholder="Enter code"
                  placeholderTextColor={colors.textSecondary}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  autoCapitalize="characters"
                  maxLength={6}
                  autoFocus={true}
                />
                
                <View style={[
                  styles.joinModalExamples,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border
                  }
                ]}>
                  <Text style={[styles.examplesTitle, { color: colors.text }]}>Try these example codes:</Text>
                  <View style={styles.exampleCodesContainer}>
                    <TouchableOpacity 
                      style={[
                        styles.exampleCode,
                        {
                          backgroundColor: colors.primary + '10',
                          borderColor: colors.primary + '30'
                        }
                      ]}
                      onPress={() => setJoinCode('CHEM01')}
                    >
                      <Text style={[styles.exampleCodeText, { color: colors.primary }]}>CHEM01</Text>
                      <Text style={[styles.exampleCodeSubject, { color: colors.textSecondary }]}>Chemistry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.exampleCode,
                        {
                          backgroundColor: colors.primary + '10',
                          borderColor: colors.primary + '30'
                        }
                      ]}
                      onPress={() => setJoinCode('ML2024')}
                    >
                      <Text style={[styles.exampleCodeText, { color: colors.primary }]}>ML2024</Text>
                      <Text style={[styles.exampleCodeSubject, { color: colors.textSecondary }]}>ML</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.exampleCode,
                        {
                          backgroundColor: colors.primary + '10',
                          borderColor: colors.primary + '30'
                        }
                      ]}
                      onPress={() => setJoinCode('ESP101')}
                    >
                      <Text style={[styles.exampleCodeText, { color: colors.primary }]}>ESP101</Text>
                      <Text style={[styles.exampleCodeSubject, { color: colors.textSecondary }]}>Spanish</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.modalButtonRow}>
                <Pressable 
                  style={[
                    styles.modalCancelButton, 
                    { 
                      backgroundColor: colors.background,
                      borderColor: colors.border 
                    }
                  ]} 
                  onPress={handleJoinModalClose}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                </Pressable>
                <Pressable 
                  style={[
                    styles.modalCreateButton, 
                    { backgroundColor: colors.primary },
                    !joinCode.trim() && { backgroundColor: colors.border }
                  ]} 
                  onPress={handleJoinSubmit}
                  disabled={!joinCode.trim()}
                >
                  <Text 
                    style={[
                      styles.modalCreateText, 
                      { color: colors.surface },
                      !joinCode.trim() && { color: colors.textSecondary }
                    ]}
                  >
                    Join Group
                  </Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {groups.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.createButtonContainer}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Create new group"
              onPress={handleCreateGroup}
              style={[
                styles.createButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.primary,
                  borderWidth: 1,
                  shadowColor: colors.primary,
                },
              ]}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '12' }]}> 
                <Text style={[styles.createButtonIcon, { color: colors.primary }]}>+</Text>
              </View>
              <Text style={[styles.createButtonText, { color: colors.primary }]}>Create New Group</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Join an existing group"
              onPress={handleJoinGroup}
              style={[
                styles.joinButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text style={[styles.joinButtonText, { color: colors.surface }]}>Join Group</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Layout.fontSize.md,
  },
  listContainer: {
    paddingTop: Layout.spacing.sm,
    paddingBottom: 110,
  },
  groupCard: {
    marginHorizontal: Layout.spacing.lg,
    marginBottom: 1,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.md,
  },
  iconText: {
    fontSize: 24,
  },
  groupDetails: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupActivity: {
    fontSize: 14,
  },
  creatorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  creatorText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
  },
  codeLabel: {
    fontSize: 12,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  copyCodeButton: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  copyCodeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Layout.spacing.lg,
  },
  emptyTitle: {
    fontSize: Layout.fontSize.title,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  emptySubtitle: {
    fontSize: Layout.fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    gap: Layout.spacing.md,
  },
  actionButton: {
    width: '100%',
  },
  createButtonContainer: {
    position: 'absolute',
    bottom: 120,
    left: Layout.spacing.lg,
    right: Layout.spacing.lg,
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: 12,
  },
  createButtonIcon: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 0,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  joinButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: 12,
    borderWidth: 0,
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
    // subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 4,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 2,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  codeInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  regenerateButton: {
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
  },
  regenerateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 4,
  },
  modalCancelText: {
    fontWeight: '600',
    fontSize: 15,
  },
  modalCreateButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalCreateText: {
    fontWeight: '600',
    fontSize: 15,
  },
  joinModalBody: {
    flex: 1,
    paddingVertical: 20,
  },
  joinModalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  joinCodeInput: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    borderWidth: 2,
    paddingVertical: 16,
    marginBottom: 8,
  },
  joinModalExamples: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  exampleCodesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 10,
  },
  exampleCode: {
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 70,
    paddingHorizontal: 12,
  },
  exampleCodeText: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 1,
  },
  exampleCodeSubject: {
    fontSize: 9,
    textAlign: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonTextDisabled: {
    opacity: 0.5,
  },
});
