import { StyleSheet } from 'react-native';
import { Colors, Layout } from '../constants';

export const useThemedStyles = (colors = Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: Layout.spacing.md,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Layout.spacing.lg,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginTop: Layout.spacing.lg,
      marginBottom: Layout.spacing.sm,
    },
    errorText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Layout.spacing.xl,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: Layout.spacing.lg,
      paddingVertical: Layout.spacing.md,
      borderRadius: 12,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
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
      color: colors.text,
    },
    editIcon: {
      padding: 6,
      borderRadius: 16,
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: Layout.spacing.xl,
      paddingHorizontal: Layout.spacing.lg,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Layout.spacing.md,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    name: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: Layout.spacing.xs,
    },
    email: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: Layout.spacing.sm,
    },
    bio: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: Layout.spacing.lg,
      paddingHorizontal: Layout.spacing.md,
    },
    settingsSection: {
      marginHorizontal: Layout.spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: Layout.spacing.lg,
      marginBottom: Layout.spacing.xl,
    },
    settingsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: Layout.spacing.md,
    },
    settingsItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Layout.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingsLabel: {
      fontSize: 15,
      color: colors.text,
    },
    logoutItem: {
      borderBottomWidth: 0,
    },
    logoutText: {
      fontSize: 15,
      color: '#FF6B6B',
      fontWeight: '500',
    },
  });