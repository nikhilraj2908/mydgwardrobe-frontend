import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { Image, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { useAuthRequest } from "expo-auth-session";
import { useEffect } from "react";

WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri({
  scheme: "mydgwardrobe",
  path:"callback"
});



export default function LoginOptionsScreen() {
const { AUTH0_DOMAIN, AUTH0_CLIENT_ID } = Constants.expoConfig.extra;



const discovery = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
};

const [request, response, promptAsync] = useAuthRequest(
  {
    clientId: AUTH0_CLIENT_ID,
    redirectUri,
    scopes: ["openid", "profile", "email"],
    responseType: "code",
    usePKCE: true,
    extraParams: {
      connection: "google-oauth2",
      prompt: "select_account", // 🔥 FORCE account chooser
    },
  },
  discovery
);

useEffect(() => {
  if (!request?.codeVerifier) return;

  const savePKCE = async () => {
    await AsyncStorage.setItem(
      "auth0_code_verifier",
      request.codeVerifier
    );

    await AsyncStorage.setItem(
      "auth0_redirect_uri",
      redirectUri
    );
  };

  savePKCE();
}, [request]);

const { setAuthInProgress } = useAuth();
const handleGoogleLogin = async () => {
  setAuthInProgress(true);
  await promptAsync();
};
useEffect(() => {
  if (response?.type === "error") {
    setAuthInProgress(false);
  }
}, [response]);

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
        {/* Continue with Google */}
        <TouchableOpacity
          style={styles.googleButton}
          activeOpacity={0.8}
          onPress={handleGoogleLogin}
        >
          <Ionicons style={styles.googleIcon} name="logo-google" size={20} color="#b700ff" />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* OR Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

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
    backgroundColor: "rgba(245, 244, 244, 0)", // Dark overlay to make white elements visible
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
    color: "#020202ff", // Changed to white for better contrast
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
    color: "#000000ff", // Changed to white
    fontSize: 14,
    fontWeight: "500",
  },
  signupText: {
    color: "#a453faff", // Lighter purple for better contrast
    fontWeight: "700",
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: 14,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 10,
    resizeMode: "contain",
  },

  googleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#DDD",
  },

  orText: {
    marginHorizontal: 10,
    fontSize: 13,
    fontWeight: "500",
    color: "#555",
  },

});