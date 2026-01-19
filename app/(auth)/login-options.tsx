import { View, Text, StyleSheet, TouchableOpacity, Image, ImageBackground } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";

export default function LoginOptionsScreen() {
  return (
    <ImageBackground
      source={require("../../assets/images/bgallpage.png")}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Dark overlay to make white elements stand out */}
      <View style={styles.overlay} />
      
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#FFF" />
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
          onPress={() => router.push("/login-mobile")}
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
          Don't have an account?{" "}
          <Link href="/(auth)/signup" style={styles.signupText}>
            Sign up
          </Link>
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Dark overlay to make white elements visible
  },
  container: {
    flex: 1,
    backgroundColor: "transparent", // Make container transparent
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
    color: "#FFF", // Changed to white for better contrast
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)", // Slightly transparent white
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    paddingVertical: 15,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 15,
    // Add shadow for better visibility
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    fontWeight: "500",
  },
  footer: {
    textAlign: "center",
    marginTop: 30,
    color: "#FFF", // Changed to white
    fontSize: 14,
    fontWeight: "500",
  },
  signupText: {
    color: "#E9D5FF", // Lighter purple for better contrast
    fontWeight: "700",
    fontSize: 14,
  },
});