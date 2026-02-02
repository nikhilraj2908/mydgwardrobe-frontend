import AppBackground from "@/components/AppBackground";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/api";

interface WardrobeItem {
  _id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  images?: string[];
  visibility?: "public" | "private";
}

export default function PremiumWardrobeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  const [isOwner, setIsOwner] = useState<boolean | null>(null);


  const detectOwner = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token || !userId) return;

    const me = await api.get("/api/user/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    setIsOwner(me.data._id === userId);
  };

  useEffect(() => {
    detectOwner();
  }, [userId]);


  const fetchPremiumItems = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token || isOwner === null) return;

      let finalItems: WardrobeItem[] = [];

      // 👑 OWNER → own premium items
      if (isOwner) {
        const res = await api.get("/api/wardrobe/my", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(res.data)) {
          finalItems = res.data.filter(
            (item: any) =>
              item.accessLevel === "premium" &&
              item.visibility === "public"
          );
        }
      }

      // 👤 USER → owner's premium items (APPROVED ONLY)
      else {
        const res = await api.get(
          `/api/premium/user/${userId}/premium-items`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // 🔥 THIS WAS YOUR BUG EARLIER
        if (Array.isArray(res.data?.items)) {
          finalItems = res.data.items;
        }
      }

      setItems(finalItems);
    } catch (err: any) {
      if (err.response?.status === 403) {
        Alert.alert(
          "Premium Locked",
          "You don’t have access to this premium collection."
        );
        router.back();
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };





  useEffect(() => {
    if (isOwner !== null) {
      fetchPremiumItems();
    }
  }, [isOwner]);

  const handleItemPress = (itemId: string) => {
    router.push(`/wardrobe/item/${itemId}`);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>

      <AppBackground>
        <ScrollView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Premium Collection</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.statsContainer}>
            <Text style={styles.itemCount}>{items.length} Public Items</Text>
            <Text style={styles.totalWorth}>
              Total Worth: ₹{items.reduce((sum, item) => sum + (item.price || 0), 0).toLocaleString()}
            </Text>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="diamond-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>No public items yet</Text>
              <Text style={styles.emptyStateSubText}>
                Set your items to "public" to add them to your Premium Collection
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {items.map((item) => {
                const imageUrl = item.images?.[0] || item.imageUrl;
                return (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.itemCard}
                    onPress={() => handleItemPress(item._id)}
                  >
                    {imageUrl ? (
                      <Image
                        source={{ uri: resolveImageUrl(imageUrl) }}
                        style={styles.itemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.placeholderImage} />
                    )}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name || "Item"}
                      </Text>
                      <Text style={styles.itemBrand} numberOfLines={1}>
                        {item.brand || "Brand"}
                      </Text>
                      <Text style={styles.itemPrice}>₹{item.price || 0}</Text>
                    </View>
                    <View style={styles.premiumBadge}>
                      <Ionicons name="diamond" size={16} color="#FFD700" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  statsContainer: {
    backgroundColor: "#a453fc4d",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  itemCount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  totalWorth: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    fontWeight: "600",
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  itemCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    position: "relative",
  },
  itemImage: {
    width: "100%",
    height: 150,
  },
  placeholderImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#E9D5FF",
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemBrand: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#A855F7",
    marginTop: 4,
  },
  premiumBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 4,
  },
});