import AppBackground from "@/components/AppBackground";
import WardrobeHeader from "@/components/WardrobeHeader";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons"; // For adding icons
import { router } from "expo-router";

const settingsPage = () => {

     const handleBackNavigation = () => {
        router.back(); // Use router.back() to navigate back to the previous page (Profile)
      };
  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <AppBackground>
        <WardrobeHeader title="Settings" onBack={handleBackNavigation} />
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.heading}>Settings</Text>
          <Text style={styles.introText}>
            Manage your account, preferences, and more.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <TouchableOpacity style={styles.settingOption}>
              <Ionicons name="key-outline" size={20} color="#A855F7" />
              <Text style={styles.text}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingOption}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#A855F7" />
              <Text style={styles.text}>Privacy Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingOption}>
              <Ionicons name="notifications-outline" size={20} color="#A855F7" />
              <Text style={styles.text}>Notification Preferences</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <TouchableOpacity style={styles.settingOption}>
              <Ionicons name="mail-outline" size={20} color="#A855F7" />
              <Text style={styles.text}>Contact Us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingOption}>
              <Ionicons name="document-text-outline" size={20} color="#A855F7" />
              <Text style={styles.text}>Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingOption}>
              <Ionicons name="shield-outline" size={20} color="#A855F7" />
              <Text style={styles.text}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.text}>App Version: 1.0.0</Text>
            <Text style={styles.text}>Managed and created by - Alogicdata</Text>
            <Text style={styles.text}>© 2026 Alogic Data. All rights reserved.</Text>
          </View>
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#4A4A4A",
    marginBottom: 15,
  },
  introText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4A4A4A",
    marginBottom: 10,
  },
  settingOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: "#555",
    marginLeft: 12,
  },
});

export default settingsPage;
