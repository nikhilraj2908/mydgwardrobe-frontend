
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
export default function WelcomeScreen() {


  return (
    <ImageBackground
      source={require("../assets/images/bg.jpg")} // your new background image
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlayimage} />
      <View style={styles.overlay}>
        {/* Logo */}
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
        />

        {/* Title */}
        <Text style={styles.title}>
          <Text style={styles.titleHighlight}>Digi</Text><Text style={styles.titleHighlight2}>Wardrobe</Text>
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Build Your Profile — Join us and start exploring
        </Text>

        {/* Create Account Button */}
        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity style={{ margin: 20, width: '100%' }}>
            <LinearGradient
              colors={["#A855F7", "#EC4899"]}
              style={{
                paddingVertical: 15,
                borderRadius: 30,
                alignItems: "center",
                width: "100%"
              }}
            >
              <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "600" }}>
                Create New Account
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Link>


        {/* Login Button */}
        <Link href="/login-options" asChild>
          <TouchableOpacity style={styles.btnSecondary}>
            <Text style={styles.btnSecondaryText}>Log into existing account</Text>
          </TouchableOpacity>
        </Link>

        {/* Footer */}
        <Text style={styles.footer}>Terms of Service | Privacy</Text>
      </View>

    </ImageBackground>
  );
}

// ------------ STYLES -------------
const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlayimage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.65)",  // adjust 0.3 - 0.6
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  logo: {
    width: 150,
    height: 150,
 resizeMode: "contain",
  tintColor: "#FFFFFF",
  },

  title: {
    fontSize:5,
    color: "#FFF",
    marginBottom: 10,
    textAlign: "center",
  },

  titleHighlight: {
    color: "#A855F7",
    fontFamily: "Cookie",
    fontSize: 38,
  },
  titleHighlight2:{
    fontFamily: "Cookie",
    fontSize: 38,
  },

  subtitle: {
    fontSize: 14,
    color: "#aeb2bcff",
    marginBottom: 40,
    textAlign: "center",
  },

  signupbtn: {
    width: "100%",
  },

  btnPrimary: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 15,
  },

  gradient: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },

  btnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  btnSecondary: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFFCC", // slight transparency looks modern
    marginBottom: 40,
  },

  btnSecondaryText: {
    color: "#111",
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },

  footer: {
    fontSize: 12,
    color: "#6B7280",
    position: "absolute",
    bottom: 30,
  },
});
