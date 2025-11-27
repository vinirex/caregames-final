import { Drawer } from 'expo-router/drawer';
import { ThemeProvider } from "../../context/ThemeContext";
import { Stack } from "expo-router";
import { useTheme } from "../../context/ThemeContext";
import { StatusBar } from "expo-status-bar";

export  function AppLayout() {
  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer>
      <Drawer.Screen name="homeScreen" options={{ title: 'Home' }} />
      <Drawer.Screen name="profile" options={{ title: 'Profile' }} />
      <Drawer.Screen name="settings" options={{ title: 'Settings' }} />
    </Drawer>
  );
}