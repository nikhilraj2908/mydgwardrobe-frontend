import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { Redirect, useSegments } from "expo-router";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  // ⛔ Block routing until auth state is known
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const inAuthGroup = segments[0] === "(auth)";

  // 🚫 Not logged in → force auth
  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // ✅ Logged in → block auth screens
  if (isAuthenticated && inAuthGroup) {
    return <Redirect href="/profile" />;
  }

  return <>{children}</>;
}
