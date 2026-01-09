import WardrobeHeader from "@/components/WardrobeHeader";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
import { useLocalSearchParams } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 40) / 2;

interface CategoryItem {
  _id: string;
  name: string;
  type: "mens" | "womens" | "unisex";
  icon: keyof typeof Ionicons.glyphMap;
}


interface SortOption {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}
interface ExploreItem {
  _id: string;
  imageUrl: string;
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

  useEffect(() => {
    if (params.search && typeof params.search === "string") {
      setSearch(params.search);
    }
  }, [params.search]);
  useEffect(() => {
    if (search.trim()) {
      fetchExploreItems(1, true);
    }
  }, [search]);

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

      if (activeCategory !== "All") {
        params.category = activeCategory;
      }

      if (search.trim()) {
        params.search = search.trim();
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
  const handleCategoryChange = (categoryName: string) => {
    setActiveCategory(categoryName);
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
          _id: "all",
          name: "All",
          type: "unisex",
          icon: "grid-outline",
        },
        ...res.data.map((cat: any) => ({
          _id: cat._id,               // ✅ UNIQUE KEY
          name: cat.name,
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
      onPress={() => handleCategoryChange(item.name)}
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

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => {
          router.push(`/wardrobe/item/${item._id}`);
        }}
      >
        <Image
          source={{ uri: `${baseURL}/${item.imageUrl}` }}
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
              <Text style={styles.itemCategory}>{item.category || "Category"}</Text>
              <Text style={styles.itemBrand}>{item.brand || "Brand"}</Text>
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
        {search.trim() && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
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
          {totalItems} {totalItems === 1 ? "item" : "items"} found
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
            ListEmptyComponent={renderEmptyState()}
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
});