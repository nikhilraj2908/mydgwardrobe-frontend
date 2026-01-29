import { Slot } from "expo-router";
import * as Linking from "expo-linking";
import * as Font from "expo-font";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SavedItemsProvider } from "../context/SavedItemsContext";
import { FollowProvider } from "@/context/FollowContext";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "./theme/ThemeContext";

export const linking = {
  prefixes: ["mydgwardrobe://"],
  config: {
    screens: {
      "(auth)": {
        screens: {
          "reset-password": "reset-password",
        },
      },
    },
  },
};

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      Cookie: require("../assets/fonts/Cookie-Regular.ttf"),
    }).then(() => setFontsLoaded(true));
  }, []);

  // ⛔ Prevent rendering until font is ready
  if (!fontsLoaded) {
    return null; // or splash / loader
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <FollowProvider>
          <SavedItemsProvider>
            <ThemeProvider>
             <Slot />
            </ThemeProvider>
          </SavedItemsProvider>
        </FollowProvider>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
