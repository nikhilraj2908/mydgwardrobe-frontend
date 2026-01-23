import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  Platform,
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
  const [networkError, setNetworkError] = useState<string | null>(null);

  /* ================= TEST API CONNECTION ================= */
  const testAPI = async () => {
    try {
      console.log("🔗 Testing connection to:", API_URL);
      const response = await fetch(`${API_URL}/health`);
      const text = await response.text();
      console.log("API Health check:", text);
      setNetworkError(null);
    } catch (error) {
      console.error("❌ API Connection failed:", error);
      setNetworkError("Cannot connect to server. Please check your internet connection.");
    }
  };

  useEffect(() => {
    testAPI();
  }, []);

  /* ================= PICK IMAGE / VIDEO ================= */
  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Media access is needed");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.4,
      videoMaxDuration: 15,
      allowsEditing: false,
      base64: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      console.log("📸 Selected media:", {
        uri: asset.uri,
        type: asset.type,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        fileSize: asset.fileSize,
      });
      setSelectedMedia(asset);
    }
  };

  /* ================= FIX: Create proper file object for React Native ================= */
  const createFormData = () => {
    if (!selectedMedia) return null;

    const formData = new FormData();
    
    // Get file extension
    let fileExtension = 'jpg';
    if (selectedMedia.uri.includes('.mp4') || selectedMedia.type === 'video') {
      fileExtension = 'mp4';
    } else if (selectedMedia.uri.includes('.png')) {
      fileExtension = 'png';
    } else if (selectedMedia.uri.includes('.jpeg')) {
      fileExtension = 'jpeg';
    }

    // Create file name
    const fileName = selectedMedia.fileName || 
      `story_${Date.now()}.${fileExtension}`;

    // Determine MIME type
    let mimeType = selectedMedia.mimeType;
    if (!mimeType) {
      mimeType = selectedMedia.type === 'video' 
        ? 'video/mp4' 
        : selectedMedia.type === 'image' 
          ? 'image/jpeg' 
          : 'application/octet-stream';
    }

    console.log("📁 File info:", { fileName, mimeType, uri: selectedMedia.uri });

    // ✅ CRITICAL FIX: Format the file object correctly for React Native
    const fileObject = {
      uri: selectedMedia.uri,
      name: fileName,
      type: mimeType,
    };

    formData.append("media", fileObject as any);
    formData.append("duration", String(selectedDuration));

    return formData;
  };

  /* ================= UPLOAD STORY ================= */
  const uploadStory = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Story upload is available only on mobile");
      return;
    }
    
    if (!selectedMedia) {
      Alert.alert("No Media", "Please select an image or video first");
      return;
    }

    try {
      setUploading(true);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Authentication Required", "Please login again");
        router.replace("/login");
        return;
      }

      const formData = createFormData();
      if (!formData) {
        throw new Error("Failed to create form data");
      }

      console.log("🚀 Uploading to:", `${API_URL}/api/story`);
      console.log("🔑 Token present:", !!token);

      // ✅ OPTION 1: Using fetch with better error handling
      const res = await fetch(`${API_URL}/api/story`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          // Let FormData set Content-Type automatically
        },
        body: formData,
      });

      // First get response as text
      const responseText = await res.text();
      console.log("📨 Response status:", res.status);
      console.log("📨 Response text (first 500 chars):", responseText.substring(0, 500));

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Failed to parse JSON:", parseError);
        console.error("Raw response was:", responseText);
        
        // Check if it's an HTML error page
        if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
          throw new Error("Server returned HTML error page. Check backend logs.");
        } else {
          throw new Error(`Server returned invalid response: ${responseText.substring(0, 100)}`);
        }
      }

      if (!res.ok) {
        throw new Error(data.message || `Upload failed with status ${res.status}`);
      }

      Alert.alert("Success ✅", "Your story has been uploaded!");
      router.back();
    } catch (err: any) {
      console.error("❌ Story upload failed:", err);
      
      // More specific error messages
      let errorMessage = err.message || "Network error";
      
      if (err.message.includes('Network request failed')) {
        errorMessage = "Network connection failed. Check your internet.";
      } else if (err.message.includes('JSON Parse')) {
        errorMessage = "Server returned invalid response. Please try again.";
      } else if (err.message.includes('HTML error page')) {
        errorMessage = "Server error. Please contact support.";
      }
      
      Alert.alert("Upload Failed", errorMessage);
    } finally {
      setUploading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Story</Text>

      {networkError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{networkError}</Text>
        </View>
      )}

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
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>
              Tap to select Image or Video
            </Text>
            <Text style={styles.placeholderSubtext}>
              (Max 15 seconds for videos)
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {selectedMedia && (
        <View style={styles.mediaInfo}>
          <Text style={styles.mediaInfoText}>
            Selected: {selectedMedia.type === 'video' ? 'Video' : 'Image'} • 
            Size: {selectedMedia.fileSize ? `${Math.round(selectedMedia.fileSize / 1024)}KB` : 'Unknown'}
          </Text>
        </View>
      )}

      {/* Duration */}
      <View style={styles.durationSection}>
        <Text style={styles.durationLabel}>Story Duration:</Text>
        <View style={styles.durationRow}>
          {[5, 10, 15].map((d) => (
            <TouchableOpacity
              key={d}
              style={[
                styles.durationChip,
                selectedDuration === d && styles.durationActive,
              ]}
              onPress={() => setSelectedDuration(d)}
              disabled={uploading}
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
      </View>

      {/* Upload Button */}
      <TouchableOpacity
        style={[
          styles.uploadBtn,
          (!selectedMedia || uploading) && styles.uploadBtnDisabled,
        ]}
        onPress={uploadStory}
        disabled={!selectedMedia || uploading}
      >
        {uploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.uploadingText}>Uploading...</Text>
          </View>
        ) : (
          <Text style={styles.uploadText}>Share Story</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelBtn}
        onPress={() => router.back()}
        disabled={uploading}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  errorBox: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EF5350",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
  },
  previewBox: {
    height: 320,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  placeholderText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  placeholderSubtext: {
    color: "#999",
    fontSize: 12,
  },
  mediaInfo: {
    marginTop: 8,
    paddingHorizontal: 8,
  },
  mediaInfoText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
  },
  durationSection: {
    marginTop: 24,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  durationChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 6,
  },
  durationActive: {
    backgroundColor: "#A855F7",
  },
  durationText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  durationTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  uploadBtn: {
    marginTop: 32,
    backgroundColor: "#A855F7",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadBtnDisabled: {
    backgroundColor: "#D1C4E9",
    shadowOpacity: 0,
  },
  uploadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  uploadingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  uploadText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cancelText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
});