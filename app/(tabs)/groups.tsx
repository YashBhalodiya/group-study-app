import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
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
import { useTheme } from '../contexts/ThemeContext';
import { AuthService } from '../services/authService';
import { FirestoreGroupData, FirestoreGroupsService } from '../services/firestoreGroupsService';

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isCreator: boolean;
  subject: string;
  code: string;
  isJoined?: boolean;
  joinedAt?: Date;
  createdAt?: Date;
  lastActivity?: Date;
  userRole?: 'admin' | 'member';
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
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    subject: '',
  });
  const [unsubscribeGroups, setUnsubscribeGroups] = useState<(() => void) | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      Alert.alert('Authentication Error', 'Please sign in to view groups');
      return;
    }

    // Only set up subscription if we don't already have one
    if (!unsubscribeGroups) {
      loadGroups();
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeGroups) {
        unsubscribeGroups();
        setUnsubscribeGroups(null);
      }
    };
  }, []); // Empty dependency array - only run once

  const loadGroups = useCallback(async () => {
    // If we already have a subscription, clean it up first
    if (unsubscribeGroups) {
      unsubscribeGroups();
      setUnsubscribeGroups(null);
    }

    setLoading(true);
    try {
      // Set up real-time subscription to user's groups
      const unsubscribe = FirestoreGroupsService.subscribeToUserGroups(
        (firestoreGroups: FirestoreGroupData[]) => {
          console.log('Received groups update:', firestoreGroups.length, 'groups');
          // Convert Firestore data to local Group interface
          const convertedGroups: Group[] = firestoreGroups.map(group => {
            const currentUserId = AuthService.getCurrentUser()?.uid;
            
            return {
              id: group.id!,
              name: group.name,
              description: group.description,
              memberCount: group.memberCount,
              isCreator: group.createdBy === currentUserId,
              subject: group.subject,
              code: group.code,
              isJoined: group.members.includes(currentUserId || ''),
              joinedAt: group.createdAt ? FirestoreGroupsService.timestampToDate(group.createdAt) : new Date(),
              createdAt: group.createdAt ? FirestoreGroupsService.timestampToDate(group.createdAt) : new Date(),
              lastActivity: group.lastActivity ? FirestoreGroupsService.timestampToDate(group.lastActivity) : new Date(),
              userRole: group.admins.includes(currentUserId || '') ? 'admin' : 'member'
            };
          });

          console.log('Setting groups in state:', convertedGroups.length, 'groups');
          setGroups(convertedGroups);
          setLoading(false);
        },
        (error) => {
          console.error('Error loading groups:', error);
          setLoading(false);
          showToast('Failed to load groups. Please try again.');
        }
      );

      setUnsubscribeGroups(() => unsubscribe);
    } catch (error: any) {
      console.error('Error setting up groups subscription:', error);
      
      // Fallback: try to load groups once without subscription
      try {
        const fallbackGroups = await FirestoreGroupsService.getUserGroups();
        const convertedGroups: Group[] = fallbackGroups.map(group => {
          const currentUserId = AuthService.getCurrentUser()?.uid;
          
          return {
            id: group.id!,
            name: group.name,
            description: group.description,
            memberCount: group.memberCount,
            isCreator: group.createdBy === currentUserId,
            subject: group.subject,
            code: group.code,
            isJoined: group.members.includes(currentUserId || ''),
            joinedAt: group.createdAt ? FirestoreGroupsService.timestampToDate(group.createdAt) : new Date(),
            createdAt: group.createdAt ? FirestoreGroupsService.timestampToDate(group.createdAt) : new Date(),
            lastActivity: group.lastActivity ? FirestoreGroupsService.timestampToDate(group.lastActivity) : new Date(),
            userRole: group.admins.includes(currentUserId || '') ? 'admin' : 'member'
          };
        });
        
        console.log('Fallback: Setting groups from direct fetch:', convertedGroups.length, 'groups');
        setGroups(convertedGroups);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        showToast('Failed to load groups. Please try again.');
      }
      
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // For refresh, just reload the groups subscription
      await loadGroups();
    } catch (error) {
      console.error('Error refreshing groups:', error);
      showToast('Failed to refresh groups.');
    } finally {
      setRefreshing(false);
    }
  }, [loadGroups]);

  const showToast = (message: string) => {
    Alert.alert('StudyHub', message);
  };

  const handleCreateGroup = () => {
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setNewGroup({ name: '', description: '', subject: '' });
  };

  const handleModalSubmit = async () => {
    if (!newGroup.name.trim() || !newGroup.subject.trim()) {
      showToast('Please fill all required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create group in Firestore
      const { groupId, groupCode } = await FirestoreGroupsService.createGroup(
        newGroup.name,
        newGroup.description,
        newGroup.subject,
        false, // isPrivate
        50 // maxMembers
      );
      
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
    } catch (error: any) {
      console.error('Error creating group:', error);
      showToast(error.message || 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
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

  const joinGroupByCode = async (code: string) => {
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

    try {
      setLoading(true);
      
      // Attempt to join group using Firestore service
      const { groupId, groupName } = await FirestoreGroupsService.joinGroupByCode(code);
      
      Alert.alert(
        'Successfully Joined!',
        `Welcome to "${groupName}"!\n\nYou are now a member of this study group.`,
        [
          {
            text: 'View Group',
            onPress: () => {
              // Find the group in current list or navigate directly
              const group = groups.find(g => g.id === groupId);
              if (group) {
                handleGroupPress(group);
              }
            }
          },
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
    } catch (error: any) {
      console.error('Error joining group:', error);
      
      if (error.message.includes('not found')) {
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
      } else if (error.message.includes('already a member')) {
        Alert.alert(
          'Already a Member',
          `You are already a member of this group. You cannot join the same group twice.`,
          [
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      } else if (error.message.includes('maximum capacity')) {
        Alert.alert(
          'Group Full',
          'This group has reached its maximum capacity. Please try joining a different group.',
          [{ text: 'OK' }]
        );
      } else {
        showToast(error.message || 'Failed to join group. Please try again.');
      }
    } finally {
      setLoading(false);
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

  const getLastActivityText = (group: Group) => {
    if (!group.lastActivity) return 'No recent activity';
    
    const now = new Date();
    const lastActivity = group.lastActivity;
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) {
      return `Last activity ${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `Last activity ${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `Last activity ${diffMinutes}m ago`;
    } else {
      return 'Active now';
    }
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
                <Text style={styles.creatorText}>Admin</Text>
              </View>
            )}
          </View>
          <Text style={[styles.groupActivity, { color: colors.textSecondary }]}>
            {item.memberCount} members • {getLastActivityText(item)}
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
                  <Text style={[styles.examplesTitle, { color: colors.text }]}>How to get a group code:</Text>
                  <Text style={[styles.exampleDescription, { color: colors.textSecondary }]}>
                    Ask a group admin or creator to share their 6-character group code with you
                  </Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 160,
  },
  groupCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  groupIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 26,
  },
  groupDetails: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  groupName: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.3,
    flex: 1,
  },
  groupActivity: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.6,
  },
  creatorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  creatorText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.6,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    marginRight: 10,
  },
  copyCodeButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  copyCodeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
    opacity: 0.9,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    opacity: 0.6,
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
  createButtonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    gap: 10,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  createButtonIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  joinButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 18,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    fontSize: 24,
    fontWeight: '400',
    padding: 4,
    opacity: 0.6,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 4,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 10,
  },
  modalCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  modalCancelText: {
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  modalCreateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  modalCreateText: {
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  joinModalBody: {
    flex: 1,
    paddingVertical: 20,
  },
  joinModalDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.7,
  },
  joinCodeInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 4,
    textTransform: 'uppercase',
    borderWidth: 2,
    paddingVertical: 18,
    marginBottom: 10,
    borderRadius: 12,
  },
  joinModalExamples: {
    marginTop: 28,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  exampleDescription: {
    fontSize: 13,
    marginBottom: 0,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.7,
  },
});
