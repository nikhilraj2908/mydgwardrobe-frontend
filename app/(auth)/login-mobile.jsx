import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useState, useRef } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";
import api from "../../api/api";

const countryCodes = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+86", country: "China", flag: "🇨🇳" },
];

export default function LoginMobileScreen() {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const phoneInputRef = useRef(null);

  const sendMobileOtp = async () => {
    if (phone.length < 8) {
      Alert.alert("Error", "Enter a valid mobile number");
      return;
    }

    const fullMobile = `${countryCode}${phone}`;

    setLoading(true);
    try {
      const res = await api.post("/api/auth/login-mobile", {
        mobile: fullMobile,
      });

      setLoading(false);

      if (res.status === 200) {
        const email = res.data.email;
        router.push({
          pathname: "/(auth)/otp-verify",
          params: { email },
        });
      }
    } catch (err) {
      setLoading(false);
      Alert.alert(
        "Error",
        err.response?.data?.message || "Something went wrong"
      );
    }
  };

  const handleCountrySelect = (country) => {
    setCountryCode(country.code);
    setSelectedCountry(country);
    setShowCountryPicker(false);
    // Focus phone input after country selection
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 100);
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.countryItem,
        selectedCountry.code === item.code && styles.selectedCountryItem,
      ]}
      onPress={() => handleCountrySelect(item)}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <View style={styles.countryTextContainer}>
        <Text style={styles.countryName}>{item.country}</Text>
        <Text style={styles.countryCode}>{item.code}</Text>
      </View>
      {selectedCountry.code === item.code && (
        <Ionicons name="checkmark" size={20} color="#A855F7" />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* BACK BUTTON */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={26} color="#000" />
      </TouchableOpacity>

      {/* LOGO */}
      <Image
        source={require("../../assets/images/logoblack.png")}
        style={styles.logo}
      />

      <Text style={styles.title}>Welcome Back</Text>

      <Text style={styles.label}>Mobile Number</Text>

      {/* PHONE INPUT ROW */}
      <View style={styles.phoneContainer}>
        {/* COUNTRY CODE SELECTOR */}
        <TouchableOpacity
          style={styles.countryCodeSelector}
          onPress={() => setShowCountryPicker(true)}
        >
          <View style={styles.countryCodeDisplay}>
            <Text style={styles.countryFlagDisplay}>{selectedCountry.flag}</Text>
            <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
            <Ionicons name="chevron-down" size={16} color="#666" style={styles.chevron} />
          </View>
        </TouchableOpacity>

        <View style={styles.separator} />

        {/* MOBILE NUMBER */}
        <TextInput
          ref={phoneInputRef}
          style={styles.phoneInput}
          placeholder="Enter Mobile Number"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={12}
          autoFocus={false}
        />
      </View>

      {/* COUNTRY PICKER MODAL */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCountryPicker(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Country</Text>
                  <TouchableOpacity
                    onPress={() => setShowCountryPicker(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search country"
                    placeholderTextColor="#999"
                  />
                </View>

                <FlatList
                  data={countryCodes}
                  renderItem={renderCountryItem}
                  keyExtractor={(item) => item.code}
                  showsVerticalScrollIndicator={false}
                  style={styles.countryList}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* LOGIN BUTTON */}
      <TouchableOpacity 
        onPress={sendMobileOtp} 
        style={styles.buttonWrapper}
        disabled={loading}
      >
        <LinearGradient 
          colors={["#A855F7", "#EC4899"]} 
          style={[styles.button, loading && styles.buttonDisabled]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.buttonText}>
            {loading ? "Sending OTP..." : "Login"}
          </Text>
          {!loading && (
            <Ionicons name="arrow-forward" size={20} color="#FFF" style={styles.buttonIcon} />
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.footer}>
        Don't have an account?{" "}
        <Text 
          style={styles.signup}
          onPress={() => router.push("/(auth)/signup")}
        >
          Sign up
        </Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: "#FFF",
  },
  backBtn: {
    position: "absolute",
    top: 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F0FF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 30,
    color: "#1F2937",
  },
  label: {
    fontSize: 15,
    marginBottom: 8,
    color: "#4B5563",
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
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  countryCodeSelector: {
    paddingRight: 12,
  },
  countryCodeDisplay: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  countryFlagDisplay: {
    fontSize: 20,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginRight: 4,
  },
  chevron: {
    marginLeft: 2,
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
    color: "#111827",
    fontWeight: "500",
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 14,
  },
  countryList: {
    maxHeight: 400,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  selectedCountryItem: {
    backgroundColor: "#F9F5FF",
  },
  countryFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  countryTextContainer: {
    flex: 1,
  },
  countryName: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
    marginBottom: 2,
  },
  countryCode: {
    fontSize: 14,
    color: "#6B7280",
  },
  buttonWrapper: {
    marginTop: 10,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  button: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
  buttonIcon: {
    marginLeft: 8,
  },
  footer: {
    textAlign: "center",
    marginTop: 32,
    fontSize: 15,
    color: "#6B7280",
  },
  signup: {
    color: "#A855F7",
    fontWeight: "700",
  },
});