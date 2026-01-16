import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../api/api";

interface Wardrobe {
  _id: string;
  name: string;
  color?: string;
  itemCount?: number;
  totalWorth: number;
}

export default function AllWardrobesScreen() {
  const router = useRouter();

  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectionMode = selectedIds.length > 0;


  const selectedWardrobe =
    selectedIds.length === 1
      ? wardrobes.find(w => w._id === selectedIds[0])
      : null;


  /* ===============================
     FETCH
  ================================ */
  const fetchWardrobes = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const res = await api.get("/api/wardrobe/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWardrobes(res.data.wardrobes);
    } catch (err) {
      console.error("Fetch wardrobes error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWardrobes();
  }, []);

  /* ===============================
     SELECTION HANDLERS
  ================================ */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handlePress = (w: Wardrobe) => {
    if (selectionMode) {
      toggleSelect(w._id);
    } else {
      router.push(`/wardrobe/${w._id}?name=${encodeURIComponent(w.name)}`);
    }
  };

  const handleLongPress = (id: string) => {
    if (!selectionMode) {
      setSelectedIds([id]);
    }
  };

  const cancelSelection = () => setSelectedIds([]);

  /* ===============================
     DELETE CONFIRMATION
  ================================ */
  const confirmDelete = () => {
    const isSingle = selectedIds.length === 1;

    Alert.alert(
      isSingle ? "Delete wardrobe?" : "Delete wardrobes?",
      isSingle
        ? "All items inside this wardrobe will be permanently deleted. This action cannot be undone."
        : "All items inside the selected wardrobes will be permanently deleted. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: isSingle ? deleteSingleWardrobe : deleteMultipleWardrobes,
        },
      ]
    );
  };

  /* ===============================
     DELETE APIs
  ================================ */
  const deleteSingleWardrobe = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await api.delete(`/api/wardrobe/${selectedIds[0]}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedIds([]);
      fetchWardrobes();
    } catch (err) {
      console.error("Single delete failed:", err);
    }
  };

  const deleteMultipleWardrobes = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await api.delete("/api/wardrobe/bulk-delete", {
        headers: { Authorization: `Bearer ${token}` },
        data: { wardrobeIds: selectedIds },
      });
      setSelectedIds([]);
      fetchWardrobes();
    } catch (err) {
      console.error("Bulk delete failed:", err);
    }
  };

  /* ===============================
     UI HELPERS
  ================================ */
  const formatPrice = (price: number) => {
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
    if (price >= 1000) return `₹${(price / 1000).toFixed(1)}K`;
    return `₹${price}`;
  };

  /* ===============================
     RENDER
  ================================ */
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        {!selectionMode ? (
          <>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>All Wardrobes</Text>
            <View style={{ width: 24 }} />
          </>
        ) : (
          <>
            <Text style={styles.headerTitle}>
              {selectedIds.length} selected
            </Text>
            <View style={{ flexDirection: "row", gap: 16 }}>
              {selectedIds.length === 1 && selectedWardrobe && (
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: "/profile/create-wardrobe",
                      params: {
                        id: selectedWardrobe._id,
                        name: selectedWardrobe.name,
                        color: selectedWardrobe.color,
                      },
                    })
                  }
                >
                  <Ionicons name="create-outline" size={22} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={confirmDelete}>
                <Ionicons name="trash-outline" size={22} color="red" />
              </TouchableOpacity>
              <TouchableOpacity onPress={cancelSelection}>
                <Ionicons name="close-outline" size={22} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {!selectionMode && (
          <TouchableOpacity
            style={styles.addWardrobeBtn}
            onPress={() => router.push("profile/create-wardrobe")}
          >
            <Text style={styles.addWardrobeText}>+ Add New Wardrobe</Text>
          </TouchableOpacity>
        )}

        {wardrobes.map((w) => {
          const selected = selectedIds.includes(w._id);

          return (
            <TouchableOpacity
              key={w._id}
              onPress={() => handlePress(w)}
              onLongPress={() => handleLongPress(w._id)}
              style={[
                styles.wardrobeCard,
                selected && styles.selectedCard,
              ]}
            >
              <View
                style={[
                  styles.colorBox,
                  { backgroundColor: w.color || "#A855F7" },
                ]}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.wardrobeName}>{w.name}</Text>
                <Text style={styles.itemsCount}>
                  {w.itemCount || 0} items
                </Text>
              </View>
              <Text>{formatPrice(w.totalWorth)}</Text>
              {selectionMode ? (
                <Ionicons
                  name={selected ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color="#A855F7"
                />
              ) : (
                <Ionicons name="chevron-forward-outline" size={22} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ===============================
   STYLES
================================ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollView: { padding: 16 },
  addWardrobeBtn: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D8B4FE",
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  addWardrobeText: { color: "#A855F7", fontWeight: "600" },
  wardrobeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#F3E8FF",
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: "#A855F7",
  },
  colorBox: { width: 40, height: 40, borderRadius: 8 },
  wardrobeName: { fontWeight: "700" },
  itemsCount: { color: "#777", marginTop: 4 },
});
