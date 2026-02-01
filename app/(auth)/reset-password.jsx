import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import api from "../../api/api";

export default function ResetPasswordScreen() {

  const params = useLocalSearchParams();
const email =
  Array.isArray(params.email) ? params.email[0] : params.email;

if (!email || !email.includes("@")) {
  Alert.alert("Error", "Invalid reset link. Please try again.");
  router.replace("/(auth)/forgot-password");
  return null;
}



  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const resetPassword = async () => {
    if (!password || !confirm) {
      return Alert.alert("Error", "Fill all fields");
    }

    if (password !== confirm) {
      return Alert.alert("Error", "Passwords do not match");
    }

    if (!email) {
  Alert.alert("Error", "Invalid reset session. Please try again.");
  router.replace("/(auth)/forgot-password");
  return null;
}

    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", {
        email,
        newPassword: password,
      });

      Alert.alert(
        "Success",
        "Password updated successfully",
        [
          {
            text: "Login",
            onPress: () =>
              router.replace("/(auth)/login-username"),
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Reset failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bgallpage.png")}
      style={styles.background}
    >
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Icon name="arrow-back" size={22} />
        </TouchableOpacity>

        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Reset Password</Text>

        <TextInput
          style={styles.input}
          placeholder="New Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        <TouchableOpacity onPress={resetPassword}>
          <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.btn}>
            <Text style={styles.btnText}>
              {loading ? "Updating..." : "Reset Password"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, padding: 25 },
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
    marginVertical: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#F8F8F8",
    borderRadius: 25,
    padding: 15,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 15,
  },
  btn: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
