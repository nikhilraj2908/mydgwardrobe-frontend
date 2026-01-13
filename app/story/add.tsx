import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";

/* ================= SAFE API URL ================= */
const API_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ??
  Constants.manifest?.extra?.apiBaseUrl ??
  "";

if (!API_URL) {
  console.warn("⚠️ API base URL is not defined");
}

export default function AddStory() {
  const router = useRouter();

  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(5);
  const [uploading, setUploading] = useState(false);

  /* ================= PICK IMAGE / VIDEO ================= */
  const pickMedia = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission required", "Media access is needed");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
     mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.4,
      videoMaxDuration: 15,
    });

    if (!result.canceled) {
      setSelectedMedia(result.assets[0]);
    }
  };

  /* ================= UPLOAD STORY ================= */
  const uploadStory = async () => {
    if (!selectedMedia) return;

    try {
      setUploading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Not authenticated");

      const formData = new FormData();

      formData.append("media", {
        uri: selectedMedia.uri,
        name:
          selectedMedia.fileName ||
          `story_${Date.now()}.${
            selectedMedia.type === "video" ? "mp4" : "jpg"
          }`,
        type:
          selectedMedia.mimeType ||
          (selectedMedia.type === "video"
            ? "video/mp4"
            : "image/jpeg"),
      } as any);

      formData.append("duration", String(selectedDuration));

      const res = await fetch(`${API_URL}/api/story`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // ❌ DO NOT SET Content-Type
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Story upload failed");
      }

      Alert.alert("Success", "Story uploaded");
      router.back();
    } catch (err: any) {
      console.error("❌ Story upload failed:", err);
      Alert.alert("Upload Failed", err.message || "Network error");
    } finally {
      setUploading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Story</Text>

      {/* Preview */}
      <TouchableOpacity
        style={styles.previewBox}
        onPress={pickMedia}
        disabled={uploading}
      >
        {selectedMedia ? (
          <Image
            source={{ uri: selectedMedia.uri }}
            style={styles.previewImage}
          />
        ) : (
          <Text style={styles.placeholderText}>
            Select Image / Video
          </Text>
        )}
      </TouchableOpacity>

      {/* Duration */}
      <View style={styles.durationRow}>
        {[5, 10, 15].map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.durationChip,
              selectedDuration === d && styles.durationActive,
            ]}
            onPress={() => setSelectedDuration(d)}
          >
            <Text
              style={[
                styles.durationText,
                selectedDuration === d && styles.durationTextActive,
              ]}
            >
              {d}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Upload */}
      <TouchableOpacity
        style={styles.uploadBtn}
        onPress={uploadStory}
        disabled={!selectedMedia || uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadText}>Share Story</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },

  previewBox: {
    height: 320,
    borderRadius: 16,
    backgroundColor: "#F3F3F3",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  placeholderText: {
    color: "#777",
  },

  durationRow: {
    flexDirection: "row",
    marginTop: 16,
  },

  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#EEE",
    marginRight: 10,
  },

  durationActive: {
    backgroundColor: "#A855F7",
  },

  durationText: {
    color: "#000",
  },

  durationTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  uploadBtn: {
    marginTop: 24,
    backgroundColor: "#A855F7",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  uploadText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
