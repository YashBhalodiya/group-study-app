import { Amplify } from 'aws-amplify';
import { Stack } from "expo-router";
import 'react-native-get-random-values';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import awsconfig from '../src/aws-exports'; // adjust path if needed

// Configure Amplify once at the root
Amplify.configure(awsconfig);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </SafeAreaProvider>
  );
}
