import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
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
}

export default function GroupsDashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      // Replace this with actual API call
      setTimeout(() => {
        setGroups(mockGroups);
        setLoading(false);
      }, 1000);
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

  const handleCreateGroup = () => {
    // Navigate to create group screen or show modal
    showToast('Create Group feature coming soon!');
  };

  const handleJoinGroup = () => {
    // Show join group modal with code input
    Alert.prompt(
      'Join Group',
      'Enter the group code to join:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Join',
          onPress: (code) => {
            if (code && code.trim()) {
              // Replace with actual join group logic
              showToast(`Attempting to join group with code: ${code}`);
            } else {
              showToast('Please enter a valid group code');
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const handleGroupPress = (group: Group) => {
    // Navigate to group details screen
    showToast(`Opening ${group.name}`);
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
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupActivity}>
            {item.memberCount} members • {getLastActivityText(item.memberCount)}
          </Text>
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
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e8f4f8',
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
    paddingVertical: 14, // Slightly reduced padding
    paddingHorizontal: Layout.spacing.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
    paddingVertical: 14, // Match the create button padding
    paddingHorizontal: Layout.spacing.md,
    borderRadius: 12,
  },
  joinButtonText: {
    color: Colors.primary,
    fontSize: 14, // Match the create button text size
    fontWeight: '600',
  },
});
