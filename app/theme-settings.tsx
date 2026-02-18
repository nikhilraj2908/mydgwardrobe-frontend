import AppBackground from "@/components/AppBackground";
import WardrobeHeader from "@/components/WardrobeHeader";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/app/theme/ThemeContext";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMemo } from "react";

const THEMES = [
  { id: "light", label: "Light Theme", icon: "sunny-outline" },
  { id: "dark", label: "Dark Theme", icon: "moon-outline" },
  { id: "blue", label: "Blue Theme", icon: "color-palette-outline" },
];

export default function ThemeSettings() {
  const { setThemeById, currentId, theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSelect = (id: string) => {
    setThemeById(id);
  };

  const handleBack = () => router.back();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBackground>
        <WardrobeHeader title="App Theme" onBack={handleBack} />

        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.heading}>Choose Theme</Text>
          <Text style={styles.subText}>
            Select the appearance of your DigiWardrobe app.
          </Text>

          {THEMES.map((themeOption) => {
            const active = currentId === themeOption.id;

            return (
              <TouchableOpacity
                key={themeOption.id}
                style={[styles.option, active && styles.activeOption]}
                onPress={() => handleSelect(themeOption.id)}
              >
                <View style={styles.row}>
                  <Ionicons
                    name={themeOption.icon as any}
                    size={22}
                    color={active ? colors.primary : colors.textSecondary}
                  />

                  <Text style={[styles.text, active && styles.activeText]}>
                    {themeOption.label}
                  </Text>
                </View>

                {active && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      padding: 20,
    },
    heading: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.textPrimary,
      marginBottom: 8,
    },
    subText: {
      fontSize: 15,
      color: colors.textSecondary,
      marginBottom: 25,
    },
    option: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.card,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeOption: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    text: {
      fontSize: 16,
      marginLeft: 12,
      color: colors.textPrimary,
    },
    activeText: {
      color: colors.primary,
      fontWeight: "600",
    },
  });