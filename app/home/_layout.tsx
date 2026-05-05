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
      <Drawer.Screen name="homeScreen" options={{ title: 'Início' }} />
      <Drawer.Screen name="profile" options={{ title: 'Perfil' }} />
      <Drawer.Screen name="settings" options={{ title: 'Configurações' }} />
    </Drawer>
  );
}