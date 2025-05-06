import '../global.css';

import { LogBox, Platform } from 'react-native';
import 'react-native-gesture-handler';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Warning: Encountered two children with the same key',
  'Warning: Each child in a list should have a unique',
  'Warning: Components need to set a variable during the initial render',
  'CssInterop upgrade warning',
  '(NOBRIDGE) LOG',
]);

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import NavigationBar, { setBackgroundColorAsync } from 'expo-navigation-bar';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(drawer)',
};

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      // Set the navigation bar style
      setBackgroundColorAsync('black');
    }
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ title: 'Modal', presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}
