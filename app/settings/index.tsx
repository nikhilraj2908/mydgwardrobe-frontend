import AppBackground from "@/components/AppBackground";
import WardrobeHeader from "@/components/WardrobeHeader";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/app/theme/ThemeContext";
import { useMemo } from "react";

const settingsPage = () => {
    const { user } = useAuth();
    const isGoogleUser = user?.authProvider === "google";
    const { theme } = useTheme();
    const colors = theme.colors;
    const styles = useMemo(() => createStyles(colors), [colors]);

    const handleBackNavigation = () => {
        router.back();
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
            <AppBackground>
                <WardrobeHeader title="Settings" onBack={handleBackNavigation} />
                <ScrollView contentContainerStyle={styles.container}>
                    <Text style={styles.heading}>Settings</Text>
                    <Text style={styles.introText}>
                        Manage your account, preferences, and more.
                    </Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account</Text>
                        {isGoogleUser ? (
                            <View style={styles.settingOption}>
                                <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
                                <Text style={[styles.text, { color: colors.textMuted }]}>
                                    Password managed by Google account
                                </Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.settingOption}
                                onPress={() => router.push("/change-password")}
                            >
                                <Ionicons name="key-outline" size={20} color={colors.primary} />
                                <Text style={styles.text}>Change Password</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity style={styles.settingOption}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
                            <Text style={styles.text}>Privacy Settings</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingOption}>
                            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
                            <Text style={styles.text}>Notification Preferences</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.settingOption}
                            onPress={() => router.push("/theme-settings")}
                        >
                            <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
                            <Text style={styles.text}>App Theme</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Support</Text>
                        <TouchableOpacity style={styles.settingOption}>
                            <Ionicons name="mail-outline" size={20} color={colors.primary} />
                            <Text style={styles.text}>Contact Us</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingOption}>
                            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                            <Text style={styles.text}>Terms of Service</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.settingOption}>
                            <Ionicons name="shield-outline" size={20} color={colors.primary} />
                            <Text style={styles.text}>Privacy Policy</Text>
                        </TouchableOpacity>
                        <Text style={styles.text}>App Version: 1.0.0</Text>
                        <Text style={styles.text}>Managed and created by - Alogicdata</Text>
                        <Text style={styles.text}>© 2026 Alogic Data. All rights reserved.</Text>
                    </View>
                </ScrollView>
            </AppBackground>
        </SafeAreaView>
    );
};

const createStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            padding: 20,
        },
        heading: {
            fontSize: 26,
            fontWeight: "bold",
            color: colors.textPrimary,
            marginBottom: 15,
        },
        introText: {
            fontSize: 16,
            color: colors.textSecondary,
            marginBottom: 20,
        },
        section: {
            marginBottom: 20,
        },
        sectionTitle: {
            fontSize: 20,
            fontWeight: "bold",
            color: colors.textPrimary,
            marginBottom: 10,
        },
        settingOption: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            marginBottom: 10,
        },
        text: {
            fontSize: 16,
            color: colors.textPrimary,
            marginLeft: 12,
        },
    });

export default settingsPage;