import AppBackground from "@/components/AppBackground";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ImagePicker from 'react-native-image-crop-picker';
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/api";
import { useTheme } from "@/app/theme/ThemeContext";

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
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => createStyles(colors), [colors]);

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

      setName(userData.username || "");
      setUsername(userData.username || "");
      setEmail(userData.email || "");
      setBio(userData.bio || "");
      setMobile(userData.mobile || "");
      setGender(userData.gender || "");

      if (userData.photo) {
        setProfileImage(resolveImageUrl(userData.photo));
      }

      if (userData.dob) {
        const date = new Date(userData.dob);
        setDob(date.toISOString().split('T')[0]);
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

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.openPicker({
        cropping: true,
        freeStyleCropEnabled: true,
        enableRotationGesture: true,
        mediaType: 'photo',
        compressImageQuality: 0.6,
      });

      if (result?.path) {
        const fileObj = {
          uri: result.path,
          name: result.filename || `profile_${Date.now()}.jpg`,
          type: result.mime || 'image/jpeg',
        };
        setImage(fileObj);
        setProfileImage(result.path);
      }
    } catch (err: any) {
      if (err.code !== 'E_PICKER_CANCELLED') {
        console.error('Gallery Picker Error:', err);
        Alert.alert('Error', 'Failed to pick image. Try again.');
      }
    }
  };

  const pickFromCamera = async () => {
    try {
      const result = await ImagePicker.openCamera({
        cropping: true,
        freeStyleCropEnabled: true,
        enableRotationGesture: true,
        mediaType: 'photo',
        compressImageQuality: 0.6,
      });

      if (result?.path) {
        const fileObj = {
          uri: result.path,
          name: result.filename || `profile_${Date.now()}.jpg`,
          type: result.mime || 'image/jpeg',
        };
        setImage(fileObj);
        setProfileImage(result.path);
      }
    } catch (err: any) {
      if (err.code !== 'E_PICKER_CANCELLED') {
        console.error('Camera Picker Error:', err);
        Alert.alert('Error', 'Failed to capture photo. Try again.');
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
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

      const formData = new FormData();
      formData.append('username', name.trim());
      if (bio.trim()) formData.append('bio', bio.trim());
      if (mobile.trim()) formData.append('mobile', mobile.trim());
      if (gender.trim()) formData.append('gender', gender.trim());
      if (dob.trim()) formData.append('dob', dob.trim());

      if (image) {
        let fileExtension = 'jpg';
        if (image.uri) {
          const uriParts = image.uri.split('.');
          fileExtension = uriParts[uriParts.length - 1].toLowerCase();
        }
        const fileName = `profile_${Date.now()}.${fileExtension}`;
        let mimeType = image.mimeType || 'image/jpeg';
        if (fileExtension === 'png') mimeType = 'image/png';
        if (fileExtension === 'gif') mimeType = 'image/gif';
        if (fileExtension === 'webp') mimeType = 'image/webp';
        const actualFileName = image.fileName || fileName;
        const fileObject = {
          uri: image.uri,
          type: mimeType,
          name: actualFileName,
        };
        formData.append('photo', fileObject as any);
      }

      const response = await fetch(`${baseURL}/api/user/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Update failed');
      }

      Alert.alert("Success", "Profile updated successfully!");
      router.push({
        pathname: '/profile',
        params: { refresh: 'true', timestamp: Date.now().toString() }
      });

    } catch (error: any) {
      console.error("Error updating profile:", error);
      let errorMessage = "Failed to update profile. Please try again.";
      if (error.message) errorMessage = error.message;
      else if (error.response?.data?.message) errorMessage = error.response.data.message;
      else if (error.response?.data?.error) errorMessage = error.response.data.error;
      Alert.alert("Error", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name || name.trim() === "") return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  const getImageSource = () => {
    if (profileImage) return { uri: profileImage };
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top","bottom"]}>
      <AppBackground>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
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
                  onError={(e) => console.error("Error loading image:", e.nativeEvent.error)}
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
                <Ionicons name="camera-outline" size={16} color={colors.primary} />
                <Text style={styles.actionText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={pickFromGallery}>
                <Ionicons name="image-outline" size={16} color={colors.primary} />
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
            placeholderTextColor={colors.textMuted}
          />

          {/* Username */}
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor={colors.textMuted}
          />

          {/* Email (Read-only) */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={email}
            editable={false}
            placeholderTextColor={colors.textMuted}
          />

          {/* Bio / Description */}
          <Text style={styles.label}>Bio / Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor={colors.textMuted}
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
            placeholderTextColor={colors.textMuted}
            maxLength={15}
          />

          {/* Gender */}
          <Text style={styles.label}>Gender</Text>
          <TextInput
            style={styles.input}
            value={gender}
            onChangeText={setGender}
            placeholder="Male/Female/Other"
            placeholderTextColor={colors.textMuted}
          />

          {/* Date of Birth */}
          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            value={dob}
            onChangeText={setDob}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primaryDark} />
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

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      // backgroundColor: colors.background,
      paddingTop: 0,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 12,
      color: colors.textSecondary,
      fontSize: 16,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      // marginBottom: 24,
      marginTop: 8,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.card,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
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
      borderColor: colors.card,
    },
    placeholder: {
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.primary,
    },
    avatarText: {
      color: colors.primaryDark,
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
      backgroundColor: colors.card,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      marginHorizontal: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionText: {
      marginLeft: 6,
      fontWeight: "600",
      color: colors.primary,
    },
    imageNote: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: "center",
    },
    label: {
      fontWeight: "600",
      marginBottom: 8,
      color: colors.textSecondary,
      marginTop: 16,
      fontSize: 14,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      backgroundColor: colors.surface,
      fontSize: 16,
      color: colors.textPrimary,
    },
    readOnlyInput: {
      backgroundColor: colors.card,
      color: colors.textMuted,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    charCount: {
      textAlign: 'right',
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
    submitBtn: {
      backgroundColor: colors.primary,
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
      backgroundColor: colors.middary,
      opacity: 0.8,
    },
    submitText: {
      color: colors.textLight,
      fontWeight: "700",
      fontSize: 16,
    },
    cancelBtn: {
      padding: 16,
      borderRadius: 30,
      alignItems: "center",
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelText: {
      color: colors.textMuted,
      fontWeight: "600",
      fontSize: 16,
    },
  });