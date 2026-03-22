/**
 * ORION Mobile App
 * A React Native chat application
 * 
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import { LoginScreen, RegisterScreen, ChatScreen } from './src/screens';

// Store
import { useAuthStore } from './src/store';

// Constants
import { COLORS } from './src/utils';

// Type definitions for navigation
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Loading screen component
const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
);

function App(): React.JSX.Element {
  const [isReady, setIsReady] = useState(false);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsReady(true);
      }
    };

    initializeApp();
  }, [checkAuth]);

  if (!isReady) {
    return <LoadingScreen />;
  }

  const initialRoute = isAuthenticated ? 'Chat' : 'Login';

  return (
    <NavigationContainer>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={COLORS.background} 
      />
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{
            animation: 'fade',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default App;
