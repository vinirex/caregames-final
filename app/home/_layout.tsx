import { Drawer } from 'expo-router/drawer';
import { ThemeProvider } from "../../context/ThemeContext";
import { Stack, Redirect } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../context/AuthContext";

export function AppLayout() {
  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}

export default function DrawerLayout() {
  const { userEmail, isLoading } = useAuth();

  if (!isLoading && !userEmail) {
    return <Redirect href="/" />;
  }

  return (
    <Drawer screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="homeScreen" options={{ title: 'Início' }} />
      <Drawer.Screen name="profile" options={{ title: 'Perfil' }} />
      <Drawer.Screen name="settings" options={{ title: 'Configurações' }} />
    </Drawer>
  );
}