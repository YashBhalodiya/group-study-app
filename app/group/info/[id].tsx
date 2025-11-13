import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Share,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../../../firebase';
import { Colors } from '../../constants/Colors';
import { useTheme } from '../../contexts/ThemeContext';
import {
    FirestoreGroupData,
    FirestoreGroupsService,
    GroupMember
} from '../../services/firestoreGroupsService';

export default function GroupInfoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [group, setGroup] = useState<FirestoreGroupData | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'member' | null>(null);

  const currentUser = auth.currentUser;
  const groupId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (groupId && typeof groupId === 'string') {
      loadGroupInfo();
    } else {
      console.error('Invalid groupId:', groupId);
      Alert.alert('Error', 'Invalid group ID');
      router.back();
    }
  }, [groupId]);

  const loadGroupInfo = async () => {
    if (!groupId || typeof groupId !== 'string') {
      console.error('Invalid groupId in loadGroupInfo:', groupId);
      return;
    }

    try {
      setLoading(true);
      
      // Load group data
      const groupData = await FirestoreGroupsService.getGroupById(groupId);
      if (!groupData) {
        Alert.alert('Error', 'Group not found');
        router.back();
        return;
      }

      // Load members
      const membersData = await FirestoreGroupsService.getGroupMembers(groupId);
      
      // Determine current user's role
      const userRole = membersData.find(m => m.id === currentUser?.uid)?.role || null;
      
      setGroup(groupData);
      setMembers(membersData);
      setCurrentUserRole(userRole);
    } catch (error) {
      console.error('Error loading group info:', error);
      Alert.alert('Error', 'Failed to load group information');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroupInfo();
    setRefreshing(false);
  };

  const shareGroupCode = async () => {
    if (!group) return;

    try {
      const message = `Join our study group "${group.name}"!\n\nGroup Code: ${group.code}\n\nSubject: ${group.subject}\nDescription: ${group.description}`;
      
      await Share.share({
        message,
        title: `Join ${group.name}`,
      });
    } catch (error) {
      console.error('Error sharing group code:', error);
    }
  };

  const handleLeaveGroup = () => {
    if (!group || !currentUser || !groupId || typeof groupId !== 'string') return;

    const isCreator = group.createdBy === currentUser.uid;
    const isOnlyAdmin = currentUserRole === 'admin' && group.admins.length === 1;

    let message = 'Are you sure you want to leave this group?';
    
    if (isCreator && isOnlyAdmin) {
      message = 'You are the only admin of this group. Leaving will require you to transfer admin rights first or delete the group.';
      Alert.alert('Cannot Leave Group', message);
      return;
    }

    Alert.alert(
      'Leave Group',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await FirestoreGroupsService.leaveGroup(groupId);
              router.replace('/(tabs)/groups');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to leave group');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteGroup = () => {
    if (!group || !groupId || typeof groupId !== 'string') return;

    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await FirestoreGroupsService.deleteGroup(groupId);
              router.replace('/(tabs)/groups');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete group');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{
        flex: 1,
        backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{
          marginTop: 16,
          fontSize: 16,
          color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
        }}>
          Loading group information...
        </Text>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView style={{
        flex: 1,
        backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <Ionicons 
          name="alert-circle-outline" 
          size={64} 
          color={theme === 'dark' ? Colors.dark.textSecondary : Colors.light.textSecondary} 
        />
        <Text style={{
          marginTop: 16,
          fontSize: 18,
          fontWeight: '600',
          color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
          textAlign: 'center',
        }}>
          Group Not Found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 20,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: Colors.primary,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: theme === 'dark' ? Colors.dark.background : Colors.light.background,
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme === 'dark' ? Colors.dark.surface : Colors.light.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme === 'dark' ? Colors.dark.border : Colors.light.border,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            padding: 8,
            marginRight: 8,
          }}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme === 'dark' ? Colors.dark.text : Colors.light.text}
          />
        </TouchableOpacity>
        
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
          }}>
            Group Information
          </Text>
        </View>

        <TouchableOpacity
          onPress={shareGroupCode}
          style={{
            padding: 8,
            marginLeft: 8,
          }}
        >
          <Ionicons
            name="share-outline"
            size={24}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Group Details */}
        <View style={{
          margin: 16,
          padding: 20,
          backgroundColor: theme === 'dark' ? Colors.dark.surface : Colors.light.surface,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <Text style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
            marginBottom: 12,
          }}>
            {group.name}
          </Text>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <Ionicons
              name="book-outline"
              size={20}
              color={Colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={{
              fontSize: 16,
              color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
              fontWeight: '500',
            }}>
              {group.subject}
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <Ionicons
              name="key-outline"
              size={20}
              color={Colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={{
              fontSize: 16,
              color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
              fontWeight: '600',
              letterSpacing: 2,
            }}>
              {group.code}
            </Text>
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}>
            <Ionicons
              name="people-outline"
              size={20}
              color={Colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={{
              fontSize: 16,
              color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
            }}>
              {group.memberCount} of {group.maxMembers} members
            </Text>
          </View>

          {group.description && (
            <View style={{
              marginTop: 8,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: theme === 'dark' ? Colors.dark.border : Colors.light.border,
            }}>
              <Text style={{
                fontSize: 16,
                color: theme === 'dark' ? Colors.dark.textSecondary : Colors.light.textSecondary,
                lineHeight: 22,
              }}>
                {group.description}
              </Text>
            </View>
          )}

          <View style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: theme === 'dark' ? Colors.dark.border : Colors.light.border,
          }}>
            <Text style={{
              fontSize: 14,
              color: theme === 'dark' ? Colors.dark.textSecondary : Colors.light.textSecondary,
            }}>
              Created by {group.createdByName} on {formatDate(group.createdAt)}
            </Text>
          </View>
        </View>

        {/* Members Section */}
        <View style={{
          marginHorizontal: 16,
          marginBottom: 16,
          backgroundColor: theme === 'dark' ? Colors.dark.surface : Colors.light.surface,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}>
          <View style={{
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: theme === 'dark' ? Colors.dark.border : Colors.light.border,
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
            }}>
              Members ({members.length})
            </Text>
          </View>

          {members.map((member, index) => (
            <View
              key={member.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: index < members.length - 1 ? 1 : 0,
                borderBottomColor: theme === 'dark' ? Colors.dark.border : Colors.light.border,
              }}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12,
              }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: 'white',
                }}>
                  {member.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color: theme === 'dark' ? Colors.dark.text : Colors.light.text,
                }}>
                  {member.name}
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: theme === 'dark' ? Colors.dark.textSecondary : Colors.light.textSecondary,
                }}>
                  Joined {formatDate(member.joinedAt)}
                </Text>
              </View>

              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                backgroundColor: member.role === 'admin' ? Colors.primary : Colors.secondary,
                borderRadius: 12,
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: 'white',
                  textTransform: 'uppercase',
                }}>
                  {member.role}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={{
          marginHorizontal: 16,
          marginBottom: 16,
        }}>
          <TouchableOpacity
            onPress={handleLeaveGroup}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              backgroundColor: Colors.error,
              borderRadius: 12,
              marginBottom: currentUserRole === 'admin' ? 12 : 0,
            }}
          >
            <Ionicons
              name="exit-outline"
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: 'white',
            }}>
              Leave Group
            </Text>
          </TouchableOpacity>

          {currentUserRole === 'admin' && (
            <TouchableOpacity
              onPress={handleDeleteGroup}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                backgroundColor: '#FF3B30',
                borderRadius: 12,
              }}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: 'white',
              }}>
                Delete Group
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}