// app/wardrobe/items.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View
} from "react-native";
import api from "../../api/api";

const SERVER_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

interface WardrobeItem {
  _id: string;
  wardrobe: string;
  category: string;
  price: number;
  brand?: string;
  imageUrl: string;
  createdAt: string;
}

export default function AllWardrobeItemsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<"dateNewest" | "dateOldest" | "priceHigh" | "priceLow" | "nameAZ">("dateNewest");
  const [isGridView, setIsGridView] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const res = await api.get("/api/wardrobe/my", { headers: { Authorization: `Bearer ${token}` } });
      setItems(res.data);
    } catch (err) {
      console.error("Error fetching wardrobe items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const sortedItems = [...items].sort((a, b) => {
    switch(sortBy) {
      case "dateOldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "priceHigh": return b.price - a.price;
      case "priceLow": return a.price - b.price;
      case "nameAZ": return a.category.localeCompare(b.category);
      case "dateNewest":
      default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Helper to construct full image URL
 const DEFAULT_IMAGE =
  "https://ui-avatars.com/api/?name=Item&background=random";

const getItemImageUrl = (url?: string): string => {
  if (!url) return DEFAULT_IMAGE;

  // already absolute
  if (url.startsWith("http")) return url;

  // relative path from backend
  if (url.startsWith("/")) {
    return `${SERVER_URL}${url}`;
  }

  return `${SERVER_URL}/${url}`;
};


  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back-outline" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Items</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <TouchableOpacity onPress={() => setIsGridView(!isGridView)}>
            <Ionicons name={isGridView ? "grid-outline" : "list-outline"} size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSortModalVisible(true)}>
            <Ionicons name="filter-outline" size={24} color="#A855F7" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.itemCountText}>{items.length} items in your collection</Text>

      <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={isGridView ? styles.gridContainer : undefined}>
          {loading ? (
            <ActivityIndicator color="#A855F7" size="large" style={{ marginTop: 20 }} />
          ) : (
            sortedItems.map((item) => (
              <View key={item._id} style={isGridView ? styles.gridItem : styles.listItem}>
                {item.imageUrl ? (
                  <Image 
                    source={{ uri: getItemImageUrl(item.imageUrl) }} 
                    style={isGridView ? styles.gridImage : styles.listImage} 
                  />
                ) : (
                  <View style={isGridView ? styles.gridImagePlaceholder : styles.listImagePlaceholder}>
                    <Ionicons name="shirt-outline" size={36} color="#A855F7" />
                  </View>
                )}
                <View style={isGridView ? { padding: 8 } : { flex: 1, paddingLeft: 12 }}>
                  <Text style={styles.itemName}>{item.category}</Text>
                  {!isGridView && (
                    <>
                      <Text style={styles.itemCategory}>{item.brand || item.wardrobe}</Text>
                      <Text style={styles.itemPrice}>₹{item.price}</Text>
                      <Text style={styles.itemDate}>Added: {new Date(item.createdAt).toLocaleDateString()}</Text>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Sort Modal */}
      <Modal animationType="slide" transparent visible={sortModalVisible} onRequestClose={() => setSortModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <View style={styles.sortSection}>
              <Text style={styles.sortSectionTitle}>By Date</Text>
              <View style={styles.sortButtons}>
                <TouchableOpacity style={[styles.sortBtn, sortBy === "dateNewest" && styles.activeSortBtn]} onPress={() => setSortBy("dateNewest")}>
                  <Text style={sortBy === "dateNewest" ? styles.activeSortText : styles.sortText}>Newest</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sortBtn, sortBy === "dateOldest" && styles.activeSortBtn]} onPress={() => setSortBy("dateOldest")}>
                  <Text style={sortBy === "dateOldest" ? styles.activeSortText : styles.sortText}>Oldest</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sortSection}>
              <Text style={styles.sortSectionTitle}>By Price</Text>
              <View style={styles.sortButtons}>
                <TouchableOpacity style={[styles.sortBtn, sortBy === "priceHigh" && styles.activeSortBtn]} onPress={() => setSortBy("priceHigh")}>
                  <Text style={sortBy === "priceHigh" ? styles.activeSortText : styles.sortText}>High to Low</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sortBtn, sortBy === "priceLow" && styles.activeSortBtn]} onPress={() => setSortBy("priceLow")}>
                  <Text style={sortBy === "priceLow" ? styles.activeSortText : styles.sortText}>Low to High</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sortSection}>
              <Text style={styles.sortSectionTitle}>By Name</Text>
              <TouchableOpacity style={[styles.sortBtn, sortBy === "nameAZ" && styles.activeSortBtn]} onPress={() => setSortBy("nameAZ")}>
                <Text style={sortBy === "nameAZ" ? styles.activeSortText : styles.sortText}>A to Z</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSortModalVisible(false)}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16,paddingTop:35 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  itemCountText: { marginLeft: 16, color: "#666", marginBottom: 8 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridItem: { width: "48%", backgroundColor: "#F3E8FF", borderRadius: 16, marginBottom: 12, overflow: "hidden" },
  listItem: { flexDirection: "row", backgroundColor: "#F3E8FF", borderRadius: 16, marginBottom: 12, overflow: "hidden" },
  gridImage: { width: "100%", height: 150 },
  listImage: { width: 100, height: 100, borderRadius: 12 },
  gridImagePlaceholder: { width: "100%", height: 150, backgroundColor: "#EDE9FE", justifyContent: "center", alignItems: "center" },
  listImagePlaceholder: { width: 100, height: 100, backgroundColor: "#EDE9FE", justifyContent: "center", alignItems: "center" },
  itemName: { fontWeight: "700", fontSize: 14, marginBottom: 2 },
  itemCategory: { fontSize: 12, color: "#666" },
  itemPrice: { fontWeight: "600", marginTop: 2 },
  itemDate: { fontSize: 10, color: "#999" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  sortSection: { marginBottom: 12 },
  sortSectionTitle: { fontWeight: "600", marginBottom: 4 },
  sortButtons: { flexDirection: "row", marginBottom: 8 },
  sortBtn: { flex: 1, padding: 10, marginRight: 8, borderRadius: 20, backgroundColor: "#F3E8FF", alignItems: "center" },
  activeSortBtn: { backgroundColor: "#A855F7" },
  sortText: { color: "#444", fontWeight: "600" },
  activeSortText: { color: "#fff", fontWeight: "600" },
  closeModalBtn: { marginTop: 12, padding: 12, alignItems: "center", backgroundColor: "#A855F7", borderRadius: 20 },
  closeModalText: { color: "#fff", fontWeight: "700" },
});
