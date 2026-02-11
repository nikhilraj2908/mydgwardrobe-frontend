import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { Redirect, useSegments } from "expo-router";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const {
    isAuthenticated,
    hydrated,
    profileCompleted,
    authInProgress,
  } = useAuth();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const inAuthGroup = segments[0] === "(auth)";
  const currentScreen = segments[1];

  const inCallback = inAuthGroup && currentScreen === "callback";
  const inCompleteProfile =
    inAuthGroup && currentScreen === "complete-profile";

  // 🚀 Allow callback screen always
  if (inCallback) {
    return <>{children}</>;
  }

  // 🚀 During login process, allow auth screens
  if (authInProgress) {
    return <>{children}</>;
  }

  // ❌ Not authenticated
  if (!isAuthenticated) {
    if (!inAuthGroup) {
      return <Redirect href="/(auth)/welcome" />;
    }
    return <>{children}</>;
  }

  // ❌ Logged in but profile not completed
  if (isAuthenticated && profileCompleted === false) {
    if (!inCompleteProfile) {
      return <Redirect href="/(auth)/complete-profile" />;
    }
    return <>{children}</>;
  }

  // ❌ Logged in and profile complete → block auth screens
  if (isAuthenticated && profileCompleted === true && inAuthGroup) {
    return <Redirect href="/profile" />;
  }

  return <>{children}</>;
}
