import api from "@/api/api";
import AppBackground from "@/components/AppBackground";
import WardrobeHeader from "@/components/WardrobeHeader";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangePassword() {
  const { token ,user} = useAuth();
const isGoogleUser = user?.authProvider === "google";

  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  // 👁️ visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = async () => {
    if (!current || !newPass || !confirm) {
      Alert.alert("Error", "All fields required");
      return;
    }

    if (newPass !== confirm) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await api.post(
        "/api/auth/change-password",
        {
          currentPassword: current,
          newPassword: newPass,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert("Success", "Password changed successfully");
      router.back();

    } catch (err: any) {
      Alert.alert("Error", err?.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };
if (isGoogleUser) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppBackground>
        <WardrobeHeader title="Change Password" onBack={() => router.back()} />
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 16, color: "#666" }}>
            Your password is managed by your Google account.
            Please change it through Google settings.
          </Text>
        </View>
      </AppBackground>
    </SafeAreaView>
  );
}

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <AppBackground>
        <WardrobeHeader title="Change Password" onBack={() => router.back()} />

        <View style={styles.container}>

          {/* CURRENT PASSWORD */}
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Current Password"
              secureTextEntry={!showCurrent}
              style={styles.input}
              value={current}
              onChangeText={setCurrent}
            />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
              <Ionicons
                name={showCurrent ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          {/* NEW PASSWORD */}
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="New Password"
              secureTextEntry={!showNew}
              style={styles.input}
              value={newPass}
              onChangeText={setNewPass}
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              <Ionicons
                name={showNew ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          {/* CONFIRM PASSWORD */}
          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Confirm New Password"
              secureTextEntry={!showConfirm}
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons
                name={showConfirm ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleChange}>
            <Text style={styles.btnText}>
              {loading ? "Updating..." : "Change Password"}
            </Text>
          </TouchableOpacity>

        </View>
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },

  button: {
    backgroundColor: "#A855F7",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  btnText: { color: "#fff", fontWeight: "bold" },
});
