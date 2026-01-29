import api from "@/api/api";
import AppBackground from "@/components/AppBackground";
import WardrobeHeader from "@/components/WardrobeHeader";
import { useFollow } from "@/context/FollowContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
const baseURL = api.defaults.baseURL;

export default function FollowersPage() {
  const { userId, tab = "followers" } = useLocalSearchParams();
  const router = useRouter();
  const { isFollowing, toggleFollow, ready } = useFollow();

  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    tab as any
  );
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (ready) {
    fetchUsers();
  }
}, [activeTab, ready]);
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/follow/${activeTab}/${userId}`);
      setUsers(res.data || []);
    } catch (err) {
      console.log("Failed to load followers", err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => {
   const followed = ready ? isFollowing(item._id) : false;

    return (
        
      <TouchableOpacity
        style={styles.userRow}
        onPress={() => router.push(`/profile/${item._id}`)}
        activeOpacity={0.8}
      >
        <Image
    source={{ uri: resolveImageUrl(item.photo) }}
    style={styles.avatar}
  />

        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.bio} numberOfLines={1}>
            {item.bio || "No bio"}
          </Text>
        </View>

        {ready && (
          <TouchableOpacity
            style={[
              styles.followBtn,
              followed && styles.followingBtn,
            ]}
            onPress={() => toggleFollow(item._id)}
          >
            <Text style={styles.followText}>
              {followed ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <AppBackground>
     <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
    <View style={styles.container}>
      {/* ✅ HEADER */}
      <WardrobeHeader
        onBack={() => router.back()}
        showFilters={false}
      />

      {/* ✅ TABS */}
      <View style={styles.tabs}>
        {["followers", "following"].map(t => (
          <TouchableOpacity
            key={t}
            style={[
              styles.tab,
              activeTab === t && styles.activeTab,
            ]}
            onPress={() => setActiveTab(t as any)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === t && styles.activeTabText,
              ]}
            >
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ✅ LIST */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#A855F7" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
    </SafeAreaView>
    </AppBackground>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff71",
  },

  /* Tabs */
  tabs: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: "#F3E8FF",
    borderRadius: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#A855F7",
    borderRadius: 24,
  },
  tabText: {
    fontWeight: "600",
    color: "#7C3AED",
    fontSize: 13,
  },
  activeTabText: {
    color: "#fff",
  },

  /* Loader */
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  /* User row */
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  userInfo: {
    flex: 1,
    marginRight: 10,
  },
  username: {
    fontWeight: "700",
    fontSize: 15,
    color: "#111",
  },
  bio: {
    color: "#777",
    fontSize: 13,
    marginTop: 2,
  },

  /* Follow button */
  followBtn: {
    backgroundColor: "#A855F7",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followingBtn: {
    backgroundColor: "#7C3AED",
  },
  followText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
});
