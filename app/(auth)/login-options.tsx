import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";


export default function LoginOptionsScreen() {
  return (
    <View style={styles.container}>

      {/* Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={26} color="#111" />
      </TouchableOpacity>

      {/* Logo */}
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
      />

      {/* Welcome Text */}
      <Text style={styles.title}>Welcome Back</Text>

      {/* Login Using Mobile Number */}
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() =>router.push("/login-mobile")}
      >
        <View style={styles.iconBox}>
          <Ionicons name="call-outline" size={22} color="#A855F7" />
        </View>
        <Text style={styles.optionText}>Login using Mobile Number</Text>
      </TouchableOpacity>

      {/* Login Using Username */}
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => router.push("/login-username")}

      >
        <View style={styles.iconBox}>
          <Ionicons name="person-outline" size={22} color="#A855F7" />
        </View>
        <Text style={styles.optionText}>Login using Username</Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>
        Don’t have an account?{" "}
        <Link href="/(auth)/signup" style={styles.signupText}>
          Sign up
        </Link>
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 25,
    paddingTop: 40,
  },

  backBtn: {
    marginBottom: 20,
  },

  logo: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: 10,
    resizeMode: "contain",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 30,
  },

  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 15,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
  },

  iconBox: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  optionText: {
    fontSize: 15,
    color: "#111",
  },

  footer: {
    textAlign: "center",
    marginTop: 30,
    color: "#6B7280",
  },

  signupText: {
    color: "#A855F7",
    fontWeight: "600",
  },
});
