import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import api from "../../api/api"; // ✅ Axios instance
import { useAuth } from '../../context/AuthContext';
export default function OtpVerify() {
  const router = useRouter();
  const { email } = useLocalSearchParams(); // GET EMAIL

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const inputs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleChange = (text, index) => {
    if (text.length <= 1) {
      const temp = [...otp];
      temp[index] = text;
      setOtp(temp);

      if (text && index < 3) inputs[index + 1].current.focus();
    }
  };

  // -------------------------------------------------------------------
  // ✅ VERIFY OTP (Axios Version)
  // -------------------------------------------------------------------
  const verifyCode = async () => {
    const code = otp.join("");

    if (code.length !== 4) {
      Alert.alert("Error", "Please enter complete OTP");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/api/auth/verify-mobile-login", {
        email,
        otp: code,
      });

      // Use the auth context login function (it will redirect to profile)
      await login(res.data.token);
      
      Alert.alert("Success", "Logged in successfully!");
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", err.response?.data?.message || "Invalid OTP");
    }
  };


  // -------------------------------------------------------------------
  // ✅ RESEND OTP  (Axios Version)
  // -------------------------------------------------------------------
  const resendOtp = async () => {
    setResending(true);

    try {
      const res = await api.post("/api/auth/resend-mobile-otp", {
        email,
      });

      setResending(false);

      Alert.alert("Success", "OTP resent to your email");

    } catch (err) {
      setResending(false);
      Alert.alert("Error", err.response?.data?.message || "Cannot reach server");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={26} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>OTP sent to: {email}</Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={inputs[index]}
            style={styles.otpBox}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(txt) => handleChange(txt, index)}
          />
        ))}
      </View>

      <TouchableOpacity onPress={verifyCode} style={styles.btnWrapper}>
        <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.btn}>
          <Text style={styles.btnText}>
            {loading ? "Verifying..." : "Verify"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={resendOtp}>
        <Text style={styles.resendText}>
          {resending ? "Resending..." : "Resend OTP"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 40, backgroundColor: "#FFF" },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#F4EBFF",
    justifyContent: "center", alignItems: "center",
    marginBottom: 30,
  },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  subtitle: { textAlign: "center", color: "#666", marginBottom: 25 },
  otpContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 40, paddingHorizontal: 20 },
  otpBox: {
    width: 60, height: 60, borderRadius: 18,
    backgroundColor: "#F9FAFB",
    borderWidth: 1, borderColor: "#E5E7EB",
    textAlign: "center", fontSize: 22, fontWeight: "600",
  },
  btnWrapper: { borderRadius: 30, overflow: "hidden" },
  btn: { paddingVertical: 15, borderRadius: 30, alignItems: "center" },
  btnText: { color: "#FFF", fontSize: 18, fontWeight: "600" },
  resendText: { color: "#A855F7", fontSize: 16, marginTop: 20, textAlign: "center" },
});
