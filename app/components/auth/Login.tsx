import { router } from "expo-router";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from 'react-native-toast-message';
import { Colors } from "../../constants";
import { AuthService } from "../../services/authService";
import { globalStyles } from "../../styles";
import { Button, Input } from "../ui";


interface LoginProps {
  onLoginSuccess?: (token: string) => void; // Expect a token now
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");

    // Validation
    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email");
      return;
    }
    if (!password) {
      setPasswordError("Password is required");
      return;
    }
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      // Sign in with Firebase
      const user = await AuthService.signIn(email, password);
      
      // Check if email is verified
      const isVerified = await AuthService.isEmailVerified();
      
      if (!isVerified) {
        // Email not verified, redirect to verification screen
        Toast.show({
          type: 'info',
          text1: 'Email Verification Required',
          text2: 'Please verify your email before accessing the app.',
          visibilityTime: 4000,
        });
        router.replace("/email-verification");
        return;
      }

      // Email is verified, proceed with login
      Toast.show({
        type: 'success',
        text1: 'Welcome Back! 👋',
        text2: 'You have successfully logged in.',
      });

      // Call the success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess(user.uid);
      } else {
        router.replace("/(tabs)/groups");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      setPasswordError(error.message || "Login failed. Please try again.");
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message || "Please check your credentials and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpPress = () => {
    router.push("/signup");
  };

  return (
    <SafeAreaView style={[globalStyles.container, styles.container]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.header}>
          <Text style={styles.title}>Welcome to StudyHub</Text>
          <Text style={styles.subtitle}>
            Join our community of learners and start collaborating today.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            secureTextEntry
            autoComplete="password"
          />

          <Button
            title="Log In"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUpPress}>
              <Text style={styles.signUpLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFBFC',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: '#1A1A1A',
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: "center",
    lineHeight: 22,
    fontWeight: '500',
    paddingHorizontal: 20,
    opacity: 0.8,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 40,
  },
  loginButton: {
    marginTop: 24,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
  },
  signUpLink: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
