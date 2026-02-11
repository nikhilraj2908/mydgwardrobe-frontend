import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from '../../context/AuthContext';
import { ImageBackground } from "react-native";
const API_URL = Constants.expoConfig.extra.apiBaseUrl;

export default function LoginWithUsername() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, isLoading, login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter username and password");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password,
      });

      // Call login to save token
      await login(res.data.token, res.data.user.profileCompleted);


      // Now navigate to profile
      Alert.alert("Success", "Login successful!");
      router.replace('/profile');

    } catch (err) {
      setLoading(false);
      Alert.alert("Error", err.response?.data?.message || "Login failed");
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bgallpage.png")}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Dark overlay to make white elements stand out */}
      <View style={styles.overlay} />
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <View style={styles.backIconWrapper}>
            <Ionicons name="arrow-back" size={22} color="#000" />
          </View>
        </TouchableOpacity>

        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Welcome Back</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          placeholder="Enter your username"
          style={styles.input}
          placeholderTextColor="#8E8E8E"
          value={username}
          onChangeText={setUsername}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            placeholder="Enter your password"
            secureTextEntry={!passwordVisible}
            style={styles.passwordInput}
            placeholderTextColor="#8E8E8E"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <Ionicons
              name={passwordVisible ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#7A7A7A"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnWrapper} onPress={handleLogin}>
          <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.loginBtn}>
            <Text style={styles.loginText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.forgotText}>
            <Link href="/(auth)/forgot-password">
              Forgot password? <Text style={styles.resetText}>Reset</Text>
            </Link>
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Don't have an account?{" "}
          <Link href="/(auth)/signup" style={styles.signupText}>
            Sign up
          </Link>
          {/* <Text style={styles.signupText}>Sign up</Text> */}
        </Text>
      </View>
    </ImageBackground>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 50,
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  backBtn: {
    marginBottom: 10,
  },

  backIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
    color: "#111",
  },

  label: {
    fontSize: 15,
    marginBottom: 6,
    color: "#444",
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    height: 52,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 15,
    fontSize: 15,
  },

  passwordWrapper: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    height: 52,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },

  passwordInput: {
    flex: 1,
    fontSize: 15,
  },

  btnWrapper: {
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 15,
    marginTop: 10,
  },

  loginBtn: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },

  loginText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },

  forgotText: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 25,
    fontSize: 14,
  },

  resetText: {
    color: "#A855F7",
    fontWeight: "600",
  },

  footer: {
    textAlign: "center",
    color: "#6B7280",
    marginTop: 5,
    fontSize: 14,
  },

  signupText: {
    color: "#A855F7",
    fontWeight: "600",
  },
});
