import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AppNavigator } from './src/navigation/AppNavigator';
import { requestNotificationPermissions } from './src/utils/notificationHelper';

export default function App() {
  useEffect(() => {
    // Request notification permissions on app launch
    requestNotificationPermissions();

    // Listen for incoming notifications when app is active
    const notificationSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
      });

    // Listen for user interactions with notifications (e.g. tapping the reminder)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('User interacted with notification:', response);
      });

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
