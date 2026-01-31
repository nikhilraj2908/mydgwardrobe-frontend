import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ImageBackground,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/api";

const countryCodes = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
];

export default function ForgotPasswordScreen() {
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendResetRequest = async () => {
    let identifierToSend = "";

    if (phone.trim()) {
      if (phone.length < 8) {
        Alert.alert("Error", "Enter a valid mobile number");
        return;
      }
      identifierToSend = `${countryCode}${phone}`;
    } else if (identifier.trim()) {
      identifierToSend = identifier;
    } else {
      Alert.alert("Error", "Enter email or mobile number");
      return;
    }

    setLoading(true);

    try {
      await api.post("/api/auth/forgot-password", {
        identifier: identifierToSend,
      });

      setLoading(false);

      Alert.alert("Success", "Reset link sent successfully");
      router.push("/(auth)/reset-link-sent");
    } catch (err) {
      setLoading(false);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Unable to send reset link"
      );
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bgallpage.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <View style={styles.container}>
        {/* BACK */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#000" />
        </TouchableOpacity>

        {/* LOGO */}
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter your registered email or mobile number
        </Text>

        {/* INPUT */}
        <Text style={styles.label}>Email or Mobile Number</Text>

        <View style={styles.phoneContainer}>
          <TouchableOpacity
            style={styles.countryCodeSelector}
            onPress={() => setShowCountryPicker(true)}
          >
            <View style={styles.countryCodeDisplay}>
              <Text style={styles.countryFlagDisplay}>
                {selectedCountry.flag}
              </Text>
              <Text style={styles.countryCodeText}>{countryCode}</Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </View>
          </TouchableOpacity>

          <View style={styles.separator} />

          <TextInput
            style={styles.phoneInput}
            placeholder="Enter email or mobile number"
            placeholderTextColor="#9CA3AF"
            keyboardType="default"
            value={phone || identifier}
            onChangeText={(text) => {
              if (/^[0-9]+$/.test(text) || text === "") {
                setPhone(text);
                setIdentifier("");
              } else {
                setIdentifier(text);
                setPhone("");
              }
            }}
          />
        </View>

        {/* BUTTON */}
        <TouchableOpacity onPress={sendResetRequest}>
          <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.btn}>
            <Text style={styles.btnText}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* FOOTER */}
        <TouchableOpacity onPress={() => router.push("/(auth)/login-username")}>
          <Text style={styles.footer}>Back to Login</Text>
        </TouchableOpacity>
      </View>

      {/* COUNTRY PICKER MODAL */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCountryPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <FlatList
                data={countryCodes}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.countryItem}
                    onPress={() => {
                      setCountryCode(item.code);
                      setSelectedCountry(item);
                      setShowCountryPicker(false);
                    }}
                  >
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <Text>{item.country} ({item.code})</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ImageBackground>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(245, 244, 244, 0)",
  },
  container: {
    flex: 1,
    padding: 25,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5E8FF",
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 25,
  },
  countryCodeSelector: {
    paddingRight: 12,
  },
  countryCodeDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryFlagDisplay: {
    fontSize: 20,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 4,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: "#E5E7EB",
    marginRight: 16,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
  },
  btn: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    color: "#A855F7",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },
});
