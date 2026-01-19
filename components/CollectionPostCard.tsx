import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import api from "../api/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
const { width } = Dimensions.get("window");
const BASE_URL = "https://api.digiwardrobe.com";

/* ================= TYPES ================= */

interface WardrobeSummary {
  _id: string;
  name: string;
  coverImage?: string;
  images?: string[];
  totalItems: number;
  totalWorth: number;
  hasPrivateItems?: boolean;
}

interface CollectionPostCardProps {
  item: {
    _id: string;
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
  const [isOwner, setIsOwner] = useState(false);

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
    fetchViewCount();
  }, []);

  const fetchLikeCount = async () => {
    const res = await api.get(`/api/collections/${item.user._id}/likes`);
    setLikeCount(res.data.totalLikes || 0);
  };

  const fetchViewCount = async () => {
    const res = await api.get(`/api/collections/${item.user._id}/view`);
    setViewCount(res.data.totalViews || 0);
  };

  const loadWardrobes = async () => {
    if (wardrobes.length) return;

    setLoading(true);

    const res = await api.get(
      `/api/collections/${item.user._id}/wardrobes`,
      {
        headers: {
          Authorization: `Bearer ${await AsyncStorage.getItem("token")}`,
        },
      }
    );


    setWardrobes(res.data?.wardrobes || []);
    setIsOwner(res.data.isOwner);

    console.log("Backend isOwner:", res.data.isOwner);

    setLoading(false);
  };


  const trackView = async () => {
    const res = await api.post(`/api/collections/${item.user._id}/view`);
    if (res.data?.totalViews) setViewCount(res.data.totalViews);
  };

  const openGate = async () => {
    if (!isOpen) {
      await trackView();
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

  
    const getWardrobeImage = (w: WardrobeSummary) => {
      // ✅ NEW system first
      if (w.images?.length && w.images[0]) {
        const img = w.images[0];
        return img.startsWith("http")
          ? img
          : `${BASE_URL}${img.startsWith("/") ? img : `/${img}`}`;
      }

      // ⚠️ LEGACY fallback
      if (w.coverImage) {
        return w.coverImage.startsWith("http")
          ? w.coverImage
          : `${BASE_URL}${w.coverImage.startsWith("/") ? w.coverImage : `/${w.coverImage}`}`;
      }

      return null;
    };

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.9} onPress={isOpen ? closeGate : openGate}>
        <View style={styles.card}>
          {/* CLOSED STATE */}
          <Animated.View
            style={[
              styles.closedState,
              {
                opacity: interiorAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              },
            ]}
          >
            <ImageBackground
              source={require("../assets/images/bg-wardrobe.png")}
              resizeMode="cover"
              style={styles.bg}
            >
              <View style={styles.overlay} />

              <View style={styles.content}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.user.username.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.username}>{item.user.username}</Text>
                <Text style={styles.handle}>@{item.user.username.toLowerCase()}</Text>

                <View style={styles.statsPill}>
                  <View style={styles.moneyStat}>
                    {/* Rupee icon */}
                    <View style={styles.rupeeCircle}>
                      <Text style={styles.rupeeSymbol}>₹</Text>
                    </View>

                    {/* Amount only (no ₹) */}
                    <Text style={styles.moneyValue}>
                      {formatPrice(item.stats.totalWorth).replace("₹", "")}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.statRight}>
                    <View style={styles.statRow}>
                      <Ionicons name="thumbs-up-outline" size={14} color="#fff" />
                      <Text style={styles.statText}>{likeCount} Likes</Text>
                    </View>
                    <View style={styles.statRow}>
                      <Ionicons name="shirt-outline" size={14} color="#fff" />
                      <Text style={styles.statText}>
                        {item.stats.totalItems} Items
                      </Text>
                    </View>
                    <View style={styles.statRow}>
                      <Ionicons name="eye-outline" size={14} color="#fff" />
                      <Text style={styles.statText}>{viewCount} Views</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.peekText}>What’s inside? Wanna see!</Text>
              </View>
            </ImageBackground>
          </Animated.View>

          {/* OPEN STATE */}
          {/* OPEN STATE */}
          <Animated.View
            style={[
              styles.openState,
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
              <ActivityIndicator size="large" color="#111827" />
            ) : (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.grid}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}        // 🔥 REQUIRED
                keyboardShouldPersistTaps="handled"
              >

                {wardrobes.map((w) => (
                  
                  <TouchableOpacity
                    key={w._id}
                    style={styles.wardrobeCard}
                    onPress={() => {
                      if (isOwner) {
                        // 👤 Owner → private wardrobe
                        router.push(
                          `/wardrobe/${w._id}?name=${encodeURIComponent(w.name)}`
                        );
                      } else {
                        // 🌍 Public viewer → public wardrobe
                        router.push(`/wardrobe/${w._id}?public=true`);
                      }
                    }}
                  >
                    <Image
                      source={
                        getWardrobeImage(w)
                          ? { uri: getWardrobeImage(w)! }
                          : require("../assets/images/icon.png")
                      }
                      style={styles.wardrobeImage}
                    />

                    <Text style={styles.wardrobeName}>{w.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({



  openState: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#F8FAFC",
    padding: 14,
  },
  scrollContainer: {
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  container: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  card: {
    height: 340,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#000",
    marginTop: 20,
  },
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#A855F7",
  },
  username: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffffff",

  },
  handle: {
    fontSize: 13,
    color: "#aaaaaaff",
    marginBottom: 18,
  },
  statsPill: {
    flexDirection: "row",
    backgroundColor: "#A855F7",
    borderRadius: 15,
    padding: 14,
    width: "100%",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  divider: {
    width: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 25,
  },
  statRight: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  peekText: {
    fontSize: 14,
    color: "#d1ceceff",
    fontWeight: "500",
  },
  closedState: {
    ...StyleSheet.absoluteFillObject,
  },

  wardrobeCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
  },
  wardrobeImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 6,
  },
  wardrobeName: {
    fontSize: 13,
    fontWeight: "600",
  },
  moneyStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  rupeeCircle: {
    width: 30,
    height: 30,
    borderRadius: 18,
    backgroundColor: "#FFFFFF", // filled circle
    justifyContent: "center",
    alignItems: "center",

    // optional polish
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  rupeeSymbol: {
    fontSize: 18,
    fontWeight: "800",
    color: "#A855F7", // purple ₹
  },

  moneyValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },

});
