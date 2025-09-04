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
import { Colors, Layout } from "../../constants";
import { globalStyles } from "../../styles";
import { AnimationView, Button, Input } from "../ui";

// Import the actual Lottie animation JSON placeholder
const studyAnimation = require("../../../assets/animations/study-placeholder.json");

export const SignUp: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    // Reset errors
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    // Validation
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }
    if (name.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      return;
    }
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
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      return;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // 👇 Call your backend API instead of Amplify
      const response = await fetch(
        "https://nuym736dmc.execute-api.ap-south-1.amazonaws.com/default/SignFunction",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        }
      );

      const data = await response.json().catch(() => null);
      console.log("API response:", response.status, data);

      if (!response.ok) {
        throw new Error(
          data?.message || `Signup failed with status ${response.status}`
        );
      }

      alert("Signup successful!");
      router.replace("./Login"); // Or go to dashboard
    } catch (error: any) {
      console.error("Sign up error:", error);
      alert(error.message || "Error signing up");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginPress = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[globalStyles.container, styles.container]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.animationContainer}>
          <AnimationView
            source={studyAnimation}
            width={200}
            height={200}
            style={styles.animation}
          />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Welcome to StudyHub</Text>
          <Text style={styles.subtitle}>
            Join our community of learners and start collaborating today.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            error={nameError}
            autoCapitalize="words"
            autoComplete="name"
          />
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
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            secureTextEntry
            autoComplete="password-new"
          />
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={confirmPasswordError}
            secureTextEntry
            autoComplete="password-new"
          />

          <Button
            title="Sign Up"
            onPress={handleSignUp}
            loading={loading}
            style={styles.signUpButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLoginPress}>
              <Text style={styles.loginLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: Layout.spacing.lg },
  animationContainer: {
    alignItems: "center",
    marginTop: Layout.spacing.xl,
    marginBottom: Layout.spacing.lg,
  },
  animation: {},
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
  signUpButton: { marginTop: Layout.spacing.md },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Layout.spacing.md,
  },
  footerText: { color: Colors.textSecondary, fontSize: Layout.fontSize.md },
  loginLink: {
    color: Colors.primary,
    fontSize: Layout.fontSize.md,
    fontWeight: "600",
  },
});
