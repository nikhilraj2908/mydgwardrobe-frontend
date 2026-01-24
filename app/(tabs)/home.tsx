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
} from "react-native";
import api from "../../api/api";
import AppBackground from "@/components/AppBackground";

/* ================= TYPES ================= */
interface StoryGroup {
  user: {
    _id: string;
    username: string;
    photo?: string;
  };
  stories: any[];
}

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
  images?: string[];
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
  const [stories, setStories] = useState<StoryGroup[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const LIMIT = 6;

  const API_URL = "https://api.digiwardrobe.com";

  useEffect(() => {
    loadFeed(true);
    loadStories();
    loadMe();
    loadNotificationsCount();
  }, []);

  const loadStories = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/api/story", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📱 Stories loaded:", JSON.stringify(res.data, null, 2));
      setStories(res.data);
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
    } catch (err) {
      console.error("User me error:", err);
    }
  };

  const loadNotificationsCount = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Notification count error:", err);
    }
  };

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
          currentUserId={currentUserId}
          key={`item-${item._id}`}
          onDelete={(deletedId: string) => {
            setFeed(prev => prev.filter(i => i._id !== deletedId));
          }}
        />
      );
    }
    return null;
  };

  /* ================= STORY UTILITIES ================= */
  const getStoryCoverImage = (storyGroup: StoryGroup) => {
    if (storyGroup.stories && storyGroup.stories.length > 0) {
      return storyGroup.stories[0].media;
    }
    return null;
  };

  const getUserPhotoUrl = (photoPath?: string) => {
    if (!photoPath) return null;

    if (photoPath.startsWith('http')) {
      return photoPath;
    }

    if (photoPath.includes('amazonaws.com')) {
      return photoPath;
    }

    return `${API_URL}${photoPath}`;
  };

  /* ================= HEADER ================= */
  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.logoText}>
          <Text style={styles.logoHighlight}>D</Text>
          <Text style={styles.logoHighlight2}>W</Text>
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
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Stories Section */}
      <View style={styles.storiesContainer}>
        {/* Add Story Button - SAME SIZE AS USER STORIES */}
        <TouchableOpacity
          style={styles.storyCard}
          onPress={() => router.push("/story/add")}
        >
          <View style={styles.addStoryWrapper}>
            <View style={styles.addStoryInner}>
              <Ionicons name="add" size={26} color="#A855F7" />
            </View>
          </View>
          <Text style={styles.storyName}>Add Story</Text>
        </TouchableOpacity>

        {/* User Stories */}
        {stories.map((group, index) => {
          const coverImage = getStoryCoverImage(group);
          const userPhotoUrl = getUserPhotoUrl(group.user.photo);

          return (
            <TouchableOpacity
              key={`${group.user._id}-${index}`}
              style={styles.storyCard}
              onPress={() =>
                router.push({
                  pathname: "/story/view",
                  params: { index },
                })
              }
            >
              <View style={styles.userStoryWrapper}>
                {/* Story Image Container */}
                <View style={styles.storyImageContainer}>
                  {coverImage ? (
                    <Image
                      source={{ uri: coverImage }}
                      style={styles.storyImage}
                    />
                  ) : userPhotoUrl ? (
                    <Image
                      source={{ uri: userPhotoUrl }}
                      style={styles.storyImage}
                    />
                  ) : (
                    <View style={styles.storyFallback}>
                      <Text style={styles.storyInitial}>
                        {group.user.username[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.storyName} numberOfLines={1}>
                {group.user.username}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  return (
    <AppBackground>
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
        onSearch={(query) => {
          setShowSearch(false);
          router.push({ pathname: "/explore", params: { q: query } });
        }}
      />
    </AppBackground>
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
    paddingHorizontal: 16,
  },
  headerIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5
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
  storiesContainer: {
    marginTop: 5,
    flexDirection: "row",
    paddingVertical: 8,
  },
  storyCard: {
    alignItems: "center",
    marginRight: 12,
    width: 72,
  },
  // Add Story Styles - Square
  addStoryWrapper: {
    width: 64,
    height: 84,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#A855F7",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  addStoryInner: {
    width: 56,
    height: 78,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  // User Story Styles - Square
  userStoryWrapper: {
    width: 64,
    height: 84,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#A855F7",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  storyImageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  storyImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  storyFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#A855F7",
    justifyContent: "center",
    alignItems: "center",
  },
  storyInitial: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  storyName: {
    marginTop: 6,
    fontSize: 11,
    color: "#444",
    textAlign: "center",
    width: 64,
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
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
});