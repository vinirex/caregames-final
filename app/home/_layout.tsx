import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function HomeLayout() {
  const { userEmail, isLoading } = useAuth();

  if (!isLoading && !userEmail) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="homeScreen" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}