import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { PointsProvider } from "../context/PointsContext";
import { AuthProvider } from "../context/AuthContext";
import { Slot } from "expo-router";
import { View } from "react-native";

function LayoutContainer() {
  const { theme } = useTheme();
  return (
    <View className={theme === "dark" ? "dark flex-1" : "flex-1"}>
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PointsProvider>
          <LayoutContainer />
        </PointsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
