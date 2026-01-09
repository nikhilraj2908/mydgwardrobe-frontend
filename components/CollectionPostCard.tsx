import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../api/api";

const { width } = Dimensions.get("window");
const BASE_URL = "https://api.digiwardrobe.com";

/* ================= TYPES ================= */

interface WardrobeSummary {
  _id: string;
  name: string;
  coverImage?: string;
  totalItems: number;
  totalWorth: number;
  hasPrivateItems?: boolean;
}

interface CollectionPostCardProps {
  item: {
    _id: string; // userId (collection owner)
    type: "collection";
    user: {
      _id: string;
      username: string;
      photo?: string;
    };
    stats: {
      totalWorth: number;
      totalWardrobes: number;
      totalItems: number;
    };
  };
}

/* ================= COMPONENT ================= */

export default function CollectionPostCard({ item }: CollectionPostCardProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wardrobes, setWardrobes] = useState<WardrobeSummary[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);

  /* ===== Gate animation ===== */

  const leftDoorAnim = useRef(new Animated.Value(0)).current;
  const rightDoorAnim = useRef(new Animated.Value(0)).current;
  const interiorAnim = useRef(new Animated.Value(0)).current;

  /* ================= HELPERS ================= */

  const formatPrice = (price: number) => {
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
    if (price >= 1000) return `₹${(price / 1000).toFixed(1)}K`;
    return `₹${price}`;
  };
  useEffect(() => {
    fetchLikeCount();
  }, []);

  const fetchLikeCount = async () => {
    try {
      const res = await api.get(
        `/api/collections/${item.user._id}/likes`
      );
      setLikeCount(res.data.totalLikes);
    } catch (err) {
      console.log("Like count error", err);
    }
  };


  const fetchViewCount = async () => {
    try {
      const res = await api.get(
        `/api/collections/${item.user._id}/view`
      );
      setViewCount(res.data.totalViews);
    } catch (err) {
      console.log("View count error", err);
    }
  };


  useEffect(() => {
    fetchViewCount();
  }, []);

  /* ================= LOAD WARDROBES ================= */
  const [isOwner, setIsOwner] = useState(false);

  const loadWardrobes = async () => {
    if (wardrobes.length > 0) return;

    try {
      setLoading(true);
      const res = await api.get(
        `/api/collections/${item.user._id}/wardrobes`
      );
      setWardrobes(res.data?.wardrobes || []);
      setIsOwner(res.data.isOwner);
    } catch (err) {
      console.log("Failed to load wardrobes");
    } finally {
      setLoading(false);
    }
  };

  /* ================= ANIMATIONS ================= */
  const trackView = async () => {
    try {
      const res = await api.post(
        `/api/collections/${item.user._id}/view`
      );
      if (res.data?.totalViews !== undefined) {
        setViewCount(res.data.totalViews);
      }
    } catch (err) {
      console.log("View track error", err);
    }
  };


  const openGate = async () => {
    if (!isOpen) {
      // track view (backend decides if counted or not)
      await trackView();

      // load wardrobes once
      await loadWardrobes();
    }

    Animated.parallel([
      Animated.timing(leftDoorAnim, {
        toValue: -width * 0.35,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rightDoorAnim, {
        toValue: width * 0.35,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(interiorAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    setIsOpen(true);
  };


  const closeGate = () => {
    Animated.parallel([
      Animated.timing(leftDoorAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rightDoorAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(interiorAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setIsOpen(false);
  };

  const toggleGate = () => {
    isOpen ? closeGate() : openGate();
  };

  /* ================= RENDER ================= */

  return (
    <View style={styles.container}>
      {/* ===== Header ===== */}
      <View style={styles.header}>
        <View style={styles.userRow}>

        </View>
      </View>

      {/* ===== Gate Card ===== */}
      <TouchableOpacity activeOpacity={0.9} onPress={toggleGate}>
        <View style={styles.gateWrapper}>
          {/* Closed Gate */}
          <Animated.View
            style={[
              styles.closedGate,
              {
                opacity: interiorAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              },
            ]}
          >
            <View style={styles.gateFrame}>
              <Animated.View
                style={[
                  styles.door,
                  { transform: [{ translateX: leftDoorAnim }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.door,
                  { transform: [{ translateX: rightDoorAnim }] },
                ]}
              />
            </View>

            <View style={styles.overlay}>


              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.user.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.username}>{item.user.username}</Text>
                <Text style={styles.handle}>
                  @{item.user.username.toLowerCase()}
                </Text>
              </View>

              <View style={styles.statsRow}>
                <Stat
                  icon="cash-outline"
                  value={formatPrice(item.stats.totalWorth)}
                />
                <Stat
                  icon="albums-outline"
                  value={`${item.stats.totalWardrobes} wardrobes`}
                />
                <Stat
                  icon="shirt-outline"
                  value={`${item.stats.totalItems} items`}
                />
              </View>
              <View style={styles.socialRow}>
                {/* Likes */}
                <View style={styles.socialItem}>
                  <Ionicons name="heart-outline" size={18} color="#fff" />
                  <Text style={styles.countText}>{likeCount}</Text>
                </View>

                {/* Views */}
                <View style={styles.socialItem}>
                  <Ionicons name="eye-outline" size={18} color="#fff" />
                  <Text style={styles.countText}>{viewCount}</Text>
                </View>
              </View>



              <Text style={styles.peekText}>
                {isOpen ? "Tap to close" : "What's inside ? Wanna see !"}
              </Text>
            </View>
          </Animated.View>

          {/* Open Gate */}
          <Animated.View
            style={[
              styles.openGate,
              {
                opacity: interiorAnim,
                transform: [
                  {
                    scale: interiorAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#A855F7" />
                <Text style={styles.loadingText}>
                  Opening wardrobes...
                </Text>
              </View>
            ) : wardrobes.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyText}>
                  No wardrobes in this collection
                </Text>
              </View>
            ) : (
              <View style={styles.wardrobeGrid}>
                {wardrobes.map((w) => (
                  <TouchableOpacity
                    key={w._id}
                    disabled={!isOwner && w.totalItems === 0}
                    style={[
                      styles.wardrobeCard,
                      !isOwner && w.totalItems === 0 && { opacity: 0.6 },
                    ]}
                    onPress={() =>
                      router.push(
                        `/wardrobe/${w._id}?name=${encodeURIComponent(w.name)}`
                      )

                    }
                  >
                    <Image
                      source={
                        w.coverImage
                          ? { uri: `${BASE_URL}/${w.coverImage}` }
                          : require("../assets/images/icon.png")
                      }
                      style={styles.wardrobeImage}
                    />

                    <Text style={styles.wardrobeName}>{w.name}</Text>

                    <Text style={styles.wardrobeMeta}>
                      {w.totalItems > 0
                        ? `${w.totalItems} items · ${formatPrice(w.totalWorth)}`
                        : isOwner
                          ? "Only private items"
                          : "No public items"}
                    </Text>

                    {/* ✅ ADD PRIVATE BADGE HERE */}
                    {isOwner && w.hasPrivateItems && (
                      <View style={styles.privateBadge}>
                        <Text style={styles.privateText}>Private items inside</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

              </View>
            )}
          </Animated.View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

/* ================= SMALL COMPONENT ================= */

const Stat = ({
  icon,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
}) => (
  <View style={styles.stat}>
    <Ionicons name={icon} size={16} color="#fff" />
    <Text style={styles.statText}>{value}</Text>
  </View>
);

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginVertical: 14,
    padding: 14,
    elevation: 5,
  },

  header: {
    marginBottom: 12,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  socialRow: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 8,
    justifyContent: "center",
    gap: 16,
  },

  socialItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  countText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  privateBadge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
    alignSelf: "flex-start",
  },

  privateText: {
    fontSize: 10,
    color: "#92400E",
    fontWeight: "600",
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E9D5FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6B21A8",

  },

  username: {
    fontWeight: "700",
    fontSize: 14,
    color: "#fff",
  },

  handle: {
    fontSize: 12,
    color: "#ccc6c6ff",
    marginBottom: 20

  },

  gateWrapper: {
    height: 320,
    borderRadius: 16,
    overflow: "hidden",
  },

  closedGate: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#7C3AED",
  },

  gateFrame: {
    flexDirection: "row",
    flex: 1,
  },

  door: {
    flex: 1,
    backgroundColor: "#6D28D9",
    borderWidth: 1,
    borderColor: "#0d021fff",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 20,
  },

  collectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 14,
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 16,
    marginBottom: 12,
  },

  stat: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },

  statText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
  },

  peekText: {
    color: "#fff",
    fontSize: 12,
    opacity: 0.85,
  },

  openGate: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F8FAFC",
    padding: 14,
  },

  wardrobeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  wardrobeCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    elevation: 2,
  },

  wardrobeImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
    marginBottom: 6,
  },

  wardrobeName: {
    fontWeight: "700",
    fontSize: 13,
  },

  wardrobeMeta: {
    fontSize: 11,
    color: "#b72d2dff",
    marginTop: 2,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#666",
  },

  emptyText: {
    color: "#666",
    fontSize: 14,
  },
});
