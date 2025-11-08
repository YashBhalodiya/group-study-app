import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, Button, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { getAuth } from 'firebase/auth';
import { subscribeToUserJoinedGroups, joinGroup } from '../services/firestoreGroups';

export default function JoinedGroupsScreen() {
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user?.uid;
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinInput, setJoinInput] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!userId) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToUserJoinedGroups(
      userId,
      (groups) => {
        setGroups(groups);
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Error fetching groups');
        setLoading(false);
      }
    );
    return unsub;
  }, [userId]);

  const handleJoin = async () => {
    if (!joinInput.trim()) return;
    setJoining(true);
    setError(null);
    try {
      await joinGroup(joinInput.trim(), userId);
      Alert.alert('Success', 'Joined group!');
      setJoinInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Groups</Text>
      <View style={styles.joinRow}>
        <TextInput
          style={styles.input}
          placeholder="Enter group ID to join"
          value={joinInput}
          onChangeText={setJoinInput}
        />
        <Button title={joining ? 'Joining...' : 'Join'} onPress={handleJoin} disabled={joining || !joinInput.trim()} />
      </View>
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 32 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={groups.filter(g => g.members?.includes(userId))}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.groupCard}>
              <Text style={styles.groupName}>{item.groupName}</Text>
              <Text style={styles.groupMeta}>Created by: {item.createdBy}</Text>
              <Text style={styles.groupMeta}>Members: {item.members?.length || 0}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>You haven't joined any groups yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  joinRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginRight: 8 },
  error: { color: 'red', marginBottom: 16 },
  groupCard: { padding: 16, borderWidth: 1, borderColor: '#eee', borderRadius: 10, marginBottom: 12 },
  groupName: { fontSize: 18, fontWeight: '600' },
  groupMeta: { fontSize: 14, color: '#555' },
  empty: { textAlign: 'center', color: '#888', marginTop: 32 },
});
