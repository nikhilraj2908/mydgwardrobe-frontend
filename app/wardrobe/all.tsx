// app/wardrobe/all.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import api from "../../api/api";

interface Wardrobe {
  _id: string;
  name: string;
  color?: string;
  itemCount?: number;
  totalWorth:number;
}

export default function AllWardrobesScreen() {
  const router = useRouter();
  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWardrobes = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const res = await api.get("/api/wardrobe/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWardrobes(res.data.wardrobes);
    } catch (err) {
      console.error("Error fetching wardrobes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWardrobes();
  }, []);

  const handleWardrobePress = (wardrobe: Wardrobe) => {
    router.push(`/wardrobe/${wardrobe._id}?name=${encodeURIComponent(wardrobe.name)}`);
  };

  const handleAddWardrobe = () => {
    router.push("/create-wardrobe");
  };

   const formatPrice = (price: number): string => {
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    } else if (price >= 1000) {
      return `₹${(price / 1000).toFixed(1)}K`;
    }
    return `₹${price}`;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Wardrobes</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Add Wardrobe Button */}
        <TouchableOpacity style={styles.addWardrobeBtn} onPress={handleAddWardrobe}>
          <Text style={styles.addWardrobeText}>+ Add New Wardrobe</Text>
        </TouchableOpacity>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          /* Wardrobes List */
          wardrobes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>No wardrobes yet</Text>
              <Text style={styles.emptySubtitle}>
                Create your first wardrobe to organize your items
              </Text>
            </View>
          ) : (
            wardrobes.map((w) => (
              <TouchableOpacity
                key={w._id}
                style={[
                  styles.wardrobeCard,
                  { backgroundColor: w.color ? `${w.color}33` : "#F3E8FF" }
                ]}
                onPress={() => handleWardrobePress(w)}
              >
                <View style={[styles.colorBox, { backgroundColor: w.color || "#A855F7" }]} />
                <View style={styles.wardrobeInfo}>
                  <Text style={styles.wardrobeName}>{w.name}</Text>
                  <Text style={styles.itemsCount}>{w.itemCount || 0} items </Text>
                </View>
                <View>
                    <Text >{formatPrice(w.totalWorth)}</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={24} color="#000" />
              </TouchableOpacity>
            ))
          )
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingTop: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerPlaceholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  addWardrobeBtn: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D8B4FE",
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#FAF5FF",
  },
  addWardrobeText: {
    color: "#A855F7",
    fontWeight: "600",
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  wardrobeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  colorBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  wardrobeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  wardrobeName: {
    fontWeight: "700",
    fontSize: 14,
  },
  itemsCount: {
    color: "#777",
    marginTop: 4,
  },
  bottomSpacer: {
    height: 40,
  },
});