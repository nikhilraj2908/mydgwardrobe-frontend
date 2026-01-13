import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";
import api from "../../api/api";

export default function ForgotPasswordScreen() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);

  const sendResetRequest = async () => {
    if (!identifier.trim()) {
      Alert.alert("Error", "Please enter email or mobile number");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/api/auth/forgot-password", {
        identifier,
      });

      setLoading(false);

      Alert.alert("Success", "Reset link sent to your email");

      // Navigate to confirmation screen
      router.push("/(auth)/reset-link-sent");
    } catch (err) {
      setLoading(false);

      Alert.alert(
        "Error",
        err.response?.data?.message || "Unable to send reset link"
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Icon name="arrow-back" size={22} color="#000" />
      </TouchableOpacity>

      {/* Logo */}
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Enter your registered email or mobile number
      </Text>

      {/* Input */}
      <Text style={styles.label}>Email or Mobile Number</Text>
      <TextInput
        placeholder="+910000000000"
        value={identifier}
        onChangeText={setIdentifier}
        style={styles.input}
        placeholderTextColor="#888"
      />

      {/* Send Reset Link Button */}
      <TouchableOpacity onPress={sendResetRequest}>
        <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.btn}>
          <Text style={styles.btnText}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Back to Login */}
      <TouchableOpacity onPress={() => router.push("/(auth)/login-username")}>
        <Text style={styles.footer}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5E8FF",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 90,
    height: 90,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 25,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    marginTop: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    marginTop: 10,
    fontWeight: "500",
  },
  input: {
    width: "100%",
    backgroundColor: "#F8F8F8",
    borderRadius: 25,
    padding: 15,
    fontSize: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#eee",
  },
  btn: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
    color: "#A855F7",
    fontWeight: "500",
  },
});
