// app/wardrobe/[id].tsx
import AppBackground from "@/components/AppBackground";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/api";

import { resolveImageUrl } from "@/utils/resolveImageUrl";
interface WardrobeItem {
  _id: string;
  wardrobe: string;
  category: string;
  price: number;
  brand?: string;
  imageUrl: string;
  images?: string[];
  createdAt: string;
}

interface Wardrobe {
  _id: string;
  name: string;
}

export default function WardrobeDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const wardrobeId = params.id as string;
  const wardrobeName = params.name as string; // only for UI title

  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<"dateNewest" | "dateOldest" | "priceHigh" | "priceLow" | "nameAZ">("dateNewest");
  const [isGridView, setIsGridView] = useState(true);
  const [loading, setLoading] = useState(true);
  const isPublicView = params.public === "true";
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const itemSelectionMode = selectedItemIds.length > 0;
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [moving, setMoving] = useState(false);
  const [renderVersion, setRenderVersion] = useState(0);


  const fetchWardrobes = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/api/wardrobe/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setWardrobes(res.data.wardrobes || []);
    } catch (err) {
      console.error("Error fetching wardrobes", err);
    }
  };

  const toggleItemSelect = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };



  const cancelItemSelection = () => {
    setSelectedItemIds([]);
    setRenderVersion(v => v + 1);
  };

  const confirmItemDelete = () => {
    const isSingle = selectedItemIds.length === 1;

    Alert.alert(
      isSingle ? "Delete item?" : "Delete items?",
      isSingle
        ? "This item will be permanently deleted."
        : "All selected items will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: isSingle
            ? deleteSingleItem
            : deleteMultipleItems,
        },
      ]
    );
  };
  const deleteSingleItem = async () => {
    const token = await AsyncStorage.getItem("token");
    await api.delete(`/api/wardrobe/item/${selectedItemIds[0]}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    cancelItemSelection();
    fetchItems();
  };

  const deleteMultipleItems = async () => {
    const token = await AsyncStorage.getItem("token");
    await api.delete("/api/wardrobe/items/bulk-delete", {
      headers: { Authorization: `Bearer ${token}` },
      data: { itemIds: selectedItemIds },
    });
    cancelItemSelection();
    fetchItems();
  };


  const getFirstItemImage = (item: WardrobeItem): string | null => {
    if (Array.isArray(item.images) && item.images.length > 0) {
      return resolveImageUrl(item.images[0]);
    }

    if (item.imageUrl) {
      return resolveImageUrl(item.imageUrl);
    }

    return null;
  };



  const fetchItems = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      // 🔹 PUBLIC VIEW (someone else's wardrobe)
      if (isPublicView) {
        const res = await api.get(`/api/wardrobe/${wardrobeId}/items`);
        setItems(res.data || []);
        return;
      }

      // 🔹 OWN WARDROBE (logged-in user)
      if (token) {
        const res = await api.get("/api/wardrobe/my", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const filteredItems = res.data.filter(
          (item: WardrobeItem) => item.wardrobe === wardrobeId
        );

        setItems(filteredItems);
        return;
      }

      // 🔹 Fallback (not logged in)
      const res = await api.get(`/api/wardrobe/${wardrobeId}/items`);
      setItems(res.data || []);

    } catch (err) {
      console.error("Error fetching wardrobe items:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToWardrobe = async (targetWardrobeId: string, targetName: string) => {
    try {
      setMoving(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      if (selectedItemIds.length === 1) {
        // ✅ SINGLE ITEM MOVE
        await api.put(
          `/api/wardrobe/${selectedItemIds[0]}/move`,
          { targetWardrobeId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // ✅ BULK MOVE
        await api.put(
          `/api/wardrobe/move-bulk`,
          {
            itemIds: selectedItemIds,
            targetWardrobeId,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      Alert.alert(
        "Moved successfully",
        selectedItemIds.length === 1
          ? `Item moved to ${targetName}`
          : `${selectedItemIds.length} items moved to ${targetName}`
      );

      setMoveModalVisible(false);
      cancelItemSelection();
      fetchItems();

    } catch (err) {
      console.error("Move error", err);
      Alert.alert("Error", "Failed to move items");
    } finally {
      setMoving(false);
    }
  };


 useEffect(() => {
  fetchItems();
  fetchWardrobes();
}, [wardrobeId, isPublicView]);


  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case "dateOldest": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "priceHigh": return b.price - a.price;
      case "priceLow": return a.price - b.price;
      case "nameAZ": return a.category.localeCompare(b.category);
      case "dateNewest":
      default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });


  return (
    <AppBackground>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={{ flex: 1, }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{wardrobeName}</Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity onPress={() => setIsGridView(!isGridView)}>
                <Ionicons name={isGridView ? "grid-outline" : "list-outline"} size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSortModalVisible(true)}>
                <Ionicons name="filter-outline" size={24} color="#A855F7" />
              </TouchableOpacity>
            </View>
          </View>
          {itemSelectionMode && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionText}>
                {selectedItemIds.length} selected
              </Text>

              <View style={{ flexDirection: "row", gap: 16 }}>
                {selectedItemIds.length === 1 && (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/add-wardrobe",
                        params: {
                          mode: "edit",
                          itemId: selectedItemIds[0],
                        },
                      })
                    }
                  >
                    <Ionicons name="create-outline" size={22} color="#A855F7" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setMoveModalVisible(true)}>
                  <Ionicons name="swap-horizontal-outline" size={22} color="#6366F1" />
                </TouchableOpacity>

                <TouchableOpacity onPress={confirmItemDelete}>
                  <Ionicons name="trash-outline" size={22} color="#EF4444" />
                </TouchableOpacity>

                <TouchableOpacity onPress={cancelItemSelection}>
                  <Ionicons name="close-outline" size={24} color="#555" />
                </TouchableOpacity>
              </View>
            </View>
          )}


          <Text style={styles.itemCountText}>{items.length} items in this wardrobe</Text>

          <ScrollView key={renderVersion} style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            <View style={isGridView ? styles.gridContainer : undefined}>
              {loading ? (
                <ActivityIndicator color="#A855F7" size="large" style={{ marginTop: 20 }} />
              ) : (
                sortedItems.map((item) => {
                  const imagePath = getFirstItemImage(item);
                  const isSelected = selectedItemIds.includes(item._id);
                  return (

                    <TouchableOpacity
                      key={item._id}
                      activeOpacity={0.9}
                      onPress={() =>
                        itemSelectionMode
                          ? toggleItemSelect(item._id)
                          : router.push(`/wardrobe/item/${item._id}`)
                      }
                      onLongPress={() => {
                        if (!itemSelectionMode) {
                          setSelectedItemIds([item._id]);
                        }
                      }}
                      style={[
                        isGridView ? styles.gridItem : styles.listItem,

                        // ✅ selected highlight
                        isSelected && styles.selectedItem,

                        // ✅ dim others when in selection mode
                        itemSelectionMode && !isSelected && styles.dimmedItem,
                      ]}
                    >
                      {imagePath ? (
                        <Image
                          source={{ uri: imagePath }}
                          style={isGridView ? styles.gridImage : styles.listImage}
                          resizeMode="cover"
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
                            <Text style={styles.itemDate}>
                              Added: {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })

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
          <Modal
            animationType="slide"
            transparent
            visible={moveModalVisible}
            onRequestClose={() => setMoveModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Move to wardrobe</Text>

                <ScrollView>
                  {wardrobes
                    .filter(w => w._id !== wardrobeId) // ❌ prevent moving to same wardrobe
                    .map(w => (
                      <TouchableOpacity
                        key={w._id}
                        style={styles.moveWardrobeItem}
                        disabled={moving}
                        onPress={() => handleMoveToWardrobe(w._id, w.name)}
                      >
                        <Text style={styles.moveWardrobeText}>{w.name}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                      </TouchableOpacity>
                    ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.closeModalBtn}
                  onPress={() => setMoveModalVisible(false)}
                >
                  <Text style={styles.closeModalText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

        </View>
      </SafeAreaView>
    </AppBackground>

  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingTop: 0 },
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
  selectionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FAF5FF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  selectionText: {
    fontWeight: "600",
    color: "#444",
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: "#A855F7",
  },

  dimmedItem: {
    opacity: 0.5,
  },

  checkOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  moveWardrobeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EDE9FE",
  },

  moveWardrobeText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },


});
