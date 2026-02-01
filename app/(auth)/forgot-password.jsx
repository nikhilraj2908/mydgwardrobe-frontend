import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
import api from "../../api/api";

export default function ForgotPasswordScreen() {
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("INPUT"); // INPUT | OTP
  const [loading, setLoading] = useState(false);
  const [emailForReset, setEmailForReset] = useState("");

  /* ---------------- SEND OTP ---------------- */
  const sendOtp = async () => {
    if (!identifier.trim()) {
      return Alert.alert("Error", "Enter email or mobile number");
    }

    setLoading(true);
    try {
      const res = await api.post("/api/auth/forgot-password", {
        identifier,
      });

      setEmailForReset(res.data.email);
      setStep("OTP");

      Alert.alert("OTP Sent", "OTP has been sent to your registered email");
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to send OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- VERIFY OTP ---------------- */
  const verifyOtp = async () => {
    if (otp.length !== 4) {
      return Alert.alert("Error", "Enter 4-digit OTP");
    }

    setLoading(true);
    try {
      await api.post("/api/auth/verify-reset-otp", {
        email: emailForReset,
        otp,
      });

      router.push({
        pathname: "/(auth)/reset-password",
        params: { email: emailForReset },
      });

      
    } catch (err) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Invalid OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bgallpage.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* BACK */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>

        {/* LOGO */}
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Forgot Password</Text>

        {step === "INPUT" && (
          <>
            <Text style={styles.subtitle}>
              Enter your registered email or mobile number
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email or Mobile Number"
              value={identifier}
              onChangeText={setIdentifier}
            />

            <TouchableOpacity onPress={sendOtp}>
              <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.btn}>
                <Text style={styles.btnText}>
                  {loading ? "Sending..." : "Get OTP"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}

        {step === "OTP" && (
          <>
            <Text style={styles.subtitle}>
              Enter the OTP sent to your email
            </Text>

            <TextInput
              style={styles.input}
              placeholder="4-digit OTP"
              keyboardType="number-pad"
              maxLength={4}
              value={otp}
              onChangeText={setOtp}
            />

            <TouchableOpacity onPress={verifyOtp}>
              <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.btn}>
                <Text style={styles.btnText}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </>
        )}
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
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginVertical: 20,
  },
  input: {
    backgroundColor: "#F8F8F8",
    borderRadius: 25,
    padding: 15,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 20,
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
});
