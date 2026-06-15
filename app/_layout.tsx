import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { PointsProvider } from "../context/PointsContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";

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
    </Stack>
  );
}

function LayoutContainer() {
  const { theme } = useTheme();
  return (
    <View className={theme === "dark" ? "dark flex-1" : "flex-1"}>
      <LayoutContent />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PointsProvider>
          <LayoutContainer />
        </PointsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
