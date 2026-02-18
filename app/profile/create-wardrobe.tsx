import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import api from "../../api/api";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "@/components/AppBackground";
import { useTheme } from "@/app/theme/ThemeContext";

const COLORS = [
  "#F97316",
  "#34D399",
  "#C084FC",
  "#FACC15",
  "#7C3AED",
  "#F472B6",
  "#38BDF8",
  "#FBBF24",
];

export default function CreateWardrobe() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const wardrobeId = params.id as string | undefined;
  const isEditMode = !!wardrobeId;
  const [name, setName] = useState(params.name?.toString() || "");
  const [color, setColor] = useState(
    params.color?.toString() || COLORS[0]
  );
  const [loading, setLoading] = useState(false);

  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const submitWardrobe = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Wardrobe name is required");
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Please login again");
        return;
      }

      if (isEditMode) {
        await api.put(
          `/api/wardrobe/${wardrobeId}`,
          { name, color },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        Alert.alert("Success", "Wardrobe updated");
      } else {
        await api.post(
          "/api/wardrobe/create",
          { name, color },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        Alert.alert("Success", "Wardrobe created");
      }

      router.back();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message || "Operation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <AppBackground>
        <ScrollView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {isEditMode ? "Edit Wardrobe" : "Create Wardrobe"}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Name */}
          <Text style={styles.label}>Wardrobe Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Summer Collection"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          {/* Color */}
          <Text style={styles.label}>Choose Color</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorBox,
                  { backgroundColor: c },
                  color === c && styles.activeColor,
                ]}
                onPress={() => setColor(c)}
              >
                {color === c && (
                  <Ionicons name="checkmark" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Preview */}
          <Text style={styles.label}>Preview</Text>
          <View style={[styles.previewCard, { backgroundColor: color + "33" }]}>
            <View style={[styles.previewIcon, { backgroundColor: color }]} />
            <View>
              <Text style={styles.previewName}>{name || "Wardrobe"}</Text>
              <Text style={styles.previewCount}>0 items</Text>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={submitWardrobe}
            disabled={loading}
          >
            <Text style={styles.submitText}>
              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                  ? "Update Wardrobe"
                  : "Create Wardrobe"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    label: {
      fontWeight: "600",
      marginBottom: 8,
      marginTop: 12,
      color: colors.textSecondary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 14,
      backgroundColor: colors.surface,
      color: colors.textPrimary,
    },
    colorGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 8,
    },
    colorBox: {
      width: 60,
      height: 60,
      borderRadius: 16,
      margin: 6,
      justifyContent: "center",
      alignItems: "center",
    },
    activeColor: {
      borderWidth: 3,
      borderColor: colors.primary, // or use black if preferred, but primary works
    },
    previewCard: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 16,
      padding: 16,
      marginTop: 10,
    },
    previewIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      marginRight: 12,
    },
    previewName: {
      fontWeight: "700",
      color: colors.textPrimary,
    },
    previewCount: {
      color: colors.textSecondary,
      marginTop: 4,
    },
    submitBtn: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 30,
      alignItems: "center",
      marginTop: 30,
    },
    submitBtnDisabled: {
      opacity: 0.5,
    },
    submitText: {
      color: colors.textLight,
      fontWeight: "700",
    },
  });