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
import { Sora_400Regular, Sora_600SemiBold, Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora';
import { HankenGrotesk_400Regular, HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';

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
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
    HankenGrotesk_400Regular,
    HankenGrotesk_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
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
