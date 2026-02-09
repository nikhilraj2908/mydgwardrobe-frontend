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
import { SafeAreaView } from "react-native-safe-area-context";

type SearchItem =
  | {
    type: "item";
    _id: string;
    label: string;
  }
  | {
    type: "user";
    _id: string;
    username: string;
    photo?: string;
  };


interface Props {
  visible: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
}

interface SuggestionItem {
  _id: string;
  category?: string;
  brand?: string;
}

export default function SearchModal({ visible, onClose, onSearch }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);

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

        const [itemRes, userRes] = await Promise.all([
          api.get("/api/wardrobe/explore", {
            params: { search: query },
          }),
          api.get("/api/user/search", {
            params: { q: query },
          }),
        ]);

        const exploreItems = itemRes.data.items || [];

        // unique categories
        const categorySuggestions: SearchItem[] = Array.from(
          new Set(
            exploreItems
              .map((x: any) => x.category?.name)
              .filter(Boolean)
          )
        )
          .slice(0, 8)
          .map((cat) => ({
            type: "item",
            _id: `cat-${cat}`,
            label: cat,
          }));


        // unique brands
        const brandSuggestions: SearchItem[] = Array.from(
          new Set(exploreItems.map((x: any) => (x.brand || "").trim()).filter(Boolean))
        ).slice(0, 8).map((brand) => ({
          type: "item",
          _id: `brand-${brand}`,
          label: brand,
        }));


        const users: SearchItem[] = (userRes.data.users || []).map(
          (u: any) => ({
            type: "user",
            _id: u._id,
            username: u.username,
            photo: u.photo,
          })
        );

        setSuggestions([...users, ...categorySuggestions, ...brandSuggestions]);

      } catch (err) {
        console.log("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  /* ================= SELECT ================= */
  const handleSelect = (item: SearchItem) => {
    onClose();
    setQuery("");
    setSuggestions([]);

    if (item.type === "user") {
      router.push(`/profile/${item._id}`);
    } else {
      onSearch(item.label); // redirect through parent
    }
  };



  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
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
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => {
                  if (query.trim()) {
                    onSearch(query.trim());
                    setQuery("");
                    setSuggestions([]);
                  }
                }}
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
                if (item.type === "user") {
                  return (
                    <TouchableOpacity
                      style={styles.suggestion}
                      onPress={() => handleSelect(item)}
                    >
                      <Ionicons
                        name="person-circle-outline"
                        size={20}
                        color="#A855F7"
                        style={{ marginHorizontal: 10 }}
                      />
                      <Text style={styles.suggestionText}>
                        {item.username}
                      </Text>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    style={styles.suggestion}
                    onPress={() => handleSelect(item)}
                  >
                    <Image
                      source={require("../assets/icons/search.png")}
                      style={styles.searchIcon}
                    />
                    <Text style={styles.suggestionText}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                query && !loading ? (
                  <Text style={styles.emptyText}>No results found</Text>
                ) : null
              }
            />

          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    marginTop: 20,
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
  searchIcon: {
    width: 15,
    height: 15,
    marginHorizontal: 10
  }
});
