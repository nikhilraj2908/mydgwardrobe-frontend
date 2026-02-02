import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import api from "../../api/api";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "@/components/AppBackground";

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  bio?: string;
  mobile?: string;
  gender?: string;
  dob?: string;
  photo?: string;
  createdAt: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // User profile state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [mobile, setMobile] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const baseURL = api.defaults.baseURL!;



  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Please login again");
        router.push("/login");
        return;
      }

      const response = await api.get("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = response.data;
      setUserProfile(userData);

      // Set form values from API data
      setName(userData.username || "");
      setUsername(userData.username || "");
      setEmail(userData.email || "");
      setBio(userData.bio || "");
      setMobile(userData.mobile || "");
      setGender(userData.gender || "");

      // Set profile image if exists
      if (userData.photo) {
        setProfileImage(
          userData.photo.startsWith("http")
            ? userData.photo
            : `${baseURL}${userData.photo}`
        );
      }


      // Format date if exists
      if (userData.dob) {
        const date = new Date(userData.dob);
        setDob(date.toISOString().split('T')[0]); // Format as YYYY-MM-DD
      }

    } catch (error: any) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Failed to load profile data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  /* ================= IMAGE PICKERS ================= */
  const pickFromGallery = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert("Permission required", "Please grant permission to access your gallery");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
        exif: false, // Important: disable EXIF to avoid issues
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const pickFromCamera = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert("Permission required", "Please grant permission to use your camera");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
        exif: false, // Important: disable EXIF to avoid issues
      });

      if (!result.canceled) {
        setImage(result.assets[0]);
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  /* ================= SAVE PROFILE ================= */
  const handleSaveProfile = async () => {
    try {
      // Basic validation
      if (!name.trim()) {
        Alert.alert("Validation Error", "Name is required");
        return;
      }

      setSaving(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Please login again");
        router.push("/login");
        return;
      }

      // Create FormData for multipart/form-data request
      const formData = new FormData();

      // Add text fields to FormData
      formData.append('username', name.trim());
      if (bio.trim()) formData.append('bio', bio.trim());
      if (mobile.trim()) formData.append('mobile', mobile.trim());
      if (gender.trim()) formData.append('gender', gender.trim());
      if (dob.trim()) formData.append('dob', dob.trim());

      // Add image if selected - field name must be "photo" as per backend
      if (image) {
        // Get file extension from URI or filename
        let fileExtension = 'jpg';
        if (image.uri) {
          const uriParts = image.uri.split('.');
          fileExtension = uriParts[uriParts.length - 1].toLowerCase();
        }

        // Create file name
        const fileName = `profile_${Date.now()}.${fileExtension}`;

        // Determine mime type
        let mimeType = image.mimeType || 'image/jpeg';
        if (fileExtension === 'png') mimeType = 'image/png';
        if (fileExtension === 'gif') mimeType = 'image/gif';
        if (fileExtension === 'webp') mimeType = 'image/webp';

        // Get the file name from the image or use generated one
        const actualFileName = image.fileName || fileName;

        // Create the file object properly for React Native
        const fileObject = {
          uri: image.uri,
          type: mimeType,
          name: actualFileName,
        };

        // Append the image file with correct field name "photo"
        formData.append('photo', fileObject as any);

        console.log("Appending image:", {
          uri: image.uri.substring(0, 50) + "...", // Log partial URI
          type: mimeType,
          name: actualFileName,
          size: image.fileSize || 'unknown'
        });
      }

      console.log("Sending FormData with image:", image ? "Yes" : "No");

      // DEBUG: Log FormData contents
      // Note: Can't directly log FormData, but we can log what we added
      console.log("FormData text fields:", { name, bio, mobile, gender, dob });

      // Make API call to update profile with FormData
      // IMPORTANT: Use fetch directly instead of axios for better FormData handling
      const response = await fetch(`${baseURL}/api/user/me`, {

        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - fetch will set it automatically with boundary
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Update failed');
      }

      console.log("Profile update response:", responseData);

      Alert.alert("Success", "Profile updated successfully!");

      // Navigate back to profile page with refresh flag
      router.push({
        pathname: '/profile',
        params: { refresh: 'true', timestamp: Date.now().toString() }
      });

    } catch (error: any) {
      console.error("Error updating profile:", error);
      console.error("Error stack:", error.stack);

      let errorMessage = "Failed to update profile. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  /* ================= GET INITIALS ================= */
  const getInitials = (name: string) => {
    if (!name || name.trim() === "") return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  /* ================= GET IMAGE SOURCE ================= */
  const getImageSource = () => {
    if (profileImage) return { uri: profileImage };
    return null;
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A855F7" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>

      <AppBackground>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Profile</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Profile Picture */}
          <View style={styles.uploadBox}>
            <View style={styles.profileImageContainer}>
              {getImageSource() ? (
                <Image
                  source={getImageSource()!}
                  style={styles.profileImage}
                  onError={(e) => {
                    console.error("Error loading image:", e.nativeEvent.error);
                    // Fallback to initials if image fails to load
                  }}
                />
              ) : (
                <View style={[styles.profileImage, styles.placeholder]}>
                  <Text style={styles.avatarText}>
                    {getInitials(userProfile?.username || "U")}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={pickFromCamera}>
                <Ionicons name="camera-outline" size={16} color="#A855F7" />
                <Text style={styles.actionText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={pickFromGallery}>
                <Ionicons name="image-outline" size={16} color="#A855F7" />
                <Text style={styles.actionText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.imageNote}>
              {image ? "New image selected" : "Tap to change profile picture"}
            </Text>
          </View>

          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#999"
          />

          {/* Username */}
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor="#999"
          />

          {/* Email (Read-only) */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={email}
            editable={false}
            placeholderTextColor="#999"
          />

          {/* Bio / Description */}
          <Text style={styles.label}>Bio / Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            maxLength={200}
          />
          <Text style={styles.charCount}>{bio.length}/200 characters</Text>

          {/* Phone Number */}
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            placeholder="Enter phone number"
            placeholderTextColor="#999"
            maxLength={15}
          />

          {/* Gender */}
          <Text style={styles.label}>Gender</Text>
          <TextInput
            style={styles.input}
            value={gender}
            onChangeText={setGender}
            placeholder="Male/Female/Other"
            placeholderTextColor="#999"
          />

          {/* Date of Birth */}
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            value={dob}
            onChangeText={setDob}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </AppBackground>
    </SafeAreaView>

  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#ffffff77",
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F3E8FF",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  uploadBox: {
    alignItems: "center",
    marginBottom: 24,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#F3E8FF",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#A855F7",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 36,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: "row",
    backgroundColor: "#F3E8FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionText: {
    marginLeft: 6,
    fontWeight: "600",
    color: "#A855F7",
  },
  imageNote: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  label: {
    fontWeight: "600",
    marginBottom: 8,
    color: "#444",
    marginTop: 16,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#333",
  },
  readOnlyInput: {
    backgroundColor: "#F9FAFB",
    color: "#6B7280",
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: "#A855F7",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitBtnDisabled: {
    backgroundColor: "#C4B5FD",
    opacity: 0.8,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelBtn: {
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 16,
  },
});