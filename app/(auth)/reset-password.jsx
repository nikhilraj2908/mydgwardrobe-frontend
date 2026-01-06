import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import api from "../../api/api";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams(); // 🔥 get token from URL
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
  if (!password || !confirm) {
    return Alert.alert("Error", "Please fill all fields");
  }

  if (password !== confirm) {
    return Alert.alert("Error", "Passwords do not match");
  }

  setLoading(true);

  try {
    const res = await api.post("/api/auth/reset-password", {
      token,
      newPassword: password,
    });

    setLoading(false);

    // 🔥 Show success popup clearly
    Alert.alert(
      "Password Updated",
      "Your password has been reset successfully.\nYou can now log in using your new password.",
      [
        {
          text: "OK",
          onPress: () => {
            // Delay navigation so alert is visible
            setTimeout(() => {
              router.push("/(auth)/login-username");
            }, 300);
          },
        },
      ]
    );
  } catch (err) {
    setLoading(false);

    Alert.alert(
      "Error",
      err.response?.data?.message || "Failed to reset password"
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
        source={require("../../assets/images/logoblack.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter a new password for your YDC account
      </Text>

      {/* New Password */}
      <Text style={styles.label}>New Password</Text>
      <TextInput
        placeholder="Enter new password"
        secureTextEntry={!show}
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {/* Confirm Password */}
      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        placeholder="Confirm new password"
        secureTextEntry={!show}
        value={confirm}
        onChangeText={setConfirm}
        style={styles.input}
      />

      <TouchableOpacity onPress={() => setShow(!show)}>
        <Text style={styles.showToggle}>
          {show ? "Hide Password" : "Show Password"}
        </Text>
      </TouchableOpacity>

      {/* Submit */}
      <TouchableOpacity onPress={handleResetPassword}>
        <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.btn}>
          <Text style={styles.btnText}>
            {loading ? "Resetting..." : "Reset Password"}
          </Text>
        </LinearGradient>
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
    borderWidth: 1,
    borderColor: "#eee",
  },
  showToggle: {
    fontSize: 14,
    color: "#A855F7",
    marginVertical: 10,
    fontWeight: "500",
    textAlign: "right",
  },
  btn: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 20,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
