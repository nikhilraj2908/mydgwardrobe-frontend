import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ResetSuccess() {
  return (
    <View style={styles.container}>
      {/* Success Icon */}
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.icon}
      />
      

      <Text style={styles.title}>Password Reset!</Text>

      <Text style={styles.subtitle}>
        Your password has been updated successfully.  
        You can now log in to your YDC account.
      </Text>

      <TouchableOpacity onPress={() => router.replace("/(auth)/login-username")}>
        <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.btn}>
          <Text style={styles.btnText}>Go to Login</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 90,
    height: 90,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 25,
    resizeMode: "contain",
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
    width: "85%",
  },
  btn: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
