import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Button } from './components/ui';
import { Colors, Layout } from './constants';
import { AuthService } from './services/authService';
import { globalStyles } from './styles';

export default function EmailVerificationScreen() {
  const [loading, setLoading] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Check verification status every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const isVerified = await AuthService.isEmailVerified();
        if (isVerified) {
          Toast.show({
            type: 'success',
            text1: 'Email Verified! ✅',
            text2: 'Your email has been verified successfully.',
          });
          router.replace('/(tabs)/groups');
        }
      } catch (error) {
        console.log('Error checking verification status:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      await AuthService.sendEmailVerification();
      Toast.show({
        type: 'success',
        text1: 'Verification Email Sent! 📧',
        text2: 'Please check your inbox and spam folder.',
      });
      setResendCooldown(60); // 60 second cooldown
    } catch (error: any) {
      console.error('Error resending verification:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Send Email',
        text2: error.message || 'Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    try {
      const isVerified = await AuthService.isEmailVerified();
      if (isVerified) {
        Toast.show({
          type: 'success',
          text1: 'Email Verified! ✅',
          text2: 'Your email has been verified successfully.',
        });
        router.replace('/(tabs)/groups');
      } else {
        Toast.show({
          type: 'info',
          text1: 'Not Verified Yet',
          text2: 'Please check your email and click the verification link.',
        });
      }
    } catch (error: any) {
      console.error('Error checking verification:', error);
      Toast.show({
        type: 'error',
        text1: 'Check Failed',
        text2: 'Unable to check verification status.',
      });
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
      Toast.show({
        type: 'info',
        text1: 'Signed Out',
        text2: 'You have been signed out successfully.',
      });
      router.replace('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const currentUser = AuthService.getCurrentUser();

  return (
    <SafeAreaView style={[globalStyles.container, styles.container]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <Feather name="mail" size={80} color={Colors.primary} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification link to{'\n'}
            <Text style={styles.emailText}>{currentUser?.email}</Text>
          </Text>
          <Text style={styles.description}>
            Please click the link in your email to verify your account. 
            You may need to check your spam folder.
          </Text>
        </View>

        <View style={styles.actionContainer}>
          <Button
            title="Check Verification Status"
            onPress={handleCheckVerification}
            loading={checkingVerification}
            style={styles.primaryButton}
          />

          <Button
            title={resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Verification Email"}
            onPress={handleResendVerification}
            loading={loading}
            disabled={resendCooldown > 0}
            variant="outline"
            style={styles.resendButton}
          />

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>Sign out and use different email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>Not receiving emails?</Text>
          <Text style={styles.helpText}>
            • Check your spam/junk folder{'\n'}
            • Make sure the email address is correct{'\n'}
            • Try resending the verification email{'\n'}
            • Contact support if the problem persists
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  content: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: Layout.fontSize.title,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Layout.spacing.md,
  },
  subtitle: {
    fontSize: Layout.fontSize.lg,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Layout.spacing.md,
  },
  emailText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  description: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionContainer: {
    marginBottom: Layout.spacing.xl,
  },
  primaryButton: {
    marginBottom: Layout.spacing.md,
  },
  resendButton: {
    marginBottom: Layout.spacing.lg,
  },
  signOutButton: {
    paddingVertical: Layout.spacing.md,
    alignItems: 'center',
  },
  signOutText: {
    color: Colors.textSecondary,
    fontSize: Layout.fontSize.md,
    textDecorationLine: 'underline',
  },
  helpContainer: {
    backgroundColor: Colors.surface,
    padding: Layout.spacing.lg,
    borderRadius: 12,
    marginTop: Layout.spacing.lg,
  },
  helpTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
  },
  helpText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});