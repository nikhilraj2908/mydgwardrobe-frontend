import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";

export default function ResetLinkSent() {
  return (
    <View style={styles.container}>
      
      {/* Back Button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Icon name="arrow-back" size={22} color="#000" />
      </TouchableOpacity>
      {/* Icon */}
      <View style={styles.iconBox}>
        <Icon name="mail-open-outline" size={70} color="#A855F7" />
      </View>

      {/* Title */}
      <Text style={styles.title}>Check Your Email</Text>

      {/* Message */}
      <Text style={styles.message}>
        A password reset link has been sent to your registered email address.
        Click the link to create a new password.
      </Text>

      {/* Go to Login Button */}
      <TouchableOpacity onPress={() => router.push("/(auth)/login-username")}>
        <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.btn}>
          <Text style={styles.btnText}>Back to Login</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footer}>
        Didn’t receive the email?{" "}
        <Text
          onPress={() => router.push("/(auth)/forgot-password")}
          style={styles.resend}
        >
          Resend
        </Text>
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 25,
    justifyContent: "center",
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5E8FF",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 25,
    left: 25,
  },

  iconBox: {
    alignItems: "center",
    marginBottom: 15,
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
    color: "#111",
  },

  message: {
    fontSize: 15,
    textAlign: "center",
    color: "#666",
    paddingHorizontal: 15,
    marginBottom: 30,
  },

  btn: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 20,
  },

  btnText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },

  footer: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  resend: {
    color: "#A855F7",
    fontWeight: "600",
  },
});
