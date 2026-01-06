import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../../api/api";

export default function AddStory() {
  const router = useRouter();

  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(5);
  const [uploading, setUploading] = useState(false);

  // Pick image or video
  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.3,
    });

    if (!result.canceled) {
      setSelectedMedia(result.assets[0]);
    }
  };

  // Upload story
  
const uploadStory = async () => {
  if (!selectedMedia) return;

  try {
    setUploading(true);

    const form = new FormData();

    if (Platform.OS === "web") {
      // WEB: blob → File
      const response = await fetch(selectedMedia.uri);
      const blob = await response.blob();

      const file = new File([blob], "story.jpg", {
        type: blob.type || "image/jpeg",
      });

      form.append("media", file);
    } else {
      // MOBILE: file:// URI
      form.append("media", {
        uri: selectedMedia.uri,
        name: selectedMedia.fileName ?? "story.jpg",
        type: selectedMedia.mimeType ?? "image/jpeg",
      } as any);
    }

    form.append("duration", String(selectedDuration));

    await api.post("/api/story", form, {
      headers: {
        // ⚠️ IMPORTANT: do NOT set boundary yourself
        "Content-Type": "multipart/form-data",
      },
    });

    router.back();
  } catch (err) {
    console.error("Story upload failed:", err);
  } finally {
    setUploading(false);
  }
};
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 12 }}>
        Add Story
      </Text>

      {/* Preview */}
      <TouchableOpacity
        onPress={pickMedia}
        style={{
          height: 320,
          backgroundColor: "#F3F3F3",
          borderRadius: 16,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {selectedMedia ? (
          <Image
            source={{ uri: selectedMedia.uri }}
            style={{ width: "100%", height: "100%", borderRadius: 16 }}
          />
        ) : (
          <Text>Select Image / Video</Text>
        )}
      </TouchableOpacity>

      {/* Duration */}
      <View style={{ flexDirection: "row", marginTop: 16 }}>
        {[5, 10, 15].map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setSelectedDuration(d)}
            style={{
              padding: 10,
              marginRight: 10,
              borderRadius: 20,
              backgroundColor:
                selectedDuration === d ? "#A855F7" : "#EEE",
            }}
          >
            <Text style={{ color: selectedDuration === d ? "#fff" : "#000" }}>
              {d}s
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Upload */}
      <TouchableOpacity
        onPress={uploadStory}
        disabled={uploading || !selectedMedia}
        style={{
          marginTop: 24,
          backgroundColor: "#A855F7",
          padding: 14,
          borderRadius: 12,
          opacity: uploading ? 0.6 : 1,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center", fontSize: 16 }}>
          {uploading ? "Uploading..." : "Share Story"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  previewBox: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "#f4f4f4",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },

  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  placeholder: {
    alignItems: "center",
  },

  placeholderText: {
    marginTop: 8,
    color: "#777",
  },

  durationRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 16,
  },

  durationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: 6,
  },

  durationActive: {
    backgroundColor: "#A855F7",
    borderColor: "#A855F7",
  },

  durationText: {
    color: "#444",
  },

  durationTextActive: {
    color: "#fff",
    fontWeight: "600",
  },

  uploadBtn: {
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
