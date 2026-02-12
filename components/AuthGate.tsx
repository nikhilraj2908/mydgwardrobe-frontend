import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { Redirect, useSegments } from "expo-router";

export default function AuthGate({ children }) {
  const segments = useSegments();
  const {
    isAuthenticated,
    hydrated,
    profileCompleted,
    authInProgress,
  } = useAuth();

  const inAuthGroup = segments[0] === "(auth)";
  const screen = segments[1];

  const isCallback = inAuthGroup && screen === "callback";
  const isCompleteProfile =
    inAuthGroup && screen === "complete-profile";

  // 1️⃣ Wait for hydration
  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 2️⃣ ALWAYS allow callback
  if (isCallback) {
    return <>{children}</>;
  }

  // 3️⃣ Allow while auth is running
  if (authInProgress) {
    return <>{children}</>;
  }

  // 4️⃣ Not authenticated
  if (!isAuthenticated) {
    // Allow staying inside auth screens
    if (inAuthGroup) {
      return <>{children}</>;
    }

    return <Redirect href="/(auth)/welcome" />;
  }

  // 5️⃣ Logged in but profile incomplete
  if (profileCompleted === false) {
    if (!isCompleteProfile) {
      return <Redirect href="/(auth)/complete-profile" />;
    }
    return <>{children}</>;
  }

  // 6️⃣ Fully logged in → block auth screens
  if (profileCompleted === true && inAuthGroup) {
    return <Redirect href="/(tabs)/profile" />;
  }

  return <>{children}</>;
}
