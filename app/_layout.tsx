import { Slot } from "expo-router";
import * as Linking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SavedItemsProvider } from "../context/SavedItemsContext";
import { FollowProvider } from "@/context/FollowContext";

export const linking = {
  prefixes: ["mydgwardrobe://"], // 🔥 Deep link prefix
  config: {
    screens: {
      "(auth)": {
        screens: {
          "reset-password": "reset-password", // 🔥 route mapping
        },
      },
    },
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FollowProvider>
        <SavedItemsProvider>
          <Slot />
        </SavedItemsProvider>
      </FollowProvider>
    </SafeAreaProvider>
  );
}
