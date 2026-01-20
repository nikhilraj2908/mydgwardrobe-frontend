import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageBackground } from "react-native";

WebBrowser.maybeCompleteAuthSession();

// Create axios instance with base URL
// const API_URL = process.env.EXPO_PUBLIC_API_URL ;
const API_URL = Constants.expoConfig.extra.apiBaseUrl;
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const COUNTRY_CODES = [
  { code: "IN", dial: "+91", flag: "🇮🇳" },
  { code: "US", dial: "+1", flag: "🇺🇸" },
  { code: "UK", dial: "+44", flag: "🇬🇧" },
  { code: "AE", dial: "+971", flag: "🇦🇪" },
  { code: "CA", dial: "+1", flag: "🇨🇦" }
];



const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const years = Array.from({ length: 90 }, (_, i) => (2024 - i).toString());

export default function SignupScreen() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "836704104886-o8pslkdrbufj18ffq6di46n3935vclhs.apps.googleusercontent.com",
    expoClientId: "836704104886-o8pslkdrbufj18ffq6di46n3935vclhs.apps.googleusercontent.com",
    androidClientId: "836704104886-gi3cd3vnp6ccjndc7q6mh1pdem0e9iue.apps.googleusercontent.com",
    // iosClientId: "836704104886-tngtqtpp2fs14ipu73i0ltu27ojlrk3t.apps.googleusercontent.com",
    // expoClientId: "836704104886-ps1rab6u5q89tie5ltfi9edbbeqeqfs6.apps.googleusercontent.com"
  });
  const router = useRouter();

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState(null);

  // Password visibility
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Phone
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [countryDropdownVisible, setCountryDropdownVisible] = useState(false);
  const [phone, setPhone] = useState("");

  // DOB
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleLogin(response.authentication.accessToken);
    }
  }, [response]);

  // ---------------------- SIGNUP HANDLER ----------------------
  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword || !gender || !phone || !day || !month || !year) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const dob = `${year}-${String(months.indexOf(month) + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const mobile = selectedCountry.dial + phone;

    setLoading(true);

    try {
      const response = await api.post("/api/auth/register", {
        username,
        email,
        password,
        gender: gender === "male" ? "Male" : "Female",
        mobile,
        dob,
      });

      alert("OTP sent to your email");

      router.push({
        pathname: "/(auth)/verify",
        params: { email },
      });

    } catch (error) {
      console.log("Signup error:", error.response?.data || error.message);

      if (error.response) {
        // Server responded with error status
        alert(error.response.data?.message || "Registration failed");
      } else if (error.request) {
        // Request made but no response
        alert("Server not reachable. Check your connection.");
      } else {
        // Other errors
        alert("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleLogin = async (accessToken) => {
    try {
      const googleUser = await axios.get(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const { email, name, id, picture } = googleUser.data;

      // 🔥 Call YOUR backend
      const res = await api.post("/api/auth/google", {
        email,
        name,
        googleId: id,
        photo: picture,
      });

      const { token, user } = res.data;

      // Save token (AsyncStorage / SecureStore)
      // await SecureStore.setItemAsync("token", token);

      // Redirect based on profile status
      if (!user.profileCompleted) {
        router.replace("/complete-profile");
      } else {
        router.replace("/home");
      }
    } catch (err) {
      console.log("Google login error:", err.response?.data || err.message);
      alert("Google login failed");
    }
  };

  // ---------------------- DROPDOWN UI ----------------------
  const renderDropdown = (data, visible, onSelect, onClose, selectedValue) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.dropdownContainer}>
          <FlatList
            data={data}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.dropdownItem, selectedValue === item && styles.selectedDropdownItem]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={[styles.dropdownItemText, selectedValue === item && styles.selectedDropdownItemText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // ------------------------- UI -------------------------
  return (
     <ImageBackground 
    source={require("../assets/images/bgallpage.png")}
    style={{ flex: 1 }}
    resizeMode="cover"
  >
    {/* Light overlay for readability */}
    <View style={styles.overlay} />

    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={require("../assets/images/logo.png")} style={styles.logo} />

        <TouchableOpacity
          style={styles.googleBtn}
          disabled={!request}
          // onPress={() => promptAsync()}
          onPress={() => promptAsync({ useProxy: true })}

        >
          <Ionicons name="logo-google" size={20} color="#111" />
          <Text style={styles.googleText}>Continue with Google</Text>

        </TouchableOpacity>
        <Text style={styles.orText}>OR</Text>

        {/* USERNAME */}
        <Text style={styles.label}>Username</Text>
        <TextInput
          placeholder="Choose a username"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />

        {/* PASSWORD */}
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Create password"
            secureTextEntry={!passwordVisible}
            style={styles.inputPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
            <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* CONFIRM PASSWORD */}
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Confirm password"
            secureTextEntry={!confirmPasswordVisible}
            style={styles.inputPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
            <Ionicons name={confirmPasswordVisible ? "eye-off-outline" : "eye-outline"} size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* GENDER */}
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderBox, gender === "male" && styles.genderSelected]}
            onPress={() => setGender("male")}
          >
            <Text style={[styles.genderText, gender === "male" && styles.genderSelectedText]}>Male</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.genderBox, gender === "female" && styles.genderSelected]}
            onPress={() => setGender("female")}
          >
            <Text style={[styles.genderText, gender === "female" && styles.genderSelectedText]}>Female</Text>
          </TouchableOpacity>
        </View>

        {/* PHONE */}
        <Text style={styles.label}>Mobile Number</Text>

        <View style={styles.phoneContainer}>
          <TouchableOpacity style={styles.countryBtn} onPress={() => setCountryDropdownVisible(!countryDropdownVisible)}>
            <Text style={styles.flagText}>{selectedCountry.flag}</Text>
            <Ionicons name="chevron-down" size={16} color="#444" />
          </TouchableOpacity>

          {countryDropdownVisible && (
            <View style={styles.countryDropdown}>
              {COUNTRY_CODES.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedCountry(item);
                    setCountryDropdownVisible(false);
                  }}
                >
                  <Text style={styles.dropdownText}>{item.flag} {item.dial}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.callingCode}>{selectedCountry.dial}</Text>

          <TextInput
            placeholder="Enter mobile number"
            keyboardType="number-pad"
            style={styles.phoneInput}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* EMAIL */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          placeholder="Enter your email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />

        {/* DOB */}
        <Text style={styles.label}>Date of Birth</Text>
        <View style={styles.dobRow}>
          <TouchableOpacity style={styles.dobBox} onPress={() => setShowDayDropdown(true)}>
            <Text style={[styles.dobText, day && styles.dobTextSelected]}>{day || "Day"}</Text>
            <Ionicons name="chevron-down" size={16} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dobBox} onPress={() => setShowMonthDropdown(true)}>
            <Text style={[styles.dobText, month && styles.dobTextSelected]}>{month || "Month"}</Text>
            <Ionicons name="chevron-down" size={16} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dobBox} onPress={() => setShowYearDropdown(true)}>
            <Text style={[styles.dobText, year && styles.dobTextSelected]}>{year || "Year"}</Text>
            <Ionicons name="chevron-down" size={16} />
          </TouchableOpacity>
        </View>

        {renderDropdown(days, showDayDropdown, setDay, () => setShowDayDropdown(false), day)}
        {renderDropdown(months, showMonthDropdown, setMonth, () => setShowMonthDropdown(false), month)}
        {renderDropdown(years, showYearDropdown, setYear, () => setShowYearDropdown(false), year)}

        {/* SIGNUP BUTTON */}
        <TouchableOpacity style={styles.buttonWrapper} onPress={handleSignup}>
          <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.gradientButton}>
            <Text style={styles.buttonText}>
              {loading ? "Creating..." : "Create Account"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>


        {/* GOOGLE SIGNUP */}



        <Link href="/login-options" asChild>
          <Text style={styles.footer}>
            Already have an account? <Text style={styles.loginText}>Login</Text>
          </Text>
        </Link>
      </ScrollView>
      </SafeAreaView>
       </ImageBackground>
      );
}

      // ------------------------- STYLES -------------------------
      const styles = StyleSheet.create({
       overlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(245, 244, 244, 0)",
},

container: {
  paddingHorizontal: 25,
  paddingTop: 10,
  paddingBottom: 40,
  backgroundColor: "transparent", // 👈 VERY IMPORTANT
},
      logo: {
        width: 120,
      height: 120,
      alignSelf: "center",
      resizeMode: "contain",
      marginTop: 25,

  },
      label: {
        fontSize: 14,
      marginBottom: 6,
      color: "#374151",
  },
      input: {
        backgroundColor: "#F9FAFB",
      padding: 14,
      marginBottom: 10,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: "#E5E7EB",
  },
      passwordContainer: {
        flexDirection: "row",
      marginBottom: 10,

      alignItems: "center",
      backgroundColor: "#F9FAFB",
      borderWidth: 1,
      borderRadius: 25,
      paddingHorizontal: 15,
  },
      inputPassword: {
        flex: 1,
      paddingVertical: 12,
  },
      genderRow: {
        marginBottom: 10,

      flexDirection: "row",
      justifyContent: "space-between",
  },
      genderBox: {
        flex: 1,
      paddingVertical: 12,
      marginHorizontal: 5,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      backgroundColor: "#F9FAFB",
      alignItems: "center",
  },
      genderSelected: {
        backgroundColor: "#A855F7",
      borderColor: "#A855F7",
  },
      genderText: {
        fontSize: 15,
      color: "#111",
  },
      genderSelectedText: {
        color: "#FFF",
  },
      phoneContainer: {
        backgroundColor: "#F9FAFB",
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderRadius: 25,
      paddingHorizontal: 12,
      height: 50,
      flexDirection: "row",
      alignItems: "center",
      position: "relative",
      marginBottom: 10,

  },
      countryBtn: {
        flexDirection: "row",
      alignItems: "center",
      marginRight: 10,
  },
      flagText: {
        fontSize: 22,
      marginRight: 4,
  },
      callingCode: {
        fontSize: 14,
      color: "#111",
      marginRight: 6,
  },
      phoneInput: {
        flex: 1,
      fontSize: 14,
  },
      countryDropdown: {
        position: "absolute",
      top: 48,
      left: 10,
      width: 120,
      backgroundColor: "#FFF",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#DDD",
      zIndex: 20,
      elevation: 5,
  },
      dropdownItem: {
        padding: 10,
  },
      dropdownText: {
        fontSize: 14,
  },
      dobRow: {
        flexDirection: "row",
      justifyContent: "space-between",
  },
      dobBox: {
        flex: 1,
      backgroundColor: "#F9FAFB",
      borderColor: "#E5E7EB",
      borderWidth: 1,
      borderRadius: 25,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      marginHorizontal: 4,
      flexDirection: "row",
  },
      dobText: {
        fontSize: 14,
      color: "#6B7280",
  },
      dobTextSelected: {
        color: "#111",
      fontWeight: "500",
  },
      modalOverlay: {
        flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
  },
      dropdownContainer: {
        backgroundColor: "#FFF",
      width: "80%",
      maxHeight: 300,
      borderRadius: 12,
  },
      selectedDropdownItem: {
        backgroundColor: "#F3F4F6",
  },
      dropdownItemText: {
        fontSize: 16,
      textAlign: "center",
  },
      selectedDropdownItemText: {
        color: "#A855F7",
      fontWeight: "600",
  },
      buttonWrapper: {
        marginTop: 20,
      borderRadius: 30,
      overflow: "hidden",
  },
      gradientButton: {
        paddingVertical: 15,
      alignItems: "center",
  },
      buttonText: {
        color: "#FFF",
      fontSize: 16,
      fontWeight: "600",
  },
      orText: {
        textAlign: "center",
      marginVertical: 10,
  },
      googleBtn: {
        borderWidth: 1,
      borderColor: "#E5E7EB",
      paddingVertical: 12,
      borderRadius: 30,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
  },
      googleText: {
        marginLeft: 8,
      fontSize: 15,
  },
      footer: {
        textAlign: "center",
      marginTop: 20,
  },
      loginText: {
        color: "#A855F7",
      fontWeight: "600",
  },
});