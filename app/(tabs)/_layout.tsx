import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/app/theme/ThemeContext";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const BASE_BAR_HEIGHT = 60;
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: BASE_BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 10,
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            backgroundColor: colors.surface,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
            marginBottom: 4,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ focused }) => (
              <Image
                source={require("../../assets/icons/home.png")}
                style={[
                  styles.tabIcon,
                  { tintColor: focused ? colors.primary : colors.textMuted },
                ]}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ focused }) => (
              <Image
                source={require("../../assets/icons/search.png")}
                style={[
                  styles.tabIcon,
                  { tintColor: focused ? colors.primary : colors.textMuted },
                ]}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="add-wardrobe"
          options={{
            title: "",
            tabBarIcon: () => null,
            tabBarButton: (props) => (
              <View style={styles.centerButtonContainer}>
                <TouchableOpacity
                  style={styles.centerButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    router.replace({
                      pathname: "/add-wardrobe",
                      params: { mode: "create" },
                    });
                  }}
                >
                  <View style={styles.centerButtonInner}>
                    <Ionicons name="add" size={32} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="wardrobe"
          options={{
            title: "Wardrobe",
            tabBarIcon: ({ focused }) => (
              <Image
                source={require("../../assets/icons/logo.png")}
                style={[
                  styles.wardrobeIcon,
                  { tintColor: focused ? colors.primary : colors.textMuted },
                ]}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => (
              <Image
                source={require("../../assets/icons/person.png")}
                style={[
                  styles.tabIcon,
                  { tintColor: focused ? colors.primary : colors.textMuted },
                ]}
              />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    tabIcon: {
      width: 28,
      height: 28,
      resizeMode: "contain",
    },
    wardrobeIcon: {
      width: 50,
      height: 50,
      resizeMode: "contain",
    },
    centerButtonContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    centerButton: {
      top: Platform.OS === "ios" ? -15 : -20,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 3,
      borderColor: colors.background, // provides contrast against any theme background
    },
    centerButtonInner: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
  });