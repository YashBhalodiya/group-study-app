
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Layout } from '../constants';

export default function ProfileTab() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(false);

  // Demo user data
  const user = {
    name: 'Sophia Carter',
    email: 'sophia.carter@email.com',
    avatarColor: '#F9C9A7',
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editIcon}>
          <Feather name="edit-2" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Avatar and Info */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatar, { backgroundColor: user.avatarColor }]}> 
          {/* You can use an Image here for real avatars */}
          <Feather name="user" size={56} color={Colors.text} />
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {/* Settings List */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsTitle}>Settings</Text>
        <TouchableOpacity style={styles.settingsItem}>
          <Text style={styles.settingsLabel}>Edit Bio</Text>
          <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsItem}>
          <Text style={styles.settingsLabel}>Change Profile Picture</Text>
          <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.settingsItem}>
          <Text style={styles.settingsLabel}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={darkMode ? Colors.primary : '#fff'}
          />
        </View>
        <View style={styles.settingsItem}>
          <Text style={styles.settingsLabel}>Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={notifications ? Colors.primary : '#fff'}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  editIcon: {
    padding: 6,
    borderRadius: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  email: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
  },
  settingsSection: {
    marginHorizontal: Layout.spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Layout.spacing.lg,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.md,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsLabel: {
    fontSize: 15,
    color: Colors.text,
  },
});
