import { Slot, Stack } from "expo-router";
import * as Font from "expo-font";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SavedItemsProvider } from "../context/SavedItemsContext";
import { FollowProvider } from "@/context/FollowContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider } from "./theme/ThemeContext";
import AuthGate from "@/components/AuthGate";
/* ---------------- AUTH GATE ---------------- */

/* ---------------- ROOT ---------------- */
export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      Cookie: require("../assets/fonts/Cookie-Regular.ttf"),
    }).then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
  <SafeAreaProvider>
    <FollowProvider>
      <SavedItemsProvider>
        <ThemeProvider>
          <AuthGate>
            <Slot />
          </AuthGate>
        </ThemeProvider>
      </SavedItemsProvider>
    </FollowProvider>
  </SafeAreaProvider>
</AuthProvider>

  );
}
