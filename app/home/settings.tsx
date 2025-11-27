import { View, Text, Switch } from "react-native";
import { useTheme } from "../../context/ThemeContext";

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();

  return (
    <View
      className={`flex-1 justify-center items-center ${theme === "dark" ? "bg-gray-900" : "bg-white"
        }`}
    >
      <Text className={`text-xl mb-4 ${theme === "dark" ? "text-white" : "text-black"}`}>Dark Mode</Text>
      <Switch
        value={theme === "dark"}
        onValueChange={toggleTheme}
        thumbColor={theme === "dark" ? "#2563eb" : "#ccc"}
      />
    </View>
  );
}
