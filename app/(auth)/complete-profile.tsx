import AppBackground from "@/components/AppBackground";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import api from "../../api/api";
import { useAuth } from "../../context/AuthContext";

export default function CompleteProfile() {
    const { token } = useAuth();
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [username, setUsername] = useState("");
    const [gender, setGender] = useState<"Male" | "Female" | null>(null);
    const [loading, setLoading] = useState(false);

    // PHONE
    const [selectedCountry, setSelectedCountry] = useState({
        code: "IN",
        dial: "+91",
        flag: "🇮🇳",
    });
    const [phone, setPhone] = useState("");

    // DOB
    const [day, setDay] = useState("");
    const [month, setMonth] = useState("");
    const [year, setYear] = useState("");

    const [showDayDropdown, setShowDayDropdown] = useState(false);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [showYearDropdown, setShowYearDropdown] = useState(false);

    const COUNTRY_CODES = [
        { code: "IN", dial: "+91", flag: "🇮🇳" },
        { code: "US", dial: "+1", flag: "🇺🇸" },
        { code: "UK", dial: "+44", flag: "🇬🇧" },
        { code: "AE", dial: "+971", flag: "🇦🇪" },
    ];

    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const years = Array.from({ length: 90 }, (_, i) => (2024 - i).toString());

    const submitProfile = async () => {
        if (!phone || !gender || !day || !month || !year) {
            Alert.alert("Error", "Please complete all required fields");
            return;
        }

        const dob = `${year}-${String(months.indexOf(month) + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const mobile = selectedCountry.dial + phone;

        try {
            setLoading(true);

            const payload: any = { mobile, gender, dob };
            if (username.trim()) payload.username = username;

            await api.post("/api/auth/complete-profile", payload);

            Alert.alert("Success", "Profile completed successfully");
            router.replace("/(tabs)/profile");
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Profile update failed");
        } finally {
            setLoading(false);
        }
    };

    // DROPDOWN MODAL (REUSED FROM SIGNUP)
    const renderDropdown = (data, visible, onSelect, onClose, selectedValue) => (
        <Modal visible={visible} transparent animationType="fade">
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
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <AppBackground>
            <SafeAreaView style={styles.container}>
                <Text style={styles.title}>Complete Your Profile</Text>

                {/* USERNAME */}
                <Text style={styles.label}>Username (optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Choose a username"
                    value={username}
                    onChangeText={setUsername}
                />

                {/* PHONE */}
                <Text style={styles.label}>Mobile Number *</Text>
                <View style={styles.phoneContainer}>
                    <TouchableOpacity style={styles.countryBtn} onPress={() => setShowCountryModal(true)}>
                        <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                        <Ionicons name="chevron-down" size={16} />
                    </TouchableOpacity>

                    <Modal visible={showCountryModal} transparent animationType="fade">
                        <TouchableOpacity
                            style={styles.modalOverlay}
                            onPress={() => setShowCountryModal(false)}
                            activeOpacity={1}
                        >
                            <View style={styles.dropdownContainer}>
                                <FlatList
                                    data={COUNTRY_CODES}
                                    keyExtractor={(item) => item.code}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setSelectedCountry(item);
                                                setShowCountryModal(false);
                                            }}
                                        >
                                            <Text style={styles.dropdownItemText}>
                                                {item.flag} {item.dial}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        </TouchableOpacity>
                    </Modal>


                    <Text style={styles.callingCode}>{selectedCountry.dial}</Text>

                    <TextInput
                        placeholder="Enter mobile number"
                        keyboardType="number-pad"
                        style={styles.phoneInput}
                        value={phone}
                        onChangeText={setPhone}
                    />
                </View>

                {/* GENDER */}
                <Text style={styles.label}>Gender *</Text>
                <View style={styles.genderRow}>
                    {["Male", "Female"].map(g => (
                        <TouchableOpacity
                            key={g}
                            style={[styles.genderBox, gender === g && styles.genderSelected]}
                            onPress={() => setGender(g as any)}
                        >
                            <Text style={[styles.genderText, gender === g && styles.genderSelectedText]}>{g}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* DOB */}
                <Text style={styles.label}>Date of Birth *</Text>
                <View style={styles.dobRow}>
                    <TouchableOpacity style={styles.dobBox} onPress={() => setShowDayDropdown(true)}>
                        <Text>{day || "Day"}</Text>
                        <Ionicons name="chevron-down" size={16} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.dobBox} onPress={() => setShowMonthDropdown(true)}>
                        <Text>{month || "Month"}</Text>
                        <Ionicons name="chevron-down" size={16} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.dobBox} onPress={() => setShowYearDropdown(true)}>
                        <Text>{year || "Year"}</Text>
                        <Ionicons name="chevron-down" size={16} />
                    </TouchableOpacity>
                </View>

                {renderDropdown(days, showDayDropdown, setDay, () => setShowDayDropdown(false), day)}
                {renderDropdown(months, showMonthDropdown, setMonth, () => setShowMonthDropdown(false), month)}
                {renderDropdown(years, showYearDropdown, setYear, () => setShowYearDropdown(false), year)}

                {/* BUTTON */}
                <TouchableOpacity style={styles.btnWrapper} onPress={submitProfile}>
                    <LinearGradient colors={["#A855F7", "#EC4899"]} style={styles.btn}>
                        <Text style={styles.btnText}>{loading ? "Saving..." : "Complete Profile"}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </SafeAreaView>
        </AppBackground>
    );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
    container: { flex: 1, padding: 25 },
    title: { fontSize: 26, fontWeight: "700", textAlign: "center", marginBottom: 25 },
    label: { fontSize: 14, marginBottom: 6 },
    input: { backgroundColor: "#fff", borderRadius: 25, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 15 },

    genderRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
    genderBox: { flex: 1, marginHorizontal: 5, padding: 14, borderRadius: 25, borderWidth: 1, alignItems: "center" },
    genderSelected: { backgroundColor: "#A855F7", borderColor: "#A855F7" },
    genderText: { color: "#111" },
    genderSelectedText: { color: "#fff" },

    phoneContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 25, paddingHorizontal: 12, height: 50, marginBottom: 15 },
    countryBtn: { flexDirection: "row", alignItems: "center", marginRight: 6 },
    flagText: { fontSize: 22 },
    callingCode: { marginRight: 6 },
    phoneInput: { flex: 1 },

    countryDropdown: { position: "absolute", top: 52, left: 10, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, zIndex: 10 },

    dobRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
    dobBox: { flex: 1, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 25, height: 50, justifyContent: "center", alignItems: "center", marginHorizontal: 4, flexDirection: "row" },

    btnWrapper: { marginTop: 20, borderRadius: 30, overflow: "hidden" },
    btn: { paddingVertical: 15, alignItems: "center" },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    dropdownContainer: {
        backgroundColor: "#FFF",
        width: "80%",
        maxHeight: 320,
        borderRadius: 14,
        overflow: "hidden",
    },
    dropdownItem: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },

    dropdownItemText: {
        fontSize: 16,
        textAlign: "center",
    },
    selectedDropdownItem: { backgroundColor: "#F3F4F6" },
    selectedDropdownItemText: { color: "#A855F7", fontWeight: "600" },
});
