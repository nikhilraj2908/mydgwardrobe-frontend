import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import api from "@/api/api";
import AppBackground from "@/components/AppBackground";
import { SafeAreaView } from "react-native-safe-area-context";
import { resolveImageUrl } from "@/utils/resolveImageUrl";

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
}

export default function PremiumRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<PremiumRequest[]>([]);

  const loadRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/api/premium/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRequests(res.data || []);
    } catch (err) {
      console.log("Failed to load premium requests", err);
    } finally {
      setLoading(false);
    }
  };

  const respond = async (
    requestId: string,
    action: "approve" | "reject"
  ) => {
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

  useEffect(() => {
    loadRequests();
  }, []);

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  return (
    <AppBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} />
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
                  <Text style={styles.name}>
                    {req.requester.username}
                  </Text>
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
          <Text style={styles.sectionTitle}>
            Approved ({approved.length})
          </Text>

          {approved.map((req) => (
            <View key={req._id} style={[styles.card, styles.approvedCard]}>
              <Text style={styles.name}>
                {req.requester.username}
              </Text>
              <Text style={styles.subText}>
                Approved for{" "}
                {req.item?.wardrobe?.name || "Premium Collection"}
              </Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  container: {
    padding: 16,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginVertical: 12,
  },

  emptyText: {
    color: "#777",
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#F9F5FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },

  approvedCard: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
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
    backgroundColor: "#A855F7",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  name: {
    fontSize: 15,
    fontWeight: "600",
  },

  subText: {
    fontSize: 13,
    color: "#555",
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

  approve: { backgroundColor: "#10B981" },
  reject: { backgroundColor: "#EF4444" },

  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
