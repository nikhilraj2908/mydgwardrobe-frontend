import api from "@/api/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface SuggestionItem {
  _id: string;
  category?: string;
  brand?: string;
}

export default function SearchModal({ visible, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH SUGGESTIONS ================= */
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const res = await api.get("/api/wardrobe/explore", {
          params: { search: query },
        });

        // API returns array directly
        setSuggestions(res.data || []);
      } catch (err) {
        console.log("Search suggestion error:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  /* ================= SELECT ================= */
  const handleSelect = (text: string) => {
    onClose();
    setQuery("");
    setSuggestions([]);

    router.push({
      pathname: "/(tabs)/explore",
      params: { search: text },
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Search Box */}
          <View style={styles.searchBox}>
           <Image
                        source={require("../assets/icons/search.png")}
                        style={styles.headerIcon}
                      />
            <TextInput
              autoFocus
              placeholder="Search outfits, brands..."
              placeholderTextColor="#999"
              value={query}
              onChangeText={setQuery}
              style={styles.input}
            />
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#555" />
            </TouchableOpacity>
          </View>

          {/* Suggestions */}
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item._id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const label =
                item.category || item.brand || query;

              return (
                <TouchableOpacity
                  style={styles.suggestion}
                  onPress={() => handleSelect(label)}
                >
                  <Image
                        source={require("../assets/icons/search.png")}
                        style={styles.searchIcon}
                      />
                  <Text style={styles.suggestionText}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              query && !loading ? (
                <Text style={styles.emptyText}>
                  No results found
                </Text>
              ) : null
            }
          />
        </View>
      </View>
    </Modal>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
  },
  modalContainer: {
    marginTop: 8,
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    elevation: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 30,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 15,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  suggestionText: {
    fontSize: 15,
    color: "#222",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 30,
  },
    headerIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  searchIcon:{
    width:15,
    height:15,
    marginHorizontal:10
  }
});
