import api from "@/api/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState, useMemo } from "react";
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
import { useTheme } from "@/app/theme/ThemeContext";

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

export default function SearchModal({ visible, onClose, onSearch }: Props) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

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

        const brandSuggestions: SearchItem[] = Array.from(
          new Set(exploreItems.map((x: any) => (x.brand || "").trim()).filter(Boolean))
        )
          .slice(0, 8)
          .map((brand) => ({
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

  const handleSelect = (item: SearchItem) => {
    onClose();
    setQuery("");
    setSuggestions([]);

    if (item.type === "user") {
      router.push(`/profile/${item._id}`);
    } else {
      onSearch(item.label);
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
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => {
                  if (query.trim()) {
                    onSearch(query.trim());
                    setQuery("");
                    setSuggestions([]);
                  }
                }}
                style={[styles.input, { color: colors.textPrimary }]}
              />

              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
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
                        color={colors.primary}
                        style={{ marginHorizontal: 10 }}
                      />
                      <Text style={styles.suggestionText}>{item.username}</Text>
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
                      style={[styles.searchIcon, { tintColor: colors.textSecondary }]}
                    />
                    <Text style={styles.suggestionText}>{item.label}</Text>
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

const createStyles = (colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-start",
    },
    modalContainer: {
      marginTop: 30,
      marginHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 22,
      elevation: 10,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      // backgroundColor: colors.card,
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
      borderColor: colors.border,
    },
    suggestionText: {
      fontSize: 15,
      color: colors.textPrimary,
    },
    emptyText: {
      textAlign: "center",
      color: colors.textMuted,
      marginTop: 30,
    },
    headerIcon: {
      width: 24,
      height: 24,
      resizeMode: "contain",
      tintColor: colors.textSecondary,
    },
    searchIcon: {
      width: 15,
      height: 15,
      marginHorizontal: 10,
    },
  });