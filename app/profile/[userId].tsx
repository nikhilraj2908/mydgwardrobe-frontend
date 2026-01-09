import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import api from "../../api/api";
import WardrobeHeader from "@/components/WardrobeHeader";
import { useFollow } from "@/context/FollowContext";
const baseURL = api.defaults.baseURL;

interface User {
  _id: string;
  username: string;
  bio?: string;
  photo?: string;
}

interface Wardrobe {
  _id: string;
  name: string;
  itemCount: number;
  totalWorth: number;
}

export default function OtherUserProfile() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"wardrobes" | "items">("wardrobes");
  const [followersCount, setFollowersCount] = useState(0);


  const { isFollowing, toggleFollow, ready } = useFollow();

  const isSelf = false; // default
  const followed = ready && user?._id ? isFollowing(String(user._id)) : false;

  const handleFollowToggle = async () => {
    if (!user?._id) return;
    await toggleFollow(String(user._id));
  };

  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      try {
        // 🔐 Get logged-in user
        const token = await AsyncStorage.getItem("token");

        if (token) {
          const meRes = await api.get("/api/user/me", {
            headers: { Authorization: `Bearer ${token}` },
          });

          // ✅ IF SELF PROFILE → REDIRECT
          if (meRes.data?._id === userId) {
            router.replace("/profile");
            return;
          }
        }


        // 👤 OTHER USER PROFILE
        const userRes = await api.get(`/api/user/${userId}`);
        setUser(userRes.data);

        // 🔥 FETCH FOLLOWER COUNT
        const followCountRes = await api.get(
          `/api/follow/counts/${userId}`
        );
        setFollowersCount(followCountRes.data.followers || 0);
        const wardrobeRes = await api.get(
          `/api/collections/${userId}/wardrobes`
        );

        setWardrobes(wardrobeRes.data.wardrobes || []);
      } catch (err) {
        console.log("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  if (!user) {
    return <Text>User not found</Text>;
  }

  const totalWorth = wardrobes.reduce(
    (sum, w) => sum + (w.totalWorth || 0),
    0
  );

  return (
    <View style={styles.container}>
      {/* Fixed Header at the top */}
      <WardrobeHeader
        onBack={() => router.back()}
        title="Explore"
        showFilters={false}
      />

      {/* Scrollable content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* USER HEADER */}
        <View style={styles.userCard}>
          {user.photo ? (
            <Image
              source={{ uri: `${baseURL}${user.photo}` }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>
                {user.username[0]?.toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.userInfo}>
            {/* NAME + FOLLOW ROW */}
            <View style={styles.nameRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user.username.toUpperCase()}</Text>
                <Text style={styles.handle}>@{user.username}</Text>
              </View>

              {ready && (
                <TouchableOpacity
                  style={[
                    styles.followBtnInline,
                    followed && styles.followingBtn,
                  ]}
                  onPress={handleFollowToggle}
                >
                  <Ionicons
                    name={followed ? "checkmark" : "person-add-outline"}
                    size={14}
                    color="#fff"
                  />
                  <Text style={styles.followText}>
                    {followed ? "Following" : "Follow"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* BIO */}
            <Text style={styles.bio}>{user.bio || "No bio available"}</Text>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <Stat label="Collection Worth" value={`₹${totalWorth}`} />
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() =>
              router.push(
                `/profile/followers?userId=${userId}&tab=followers`
              )
            }
          >
            <Stat label="Followers" value={followersCount} />
          </TouchableOpacity>

          <Stat label="Wardrobes" value={wardrobes.length} />
        </View>

        {/* MY WARDROBES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Wardrobes</Text>
        </View>

        {/* ALL WARDROBE ITEMS */}
        <TouchableOpacity
          style={styles.wardrobeCard}
          onPress={() =>
            router.push(`/wardrobe/items?userId=${userId}`)
          }
        >
          <View style={styles.wardrobeIcon} />
          <View style={styles.wardrobeInfo}>
            <Text style={styles.wardrobeName}>All Wardrobe Items</Text>
            <Text style={styles.itemsCount}>
              {wardrobes.reduce((s, w) => s + (Number(w.itemCount) || 0), 0)} items

            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#777" />
        </TouchableOpacity>

        {/* INDIVIDUAL WARDROBES */}
        {wardrobes.map((w) => (
          <TouchableOpacity
            key={w._id}
            style={styles.wardrobeCard}
            onPress={() =>
              router.push(`/wardrobe/${w._id}?public=true`)
            }
          >
            <View style={styles.wardrobeIcon} />
            <View style={styles.wardrobeInfo}>
              <Text style={styles.wardrobeName}>{w.name}</Text>
              <Text style={styles.itemsCount}>
                {Number(w.itemCount) || 0} items
              </Text>
            </View>
            <Text style={styles.price}>₹{w.totalWorth}</Text>
            <Ionicons name="chevron-forward" size={22} color="#777" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

/* ---------- SMALL COMPONENT ---------- */
const Stat = ({ label, value }: any) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  userCard: {
    flexDirection: "row",
    marginBottom: 24,
    alignItems: "center",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35
  },
  avatarFallback: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#A855F7",
    justifyContent: "center",
    alignItems: "center"
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700"
  },

  userInfo: {
    flex: 1,
    marginLeft: 16
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  handle: {
    color: "#777",
    marginVertical: 2,
    fontSize: 14,
  },
  bio: {
    color: "#444",
    fontSize: 14,
    marginTop: 4,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,

  },
  statBox: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 8,
  },
  statValue: {
    fontWeight: "700",
    fontSize: 18,
    color: "#1A1A1A",
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },

  sectionHeader: {
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  wardrobeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  wardrobeIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#A855F7",
    borderRadius: 12,
    marginRight: 12,
  },
  wardrobeInfo: {
    flex: 1
  },
  wardrobeName: {
    fontWeight: "700",
    fontSize: 14,
    color: "#1A1A1A",
    marginBottom: 2,
  },
  itemsCount: {
    fontSize: 13,
    color: "#777"
  },
  price: {
    marginRight: 12,
    fontWeight: "600",
    fontSize: 16,
    color: "#1A1A1A",
  },
  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#A855F7",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginTop: 10,
  },



  followText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  followBtnInline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#A855F7",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },

  followingBtn: {
    backgroundColor: "#7C3AED",
  },
});