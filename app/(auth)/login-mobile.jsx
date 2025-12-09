import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
} from "react-native";

export default function LoginMobileScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMobileOtp = async () => {
    if (phone.length < 10) {
      Alert.alert("Error", "Enter a valid mobile number");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://192.168.137.145:5001/api/auth/login-mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: phone }),
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        Alert.alert("Error", data.message || "Something went wrong");
        return;
      }

      // Navigate to OTP screen WITH EMAIL
      router.push({
        pathname: "/(auth)/otp-verify",
        params: { email: data.email }, // PASS EMAIL HERE 🚀
      });
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Cannot reach server");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={26} color="#000" />
      </TouchableOpacity>

      <Image
        source={require("../../assets/images/logoblack.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>Welcome Back</Text>

      <Text style={styles.label}>Mobile Number</Text>

      <TextInput
        style={styles.input}
        placeholder="+91 Enter your mobile number"
        keyboardType="number-pad"
        placeholderTextColor="#8E8E8E"
        value={phone}
        onChangeText={setPhone}
      />

      {/* LOGIN BUTTON */}
      <TouchableOpacity onPress={sendMobileOtp} style={styles.buttonWrapper}>
        <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.button}>
          <Text style={styles.buttonText}>
            {loading ? "Sending OTP..." : "Login"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Don't have an account? <Text style={styles.signup}>Sign up</Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 20, backgroundColor: "#FFF" },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#F5F0FF",
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  logo: { width: 110, height: 110, resizeMode: "contain", alignSelf: "center", marginBottom: 15 },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 25 },
  label: { fontSize: 14, marginBottom: 6, color: "#666" },
  input: {
    backgroundColor: "#F9FAFB",
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
    fontSize: 15,
  },
  buttonWrapper: { marginTop: 10, borderRadius: 30, overflow: "hidden" },
  button: { paddingVertical: 15, alignItems: "center" },
  buttonText: { color: "#FFF", fontSize: 17, fontWeight: "600" },
  footer: { textAlign: "center", marginTop: 25, fontSize: 14, color: "#555" },
  signup: { color: "#A855F7", fontWeight: "600" },
});
