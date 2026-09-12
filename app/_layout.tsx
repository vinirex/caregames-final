import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { PointsProvider } from "../context/PointsContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";
import { Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function LayoutContent() {
  const { userEmail, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'default',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ animation: 'none' }}
      />
      <Stack.Screen 
        name="register" 
        options={{ animation: 'none' }}
      />
      <Stack.Screen 
        name="home" 
        options={{ animation: 'none' }}
      />
      <Stack.Screen 
        name="wearables" 
        options={{ animation: 'none' }}
      />
      <Stack.Screen 
        name="desafios" 
        options={{ animation: 'none' }}
      />
      <Stack.Screen 
        name="rankings" 
        options={{ animation: 'none' }}
      />
      <Stack.Screen 
        name="beneficios" 
        options={{ animation: 'none' }}
      />
    </Stack>
  );
}

function LayoutContainer() {
  const { theme } = useTheme();
  return (
    <View className={theme === "dark" ? "dark flex-1" : "flex-1 bg-light-surface"}>
      <LayoutContent />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Sora_400Regular: require('../assets/fonts/Sora-Regular.ttf'),
    Sora_600SemiBold: require('../assets/fonts/Sora-SemiBold.ttf'),
    Sora_700Bold: require('../assets/fonts/Sora-Bold.ttf'),
    Sora_800ExtraBold: require('../assets/fonts/Sora-ExtraBold.ttf'),
    HankenGrotesk_400Regular: require('../assets/fonts/HankenGrotesk-Regular.ttf'),
    HankenGrotesk_600SemiBold: require('../assets/fonts/HankenGrotesk-SemiBold.ttf'),
    JetBrainsMono_400Regular: require('../assets/fonts/JetBrainsMono-Regular.ttf'),
    JetBrainsMono_700Bold: require('../assets/fonts/JetBrainsMono-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <PointsProvider>
            <NotificationProvider>
              <LayoutContainer />
            </NotificationProvider>
          </PointsProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
