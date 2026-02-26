import api from "@/api/api";
import AppBackground from "@/components/AppBackground";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/app/theme/ThemeContext";

interface PremiumRequest {
  _id: string;
  status: "pending" | "approved" | "rejected";
  requester: {
    _id: string;
    username: string;
    photo?: string;
  };
  item: {
    wardrobe?: { name: string };
  };
  createdAt: string;
  updatedAt?: string;
}

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function PremiumRequestsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PremiumRequest[]>([]);
  const [approved, setApproved] = useState<PremiumRequest[]>([]);

  const loadRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const pendingRes = await api.get("/api/premium/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPending(pendingRes.data || []);

      const approvedRes = await api.get("/api/premium/approved-by-me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApproved(approvedRes.data?.approvals || []);
    } catch (err) {
      console.log("Failed to load premium requests", err);
    } finally {
      setLoading(false);
    }
  };

  const respond = async (requestId: string, action: "approve" | "reject") => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      await api.post(
        "/api/premium/respond",
        { requestId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", `Request ${action}d`);
      loadRequests();
    } catch (err) {
      Alert.alert("Error", "Action failed");
    }
  };

  const revoke = (requestId: string, username: string) => {
    Alert.alert(
      "Revoke Premium Access",
      `Are you sure you want to revoke premium access for ${username}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Revoke",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) return;

              await api.post(
                "/api/premium/revoke",
                { requestId },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              Alert.alert("Access revoked successfully");
              loadRequests();
            } catch {
              Alert.alert("Failed to revoke access");
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadRequests();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <AppBackground>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium Access Requests</Text>
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          {/* PENDING */}
          <Text style={styles.sectionTitle}>
            Pending Requests ({pending.length})
          </Text>

          {pending.length === 0 && (
            <Text style={styles.emptyText}>No pending requests</Text>
          )}

          {pending.map((req) => (
            <View key={req._id} style={styles.card}>
              <View style={styles.row}>
                {req.requester.photo ? (
                  <Image
                    source={{ uri: resolveImageUrl(req.requester.photo) }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>
                      {req.requester.username[0].toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{req.requester.username}</Text>
                  <Text style={styles.subText}>
                    Wants access to{" "}
                    <Text style={{ fontWeight: "600" }}>
                      {req.item?.wardrobe?.name || "Premium Collection"}
                    </Text>
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.btn, styles.approve]}
                  onPress={() => respond(req._id, "approve")}
                >
                  <Ionicons name="checkmark" color="#fff" size={16} />
                  <Text style={styles.btnText}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.reject]}
                  onPress={() => respond(req._id, "reject")}
                >
                  <Ionicons name="close" color="#fff" size={16} />
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* APPROVED */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            Approved Users ({approved.length})
          </Text>

          {approved.length === 0 && (
            <Text style={styles.emptyText}>No approved users yet</Text>
          )}

          {approved.map((req) => (
            <View key={req._id} style={[styles.card, styles.approvedCard]}>
              <View style={styles.row}>
                {req.requester.photo ? (
                  <Image
                    source={{ uri: resolveImageUrl(req.requester.photo) }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>
                      {req.requester.username[0].toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{req.requester.username}</Text>
                  <Text style={styles.subText}>
                    Access to{" "}
                    <Text style={{ fontWeight: "600" }}>
                      {req.item?.wardrobe?.name || "Premium Item"}
                    </Text>
                  </Text>
                  <Text style={styles.subText}>
                    Approved on {formatDateTime(req.updatedAt || req.createdAt)}
                  </Text>
                </View>

                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <TouchableOpacity onPress={() => revoke(req._id, req.requester.username)}>
                  <Ionicons name="close-circle" size={20} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      // padding: 16,
      gap: 12,
      backgroundColor: colors.background,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    container: {
      padding: 16,
      paddingBottom: 40,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textPrimary,
      marginVertical: 12,
    },
    emptyText: {
      color: colors.textMuted,
      marginBottom: 10,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    approvedCard: {
      backgroundColor: colors.surface,
      borderColor: colors.success,
    },
    row: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },
    avatarFallback: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      color: colors.primaryDark,
      fontWeight: "700",
      fontSize: 16,
    },
    name: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    subText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    actions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 14,
    },
    btn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
    },
    approve: {
      backgroundColor: colors.success, // #22C55E
    },
    reject: {
      backgroundColor: colors.danger, // #EF4444
    },
    btnText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: 14,
    },
  });