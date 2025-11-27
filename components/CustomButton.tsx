import React from "react";
import { TouchableOpacity, Text, ViewStyle, TextStyle, ActivityIndicator } from "react-native";
import { useTheme } from "../context/ThemeContext";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const { theme, colors } = useTheme();

  // 🎨 Define button styles based on theme + variant
  const backgroundColor =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
      ? colors.card
      : "transparent";

  const borderColor = variant === "outline" ? colors.primary : "transparent";

  const textColor =
    variant === "primary"
      ? colors.background
      : variant === "secondary"
      ? colors.text
      : colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor,
          paddingVertical: 14,
          paddingHorizontal: 22,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderColor,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            {
              color: textColor,
              fontSize: 16,
              fontWeight: "600",
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
