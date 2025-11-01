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
import { Colors, Layout } from "../../constants";
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

          <Button
            title="Sign Up with Google"
            onPress={() => console.log("Google sign up")}
            variant="outline"
            style={styles.googleButton}
          />

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
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Layout.spacing.lg,
  },
  header: {
    alignItems: "center",
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: Layout.fontSize.title,
    fontWeight: "bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    marginBottom: Layout.spacing.xl,
  },
  loginButton: {
    marginTop: Layout.spacing.md,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Layout.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Layout.spacing.md,
    color: Colors.textSecondary,
    fontSize: Layout.fontSize.sm,
  },
  googleButton: {
    marginBottom: Layout.spacing.lg,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Layout.spacing.md,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: Layout.fontSize.md,
  },
  signUpLink: {
    color: Colors.primary,
    fontSize: Layout.fontSize.md,
    fontWeight: "600",
  },
});
