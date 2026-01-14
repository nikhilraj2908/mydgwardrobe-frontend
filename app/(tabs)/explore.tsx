import WardrobeHeader from "@/components/WardrobeHeader";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ListRenderItemInfo,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../api/api";
import { useSavedItems } from "../../context/SavedItemsContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 40) / 2;

interface CategoryItem {
  _id: string;
  name: string;
  type: "mens" | "womens" | "unisex";
  icon: keyof typeof Ionicons.glyphMap;
}

interface SearchUser {
  _id: string;
  username: string;
  photo?: string;
  bio?: string;
}

interface SortOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}
interface ExploreItem {
  _id: string;
  imageUrl?: string;
  images?: string[];
  likes: number;
  isLiked?: boolean;
  price?: number;
  category?: string;
  brand?: string;
  wardrobe?: {
    _id: string;
    name: string;
  };
  title?: string;
}


type SortId = "newest" | "popular" | "price-low" | "price-high";
const baseURL = api.defaults.baseURL;

// const CATEGORIES: CategoryItem[] = [
//   { id: "All", name: "All", icon: "grid-outline" },
//   { id: "Outfits", name: "Outfits", icon: "shirt-outline" },
//   { id: "Accessories", name: "Accessories", icon: "glasses-outline" },
//   { id: "Shoes", name: "Shoes", icon: "footsteps-outline" },
//   { id: "T-Shirts", name: "T-Shirts", icon: "shirt-outline" },
//   { id: "Pants", name: "Pants", icon: "body-outline" },
//   { id: "Jackets", name: "Jackets", icon: "shirt-outline" },
// ];

const SORT_OPTIONS: SortOption[] = [
  { id: "newest", label: "Newest", icon: "time-outline" },
  { id: "popular", label: "Most Popular", icon: "trending-up-outline" },
  { id: "price-low", label: "Price: Low to High", icon: "arrow-up-outline" },
  { id: "price-high", label: "Price: High to Low", icon: "arrow-down-outline" },
];

export default function Explore() {
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortId>("newest");
  const [showSortModal, setShowSortModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const params = useLocalSearchParams();
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);

  const getAvatarUrl = (photo?: string, username?: string) => {
    if (photo && photo.trim() && photo !== "null") {
      if (photo.startsWith("http")) return photo;

      // 🔑 ENSURE leading slash
      if (!photo.startsWith("/")) {
        return `https://api.digiwardrobe.com/${photo}`;
      }

      return `https://api.digiwardrobe.com${photo}`;
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      username || "User"
    )}&background=E9D5FF&color=6B21A8&size=128`;
  };
  const fetchExploreItemsWithSearch = async (searchValue: string) => {
    try {
      setLoading(true);

      const params: Record<string, any> = {
        page: 1,
        limit: 20,
        sort: sortBy,
        search: searchValue, // ✅ DIRECT VALUE
      };

      const res = await api.get("/api/wardrobe/explore", { params });

      const newItems = res.data?.items || res.data || [];
      const total = res.data?.total || newItems.length;

      setItems(newItems);
      setTotalItems(total);
      setHasMore(newItems.length === 20);
      setPage(1);
    } catch (err) {
      console.error("Explore fetch error:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.search && typeof params.search === "string") {
      const incomingSearch = params.search.trim();

      // 1️⃣ Sync UI state
      setSearch(incomingSearch);
      setActiveCategory("All");
      setPage(1);

      // 2️⃣ Fetch using the VALUE directly (not stale state)
      fetchExploreItemsWithSearch(incomingSearch);
    }
  }, [params.search]);

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toggleSave, savedItemIds } = useSavedItems();

  // Fetch like counts for items
  const fetchLikeCount = async (itemId: string) => {
    try {
      const res = await api.get(`/api/like/item/${itemId}/count`);
      return res.data.count || 0;
    } catch (err) {
      console.log("Like count fetch failed", err);
      return 0;
    }
  };

  // Fetch like status for items
  const fetchLikeStatus = async (itemId: string) => {
    try {
      const res = await api.get(`/api/like/item/${itemId}/status`);
      return res.data.liked || false;
    } catch (err) {
      console.log("Like status fetch failed", err);
      return false;
    }
  };



  // Load likes for all items
  useEffect(() => {
    const loadLikes = async () => {
      const counts: Record<string, number> = {};
      const statuses: Record<string, boolean> = {};

      for (const item of items) {
        counts[item._id] = await fetchLikeCount(item._id);
        statuses[item._id] = await fetchLikeStatus(item._id);
      }

      setLikeCounts(counts);
      setLikedItems(statuses);
    };

    if (items.length > 0) {
      loadLikes();
    }

  }, [items]);



  const handleUserPress = async (userId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        const meRes = await api.get("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ✅ If clicked user is current user
        if (String(meRes.data?._id) === String(userId)) {
          router.push("/profile");
          return;
        }
      }

      // ✅ Other user's profile
      router.push(`/profile/${userId}`);
    } catch {
      router.push(`/profile/${userId}`);
    }
  };


  /* =========================
     FETCH EXPLORE ITEMS
  ========================= */
  const fetchExploreItems = async (pageNum = 1, shouldReset = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }

      const params: Record<string, any> = {
        page: pageNum,
        limit: 20,
        sort: sortBy,
      };

      // Extract category name from the formatted string (e.g., "Shirts|mens" -> "Shirts")
      if (activeCategory !== "All") {
        // Split the formatted string to get just the category name
        const [categoryName] = activeCategory.split('|');
        params.category = categoryName;
      }

      if (search.trim()) {
        params.search = search.trim();

        // ✅ Fetch users ONLY on first page
        if (pageNum === 1) {
          try {
            const userRes = await api.get("/api/user/search", {
              params: { q: search.trim() },
            });
            setSearchUsers(userRes.data.users || []);
          } catch {
            setSearchUsers([]);
          }
        }
      } else {
        setSearchUsers([]);
      }

      console.log("Fetching with params:", params);

      const res = await api.get("/api/wardrobe/explore", { params });
      const newItems = res.data?.items || res.data || [];
      const total = res.data?.total || newItems.length;

      setTotalItems(total);

      if (shouldReset) {
        setItems(newItems);
      } else {
        setItems(prev => pageNum === 1 ? newItems : [...prev, ...newItems]);
      }

      setHasMore(newItems.length === 20);
      setPage(pageNum);
    } catch (err) {
      console.error("Explore fetch error:", err);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* =========================
     HANDLE SEARCH WITH DEBOUNCE
  ========================= */
  const handleSearchChange = (text: string) => {
    setSearch(text);
    setActiveCategory("All");   // 🔥 reset category on search
    setPage(1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchExploreItems(1, true);
    }, 500);
  };


  /* =========================
     HANDLE CATEGORY CHANGE
  ========================= */
  const handleCategoryChange = (categoryKey: string) => {
    setSearch("");            // 🔥 reset search
    setSearchUsers([]);
    setActiveCategory(categoryKey);
    setPage(1);
  };

  /* =========================
     HANDLE SORT CHANGE
  ========================= */
  const handleSortChange = (sortId: string) => {
    setSortBy(sortId as SortId);
    setShowSortModal(false);
    setPage(1);
  };

  /* =========================
     LOAD MORE ITEMS
  ========================= */
  const loadMoreItems = () => {
    if (!loading && hasMore) {
      fetchExploreItems(page + 1, false);
    }
  };

  /* =========================
     PULL TO REFRESH
  ========================= */
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExploreItems(1, true);
  };

  /* =========================
     RESET FILTERS
  ========================= */
  const resetFilters = () => {
    setActiveCategory("All");
    setSortBy("newest");
    setSearch("");
    setPage(1);
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/categories");

      const formatted: CategoryItem[] = [
        {
          _id: "All",
          name: "All",
          type: "unisex",
          icon: "grid-outline",
        },
        ...res.data.map((cat: any) => ({
          _id: `${cat.name}|${cat.type}`,             // ✅ UNIQUE KEY
          name: `${cat.name} (${cat.type})`,
          type: cat.type,             // ✅ KEEP TYPE
          icon: cat.icon || "pricetag-outline",
        })),
      ];

      setCategories(formatted);

      setCategories(formatted);
    } catch (err) {
      console.log("Category fetch error", err);
    }
  };
  /* =========================
     EFFECTS
  ========================= */
  useEffect(() => {
    fetchExploreItems(1, true);

  }, [activeCategory, sortBy]);

  /* =========================
     HANDLE LIKE
  ========================= */
  const handleLike = async (itemId: string) => {
    try {
      const wasLiked = likedItems[itemId] || false;

      // Optimistic update
      setLikedItems(prev => ({
        ...prev,
        [itemId]: !wasLiked
      }));

      setLikeCounts(prev => ({
        ...prev,
        [itemId]: wasLiked ? Math.max(0, (prev[itemId] || 0) - 1) : (prev[itemId] || 0) + 1
      }));

      // API call to toggle like
      await api.post(`/api/like/item/${itemId}/toggle`);
    } catch (error) {
      console.error("Like error:", error);
      // Revert optimistic update on error
      const wasLiked = likedItems[itemId] || false;
      setLikedItems(prev => ({
        ...prev,
        [itemId]: wasLiked
      }));
    }
  };

  /* =========================
     RENDER CATEGORY ITEM
  ========================= */
  const renderCategoryItem = ({ item }: ListRenderItemInfo<CategoryItem>) => (
    <TouchableOpacity
      onPress={() => handleCategoryChange(item._id)}
      style={[
        styles.categoryBtn,
        activeCategory === item._id && styles.activeCategory,
      ]}
    >
      <Ionicons
        name={item.icon}
        size={16}
        color={activeCategory === item._id ? "#fff" : "#666"}
        style={{ marginRight: 6 }}
      />
      <Text
        style={[
          styles.categoryText,
          activeCategory === item._id && styles.activeCategoryText,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  /* =========================
     RENDER ITEM CARD
  ========================= */
  const renderItemCard = ({ item }: ListRenderItemInfo<ExploreItem>) => {
    const isLiked = likedItems[item._id] || false;
    const isSaved = savedItemIds.includes(item._id);
    const rawPath =
      item.images?.length && item.images[0]
        ? item.images[0]
        : item.imageUrl;
    
    const imagePath = rawPath?.replace(/\\/g, "/");

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
          router.push({
            pathname: "/wardrobe/item/[id]",
            params: {
              id: item._id,
              from: "explore",
            },
          });
        }}
      >

        <Image
          source={
            imagePath
              ? { uri: `${baseURL}/${imagePath}` }
              : require("../../assets/images/icon.png")
          }
          style={styles.image}
          resizeMode="cover"
        />



        {/* Top Overlay - Like & Bookmark */}
        <View style={styles.cardTopOverlay}>
          <TouchableOpacity
            style={styles.iconRow}
            onPress={(e) => {
              e.stopPropagation();
              handleLike(item._id);
            }}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={16}
              color={isLiked ? "#FF3B30" : "#fff"}
            />
            <Text style={styles.count}>
              {likeCounts[item._id] || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              toggleSave(item._id);
            }}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Info Overlay */}
        <View style={styles.cardBottomOverlay}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.wardrobe?.name || item.title || "Untitled"}
            </Text>
            <View style={styles.itemMeta}>
              <Text style={styles.itemCategory}>
                {String(item.category ?? "Category")}
              </Text>
              <Text style={styles.itemBrand}>
                {String(item.brand ?? "Brand")}
              </Text>
            </View>
          </View>

          <View style={styles.itemPrice}>
            <Text style={styles.priceText}>₹{item.price || "N/A"}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /* =========================
     RENDER SORT MODAL
  ========================= */
  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSortModal(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.sortOption,
                  sortBy === option.id && styles.activeSortOption,
                ]}
                onPress={() => handleSortChange(option.id)}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={sortBy === option.id ? "#9b5cff" : "#666"}
                />
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option.id && styles.activeSortOptionText,
                  ]}
                >
                  {option.label}
                </Text>
                {sortBy === option.id && (
                  <Ionicons name="checkmark" size={20} color="#9b5cff" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  /* =========================
     RENDER EMPTY STATE
  ========================= */
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={80} color="#ddd" />
      <Text style={styles.emptyTitle}>No items found</Text>
      <Text style={styles.emptySubtitle}>
        {search.trim()
          ? `No results for "${search}"`
          : activeCategory !== "All"
            ? `No ${activeCategory.toLowerCase()} found`
            : "No public items available"}
      </Text>
      {(search.trim() || activeCategory !== "All") && (
        <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
          <Text style={styles.resetButtonText}>Reset Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  /* =========================
     RENDER HEADER
  ========================= */
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#999" />
        <TextInput
          placeholder="Search outfits, styles, brands..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={search}
          onChangeText={handleSearchChange}
          returnKeyType="search"
        />


      </View>


      <View style={styles.categoryContainer}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          renderItem={renderCategoryItem}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.resultsText}>
          {search.trim()
            ? `${totalItems} items • ${searchUsers.length} people`
            : `${totalItems} ${totalItems === 1 ? "item" : "items"} found`}
        </Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="options-outline" size={18} color="#666" />
          <Text style={styles.sortButtonText}>Sort</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <WardrobeHeader
        onBack={() => router.back()}
        title="Explore"
        showFilters={false}
      />

      <View style={styles.container}>
        {renderHeader()}
        {search.trim() && searchUsers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Users</Text>

            {searchUsers.map(user => (
              <TouchableOpacity
                key={user._id}
                style={styles.userCard}
                activeOpacity={0.85}
                onPress={() => handleUserPress(user._id)}
              >
                <Image
                  source={{ uri: getAvatarUrl(user.photo, user.username) }}
                  style={styles.userAvatar}
                  resizeMode="cover"
                  onError={() => {
                    console.log("Avatar failed for:", user.username, user.photo);
                  }}
                />

                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{user.username}</Text>
                  <Text style={styles.userMeta}>@{user.username}</Text>
                </View>

                <TouchableOpacity style={styles.followBtn}>
                  <Text style={styles.followText}>Follow</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {loading && page === 1 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9b5cff" />
            <Text style={styles.loadingText}>Loading items...</Text>
          </View>
        ) : (
          <FlatList<ExploreItem>
            data={items}
            numColumns={2}
            keyExtractor={(item) => item._id}
            renderItem={renderItemCard}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={[
              styles.itemsContainer,
              items.length === 0 && { flex: 1 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#9b5cff"]}
                tintColor="#9b5cff"
              />
            }
            onEndReached={loadMoreItems}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              search.trim() && searchUsers.length > 0
                ? null
                : renderEmptyState()
            }
            ListFooterComponent={
              loading && page > 1 ? (
                <ActivityIndicator size="small" color="#9b5cff" style={{ marginVertical: 20 }} />
              ) : null
            }
          />
        )}
      </View>

      {renderSortModal()}
    </View>
  );
}

/* =========================
   STYLES
========================= */
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 15,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "#fff",
  },

  // Search Box
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f7",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: "#333",
  },

  // Categories
  categoryContainer: {
    marginBottom: 16,
  },
  categoryList: {
    paddingRight: 16,
  },
  categoryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f5f5f7",
    borderRadius: 25,
    marginRight: 10,
  },
  activeCategory: {
    backgroundColor: "#9b5cff",
  },
  categoryText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  activeCategoryText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Filter Row
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f5f5f7",
    borderRadius: 20,
  },
  sortButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginLeft: 6,
  },

  // Items Grid
  itemsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 12,
  },

  // Card
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f8f8f9",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  cardTopOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  count: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  cardBottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemInfo: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemCategory: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginRight: 8,
  },
  itemBrand: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
  itemPrice: {
    backgroundColor: "#9b5cff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: "#9b5cff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Sort Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f7",
  },
  activeSortOption: {
    backgroundColor: "#f9f5ff",
  },
  sortOptionText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
  activeSortOptionText: {
    color: "#9b5cff",
    fontWeight: "600",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    margin: 10,

  },

  // USERS
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
    margin: 14,
  },
  userAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
  },
  userMeta: {
    fontSize: 13,
    color: "#888",
  },
  followBtn: {
    backgroundColor: "#9b5cff",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followText: {
    color: "#fff",
    fontWeight: "600",
  },

  // SEARCH ITEM
  searchItemCard: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  searchItemImage: {
    width: "100%",
    height: "100%",
  },
  searchItemOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  searchItemTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  searchItemUser: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  searchItemUserText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 13,
  },

});