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
import { Colors, Layout } from '../constants';

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
    <TouchableOpacity style={styles.groupCard} onPress={() => handleGroupPress(item)}>
      <View style={styles.groupRow}>
        <View style={styles.groupIcon}>
          <Text style={styles.iconText}>{getSubjectIcon(item.subject)}</Text>
        </View>
        <View style={styles.groupDetails}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupName}>{item.name}</Text>
            {item.isCreator && (
              <View style={styles.creatorBadge}>
                <Text style={styles.creatorText}>Creator</Text>
              </View>
            )}
          </View>
          <Text style={styles.groupActivity}>
            {item.memberCount} members • {getLastActivityText(item.memberCount)}
          </Text>
          {item.isCreator && (
            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>Code: </Text>
              <Text style={styles.codeText}>{item.code}</Text>
              <TouchableOpacity 
                style={styles.copyCodeButton}
                onPress={() => showToast(`Group code ${item.code} copied!`)}
              >
                <Text style={styles.copyCodeText}>Copy</Text>
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
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
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              <Text style={styles.inputLabel}>Group Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter group name"
                placeholderTextColor={Colors.textSecondary}
                value={newGroup.name}
                onChangeText={text => setNewGroup({ ...newGroup, name: text })}
              />
              <Text style={styles.inputLabel}>Subject *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter subject"
                placeholderTextColor={Colors.textSecondary}
                value={newGroup.subject}
                onChangeText={text => setNewGroup({ ...newGroup, subject: text })}
              />
              <Text style={styles.inputLabel}>Group Code (Auto-generated)</Text>
              <View style={styles.codeContainer}>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="Code will be generated automatically"
                  placeholderTextColor={Colors.textSecondary}
                  value={newGroup.code}
                  editable={false}
                  selectTextOnFocus={true}
                />
                <TouchableOpacity 
                  style={styles.regenerateButton}
                  onPress={() => {
                    const newCode = generateUniqueGroupCode();
                    setNewGroup({ ...newGroup, code: newCode });
                  }}
                >
                  <Text style={styles.regenerateButtonText}>↻</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                placeholder="Enter description (optional)"
                placeholderTextColor={Colors.textSecondary}
                value={newGroup.description}
                onChangeText={text => setNewGroup({ ...newGroup, description: text })}
                multiline
              />
            </ScrollView>
            <View style={styles.modalButtonRow}>
              <Pressable style={styles.modalCancelButton} onPress={handleModalClose}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalCreateButton} onPress={handleModalSubmit}>
                <Text style={styles.modalCreateText}>Create</Text>
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
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={{ flex: 1, padding: 24 }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Join Group</Text>
                <TouchableOpacity onPress={handleJoinModalClose}>
                  <Text style={styles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.joinModalBody}>
                <Text style={styles.joinModalDescription}>
                  Enter the group code to join a study group
                </Text>
                
                <Text style={styles.inputLabel}>Group Code</Text>
                <TextInput
                  style={[styles.input, styles.joinCodeInput]}
                  placeholder="Enter code"
                  placeholderTextColor={Colors.textSecondary}
                  value={joinCode}
                  onChangeText={setJoinCode}
                  autoCapitalize="characters"
                  maxLength={6}
                  autoFocus={true}
                />
                
                <View style={styles.joinModalExamples}>
                  <Text style={styles.examplesTitle}>Try these example codes:</Text>
                  <View style={styles.exampleCodesContainer}>
                    <TouchableOpacity 
                      style={styles.exampleCode}
                      onPress={() => setJoinCode('CHEM01')}
                    >
                      <Text style={styles.exampleCodeText}>CHEM01</Text>
                      <Text style={styles.exampleCodeSubject}>Chemistry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.exampleCode}
                      onPress={() => setJoinCode('ML2024')}
                    >
                      <Text style={styles.exampleCodeText}>ML2024</Text>
                      <Text style={styles.exampleCodeSubject}>ML</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.exampleCode}
                      onPress={() => setJoinCode('ESP101')}
                    >
                      <Text style={styles.exampleCodeText}>ESP101</Text>
                      <Text style={styles.exampleCodeSubject}>Spanish</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.modalButtonRow}>
                <Pressable style={styles.modalCancelButton} onPress={handleJoinModalClose}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
                <Pressable 
                  style={[styles.modalCreateButton, !joinCode.trim() && styles.modalButtonDisabled]} 
                  onPress={handleJoinSubmit}
                  disabled={!joinCode.trim()}
                >
                  <Text style={[styles.modalCreateText, !joinCode.trim() && styles.modalButtonTextDisabled]}>
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
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          />
          <View style={styles.createButtonContainer}>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
              <Text style={styles.createButtonIcon}>+</Text>
              <Text style={styles.createButtonText}>Create New Group</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.joinButton} onPress={handleJoinGroup}>
              <Text style={styles.joinButtonText}>Join Group</Text>
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
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
    backgroundColor: Colors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
  },
  listContainer: {
    paddingTop: Layout.spacing.sm,
    paddingBottom: 110, // Space for floating button + tab bar
  },
  groupCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Layout.spacing.lg,
    marginBottom: 1,
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.primary + '22',
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
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  groupActivity: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  creatorBadge: {
    backgroundColor: Colors.primary,
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
    borderTopColor: Colors.border,
  },
  codeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 8,
  },
  copyCodeButton: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  copyCodeText: {
    fontSize: 10,
    color: Colors.primary,
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
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Layout.spacing.sm,
  },
  emptySubtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
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
    bottom: 120, // Increased space above the tab bar
    left: Layout.spacing.lg,
    right: Layout.spacing.lg,
    flexDirection: 'row',
    gap: Layout.spacing.sm, // Reduced gap for better alignment
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: 12,
    // Remove shadow for consistency
  },
  createButtonIcon: {
    color: Colors.surface,
    fontSize: 18, // Slightly smaller icon
    fontWeight: '600',
    marginRight: Layout.spacing.xs,
  },
  createButtonText: {
    color: Colors.surface,
    fontSize: 14, // Reduced font size for better fit
    fontWeight: '600',
  },
  joinButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: 12,
  },
  joinButtonText: {
    color: Colors.primary,
    fontSize: 14, // Match the create button text size
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: Colors.surface,
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
    color: Colors.text,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalCloseButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    padding: 4,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
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
    backgroundColor: '#f8f9fa',
    color: Colors.text,
  },
  regenerateButton: {
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 4,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  modalCreateButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  modalCreateText: {
    color: Colors.surface,
    fontWeight: '600',
    fontSize: 15,
  },
  joinModalBody: {
    flex: 1,
    paddingVertical: 20,
  },
  joinModalDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    borderColor: Colors.primary,
    backgroundColor: '#fff',
    paddingVertical: 16,
    marginBottom: 8,
  },
  joinModalExamples: {
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
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
    backgroundColor: Colors.primary + '10',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    alignItems: 'center',
    minWidth: 70,
    paddingHorizontal: 12,
  },
  exampleCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 1,
  },
  exampleCodeSubject: {
    fontSize: 9,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalButtonDisabled: {
    backgroundColor: Colors.border,
  },
  modalButtonTextDisabled: {
    color: Colors.textSecondary,
  },
});
