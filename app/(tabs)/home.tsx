import ItemPostCard from "@/components/ItemPostCard";
import SearchModal from "@/components/SearchModal";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground
} from "react-native";
import api from "../../api/api";
/* ================= TYPES ================= */

interface FeedUser {
  _id?: string;
  username: string;
  photo?: string;
}

interface CollectionStats {
  totalWorth: number;
  totalWardrobes: number;
  totalItems: number;
}

interface FeedItem {
  _id: string;
  type: "item" | "wardrobe" | "collection";
  images?: string[];   // ✅ ADD THIS
  imageUrl?: string;
  image?: string;
  user?: FeedUser;
  stats?: CollectionStats;
}

/* ================= COMPONENT ================= */

export default function HomeScreen() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const LIMIT = 6;

  useEffect(() => {
    loadFeed(true);



    const loadStories = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await api.get("/api/story", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setStories(res.data); // grouped by user
      } catch (err) {
        console.error("Story load error:", err);
      }
    };



    const loadMe = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await api.get("/api/user/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCurrentUserId(res.data._id);
        console.log("Logged-in user:", res.data._id);



      } catch (err) {
        console.error("User me error:", err);
      }
    };
    const loadNotificationsCount = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUnreadCount(res.data.unreadCount);
    };

    loadNotificationsCount();

    loadMe();
    loadStories();
  }, []);


  /* ================= LOAD FEED ================= */

  const loadFeed = async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;

    try {
      setLoading(true);

      const [publicRes, collectionRes] = await Promise.all([
        api.get(`/api/feed/public?page=${reset ? 1 : page}&limit=${LIMIT}`),
        api.get(`/api/feed/collections`),
      ]);

      const publicItems: FeedItem[] = publicRes.data?.items || [];
      const collections: FeedItem[] = collectionRes.data || [];

      const processedPublic = publicItems.map((item) => ({
        ...item,

        // ✅ backward compatibility for old items
        images: item.images && item.images.length
          ? item.images
          : item.imageUrl
            ? [item.imageUrl]
            : item.image
              ? [item.image]
              : [],
      }));


      const merged = injectCollections(processedPublic, collections);

      setFeed((prev) => (reset ? merged : [...prev, ...merged]));
      setPage((prev) => (reset ? 2 : prev + 1));
      setHasMore(publicItems.length === LIMIT);
    } catch (err) {
      console.error("Feed load error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= REFRESH ================= */

  const handleRefresh = async () => {
    setRefreshing(true);
    setHasMore(true);
    await loadFeed(true);
    setRefreshing(false);
  };

  /* ================= RENDER POST ================= */

  const renderPost = ({ item }: { item: FeedItem }) => {
    if (item.type === "item") {
      return (
        <ItemPostCard
          item={item}
          currentUserId={currentUserId}   // ✅ THIS WAS MISSING
          key={`item-${item._id}`}
          onDelete={(deletedId: string) => {
            setFeed(prev => prev.filter(i => i._id !== deletedId));
          }}
        />
      );
    }

    return null;
  };


  /* ================= HEADER ================= */

  const renderHeader = () => (
    <>
    
      <View style={styles.header}>
        <Text style={styles.logoText}>
          <Text style={styles.logoHighlight}>D</Text><Text style={styles.logoHighlight2}>W</Text>
        </Text>

        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => setShowSearch(true)}>
            <Image
              source={require("../../assets/icons/search.png")}
              style={styles.headerIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginLeft: 16 }}
            onPress={() => router.push("/notifications")}
          >
            <Image
              source={require("../../assets/icons/bell.png")}
              style={styles.headerIcon}
            />

            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.storyRow}>
        {/* Add Story */}



        {/* Sample User Story */}
        <View style={styles.storyRow}>
          {/* Add Story */}
          <TouchableOpacity
            style={styles.storyCard}
            onPress={() => router.push("/story/add")}
          >
            <View style={styles.addStoryCard}>
              <Ionicons name="add" size={26} color="#A855F7" />
            </View>
            <Text style={styles.storyName}>Add Story</Text>
          </TouchableOpacity>

          {/* User Stories */}
          {stories.map((group, index) => (
            <TouchableOpacity
              key={index}
              style={styles.storyCard}
              onPress={() =>
                router.push({
                  pathname: "/story/view",
                  params: { index },
                })
              }
            >
              <View style={styles.userStoryCard}>
                {group.user.photo ? (
                  <Image
                    source={{ uri: `https://api.digiwardrobe.com${group.user.photo}` }}
                    style={{ width: 64, height: 84, borderRadius: 14 }}
                  />
                ) : (
                  <Text style={styles.storyInitial}>
                    {group.user.username[0].toUpperCase()}
                  </Text>
                )}
              </View>
              <Text style={styles.storyName}>{group.user.username}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </View>
      

    </>
  );

  return (
    <>
    
      <FlatList
        data={feed}
        keyExtractor={(item, index) => `${item._id}-${index}`}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        onEndReached={() => loadFeed()}
        onEndReachedThreshold={0.6}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator
              size="small"
              color="#A855F7"
              style={{ marginVertical: 20 }}
            />
          ) : null
        }
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      />
      <SearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
      />
    </>
  );
}

/* ================= HELPERS ================= */

function injectCollections(posts: FeedItem[], collections: FeedItem[]) {
  if (!collections.length) return posts;

  const result = [...posts];
  let insertIndex = 2;

  collections.forEach((collection) => {
    if (insertIndex < result.length) {
      result.splice(insertIndex, 0, collection);
      insertIndex += 4;
    }
  });

  return result;
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 25,
  },
  headerIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
 storyBg: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  logoText: {
    fontSize: 22,
  },

  logoHighlight: {
    fontSize: 35,
    color: "#A855F7",
    fontFamily: "Cookie",
  },
  logoHighlight2: {
    fontFamily: "Cookie",
    fontSize: 35,

  },
  headerIcons: {
    flexDirection: "row",
  },

  storyRow: {
    marginTop: 18,
    flexDirection: "row",
  },

  storyCard: {
    alignItems: "center",
    marginRight: 14,
  },

  addStoryCard: {
    width: 64,
    height: 84,
    borderRadius: 14, // rounded square
    borderWidth: 2,
    borderColor: "#A855F7",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  userStoryCard: {
    width: 64,
    height: 84,
    borderRadius: 14,
    backgroundColor: "#A855F7",
    justifyContent: "center",
    alignItems: "center",
  },

  storyInitial: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },

  storyName: {
    marginTop: 6,
    fontSize: 12,
    color: "#444",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#A855F7",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
