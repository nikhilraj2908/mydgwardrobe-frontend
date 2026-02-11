import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegistrationSuccess() {
  const router = useRouter();

  const goToLoginOptions = () => {
    router.replace("/(auth)/login-options");
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bgallpage.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>🎉 Registration Successful!</Text>

          <Text style={styles.subtitle}>
            Your account has been created successfully.
          </Text>

          <Text style={styles.description}>
            You can now log in using Google, your mobile number, or your username and password.
          </Text>

          <TouchableOpacity onPress={goToLoginOptions} style={styles.buttonWrapper}>
            <LinearGradient
              colors={["#A855F7", "#EC4899"]}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Continue to Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#374151",
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 20,
  },
  buttonWrapper: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
  },
  button: {
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
