import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Login } from './components/auth';

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    // Replace this with actual authentication check
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Simulate auth check - replace with actual implementation
      setTimeout(() => {
        // For demo purposes, let's assume user is logged in
        // Change this to false to see login screen
        setIsLoggedIn(false); // Change to true to simulate logged in
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (token: string) => {
    setIsLoggedIn(true);
  };

  if (isLoading) {
    return <View style={styles.container} />;
  }

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/groups" />;
  }

  return (
    <View style={styles.container}>
      <Login onLoginSuccess={handleLoginSuccess} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
