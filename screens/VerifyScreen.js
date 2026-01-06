import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import api from "../api/api";
export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams(); // ← Get email from SignupScreen

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleChange = (text, index) => {
    if (text.length > 1) return;

    const updated = [...otp];
    updated[index] = text;
    setOtp(updated);

    if (text !== "" && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };

  // ---------------------- VERIFY OTP ----------------------
const submitOtp = async () => {
  const code = otp.join("");

  if (code.length !== 4) {
    alert("Please enter the full 4-digit code");
    return;
  }

  setLoading(true);

  try {
    const res = await api.post("/api/auth/verify-otp", {
      email,
      otp: code,
    });

    // Axios success
    if (res.status === 200) {
      alert("OTP Verified Successfully!");
      router.replace("/profile/");
    }
  } catch (err) {
    alert(err.response?.data?.message || "Invalid OTP");
  }

  setLoading(false);
};

// ---------------------- RESEND OTP ----------------------
const resendOtp = async () => {
  setResendLoading(true);

  try {
    const res = await api.post("/api/auth/resend-otp", { email });

    if (res.status === 200) {
      alert("New OTP sent to your email!");
    }
  } catch (err) {
    alert(err.response?.data?.message || "Failed to resend OTP");
  }

  setResendLoading(false);
};

  return (
    <View style={styles.container}>
      {/* Icon */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={26} color="#000" />
            </TouchableOpacity>
      <View style={styles.iconWrapper}>
        <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.iconCircle}>
          <FontAwesome5 name="envelope" size={38} color="white" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Verify Account</Text>

      <Text style={styles.subtitle}>
        Enter the 4-digit verification code sent to your email
      </Text>

      <Text style={styles.emailLabel}>Code sent to</Text>
      <Text style={styles.email}>{email}</Text>

      {/* OTP INPUT */}
      <View style={styles.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={inputRefs[i]}
            style={styles.otpInput}
            maxLength={1}
            keyboardType="number-pad"
            value={digit}
            onChangeText={(t) => handleChange(t, i)}
          />
        ))}
      </View>

      {/* Confirm */}
      <TouchableOpacity style={styles.btnWrapper} onPress={submitOtp}>
        <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.btnGradient}>
          <Text style={styles.btnText}>{loading ? "Verifying..." : "Confirm Code"}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Resend */}
      <Text style={styles.resendText}>
        Didn't receive code?{" "}
        <Text style={styles.resendLink} onPress={resendOtp}>
          {resendLoading ? "Sending..." : "Resend code"}
        </Text>
      </Text>
    </View>
  );
}

// ----------------- STYLES -----------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 50,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },

  iconWrapper: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    marginVertical: 10,
    paddingHorizontal: 20,
    fontSize: 14,
  },

  emailLabel: {
    fontSize: 14,
    color: "#6B7280",
  },

  email: {
    fontSize: 16,
    fontWeight: "600",
    color: "#A855F7",
    marginBottom: 25,
  },

  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 30,
  },

  otpInput: {
    width: 55,
    height: 55,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
  },

  btnWrapper: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
  },

  btnGradient: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },

  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  resendText: {
    marginTop: 15,
    fontSize: 14,
    color: "#6B7280",
  },

  resendLink: {
    color: "#A855F7",
    fontWeight: "600",
  },
});
