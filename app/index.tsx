import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Login } from './components/auth';
import { UserService } from './services/userService';

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
      const token = await UserService.getUserToken();
      const userProfile = await UserService.getUserProfile();
      
      if (token && userProfile) {
        // User is logged in and has profile data
        setIsLoggedIn(true);
      } else {
        // Clear any partial data
        await UserService.clearUserData();
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoggedIn(false);
    } finally {
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
