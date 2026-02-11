// D:\nikhil\MyFirstApp\app\_layout.tsx
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
import * as WebBrowser from "expo-web-browser";

// This is CRITICAL for Auth0 to work
WebBrowser.maybeCompleteAuthSession();

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
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
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