import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
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
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const BASE_BAR_HEIGHT = 60;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#ffffffff" }}
      edges={["top"]} // ✅ fixes status bar overlap
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
            backgroundColor: "#ffffffff",
          },

          tabBarActiveTintColor: "#A855F7",
          tabBarInactiveTintColor: "#9CA3AF",
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
                  { tintColor: focused ? "#A855F7" : undefined },
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
                  { tintColor: focused ? "#A855F7" : undefined },
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
                      params: { mode: "create" }, // 🔥 FORCE CREATE MODE
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
                  { tintColor: focused ? "#A855F7" : "#424141ff" },
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
                  { tintColor: focused ? "#A855F7" : undefined },
                ]}
              />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
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
    backgroundColor: "#A855F7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  centerButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#A855F7",
    alignItems: "center",
    justifyContent: "center",
  },
});
