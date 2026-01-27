import WardrobeHeader from "@/components/WardrobeHeader";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useRef, useState, useMemo } from "react";

import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ListRenderItemInfo,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  BackHandler,
  ScrollView
} from "react-native";
import api from "../../api/api";
import { useSavedItems } from "../../context/SavedItemsContext";
import AppBackground from "@/components/AppBackground";
import { useLocalSearchParams } from "expo-router";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const GAP = 8;
const COLUMN_WIDTH = (SCREEN_WIDTH - (GAP * (NUM_COLUMNS + 1))) / NUM_COLUMNS;
import { resolveImageUrl } from "@/utils/resolveImageUrl";

interface CategoryItem {
  _id: string;
  name: string;
  type: "mens" | "womens" | "unisex";
  icon: keyof typeof Ionicons.glyphMap;
  image?: string;
  description?: string;
  itemCount?: number;
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

const SORT_OPTIONS: SortOption[] = [
  { id: "newest", label: "Newest", icon: "time-outline" },
  { id: "popular", label: "Most Popular", icon: "trending-up-outline" },
  { id: "price-low", label: "Price: Low to High", icon: "arrow-up-outline" },
  { id: "price-high", label: "Price: High to Low", icon: "arrow-down-outline" },
];

// ================== PRE-IMPORT ALL CATEGORY IMAGES ==================

// Mens Category Images
const mensCategoryImages = {
  "accessories": require("../../assets/categories/mens-category/Accessories.png"),
  "t-shirts": require("../../assets/categories/mens-category/T-Shirts.png"),
  "shirts": require("../../assets/categories/mens-category/Shirts.png"),
  "cardigans": require("../../assets/categories/mens-category/Cardigans.png"),
  "blazers": require("../../assets/categories/mens-category/Blazers.png"),
  "dhotis": require("../../assets/categories/mens-category/Dhotis.png"),
  "joggers": require("../../assets/categories/mens-category/Joggers.png"),
  "pants": require("../../assets/categories/mens-category/Pants.png"),
  "cargos": require("../../assets/categories/mens-category/Cargos.png"),
  "kurtas": require("../../assets/categories/mens-category/Kurtas.png"),
  "pajamas": require("../../assets/categories/mens-category/Pajamas.png"),
  "sherwanis": require("../../assets/categories/mens-category/Sherwanis.png"),
  "poloshirts": require("../../assets/categories/mens-category/PoloShirts.png"),
  "lifestyle": require("../../assets/categories/mens-category/Lifestyle.png"),
  "casualwears": require("../../assets/categories/mens-category/CasualWear.png"),
  "socks": require("../../assets/categories/mens-category/Socks.png"),
  "suits": require("../../assets/categories/mens-category/Suits.png"),
  "swimwear": require("../../assets/categories/mens-category/Swimwear.png"),
  "tank-tops": require("../../assets/categories/mens-category/TankTops.png"),
  "vests": require("../../assets/categories/mens-category/Vests.png"),
  "underwear": require("../../assets/categories/mens-category/Underwear.png"),
  "thermals": require("../../assets/categories/mens-category/Thermals.png"),
  "denimjacket": require("../../assets/categories/mens-category/DenimJackets.png"),
  "coats": require("../../assets/categories/mens-category/Coats.png"),
  "chinos": require("../../assets/categories/mens-category/Chinos.png"),
  "jeans": require("../../assets/categories/mens-category/Jeans.png"),
  "shorts": require("../../assets/categories/mens-category/Shorts.png"),
  "jackets": require("../../assets/categories/mens-category/Jackets.png"),
  "sweaters": require("../../assets/categories/mens-category/Sweaters.png"),
  "hoodies": require("../../assets/categories/mens-category/Hoodies.png"),
  "formalwear": require("../../assets/categories/mens-category/FormalWear.png"),
  "default": require("../../assets/categories/mens-category/default.png"),
  "sportswear": require("../../assets/categories/mens-category/Sportswear.png"),
  "traditionalwears": require("../../assets/categories/mens-category/TraditionalWear.png"),
};

// Womens Category Images
const womensCategoryImages = {
  "accessories": require("../../assets/categories/womens-category/Accessories.png"),
  "anarkalis": require("../../assets/categories/womens-category/Anarkalis.png"),
  "t-shirts": require("../../assets/categories/womens-category/T-Shirts.png"),
  "shirts": require("../../assets/categories/womens-category/Shirts.png"),
  "jeans": require("../../assets/categories/womens-category/Jeans.png"),
  "shorts": require("../../assets/categories/womens-category/Shorts.png"),
  "jackets": require("../../assets/categories/womens-category/Jackets.png"),
  "sweaters": require("../../assets/categories/womens-category/Sweaters.png"),
  "hoodies": require("../../assets/categories/womens-category/Hoodies.png"),
  "dresses": require("../../assets/categories/womens-category/Dresses.png"),
  "skirts": require("../../assets/categories/womens-category/Skirts.png"),
  "blouses": require("../../assets/categories/womens-category/Blouse.png"),
  "bras": require("../../assets/categories/womens-category/Bikinis.png"),
  "bikinis": require("../../assets/categories/womens-category/Bikinis.png"),
  "blazers": require("../../assets/categories/womens-category/Blazers.png"),
  "tops": require("../../assets/categories/womens-category/Tops.png"),
  "coats": require("../../assets/categories/womens-category/Coats.png"),
  "cardigans": require("../../assets/categories/womens-category/Cardigans.png"),
  "casualwears": require("../../assets/categories/womens-category/CasualWear.png"),
  "capris": require("../../assets/categories/womens-category/Capris.png"),
  "gowns": require("../../assets/categories/womens-category/Gowns.png"),
  "kurtis": require("../../assets/categories/womens-category/Kurtis.png"),
  "jumpsuits": require("../../assets/categories/womens-category/Jumpsuits.png"),
  "leggings": require("../../assets/categories/womens-category/Leggings.png"),
  "lehengas": require("../../assets/categories/womens-category/Lehengas.png"),
  "lingerie": require("../../assets/categories/womens-category/Lingerie.png"),
  "nightwear": require("../../assets/categories/womens-category/Nightwear.png"),
  "pajamas": require("../../assets/categories/womens-category/Pajamas.png"),
  "palazzos": require("../../assets/categories/womens-category/Palazzos.png"),
  "sarees": require("../../assets/categories/womens-category/Sarees.png"),
  "socks": require("../../assets/categories/womens-category/Socks.png"),
  "rompers": require("../../assets/categories/womens-category/Rompers.png"),
  "suits": require("../../assets/categories/womens-category/Rompers.png"),
  "sportswear": require("../../assets/categories/womens-category/Sportswear.png"),
  "swimwear": require("../../assets/categories/womens-category/Sportswear.png"),
  "trouser": require("../../assets/categories/womens-category/Trouser.png"),
  "panties": require("../../assets/categories/womens-category/Panties.png"),
  "traditionalwears": require("../../assets/categories/womens-category/TraditionalWear.png"),
  "tank-tops": require("../../assets/categories/womens-category/TankTops.png"),
  "default": require("../../assets/categories/womens-category/default.png"),
  "vests": require("../../assets/categories/womens-category/Vests.png"),
  "formalwear": require("../../assets/categories/womens-category/FormalWear.png"),
  "SalwarSuits": require("../../assets/categories/womens-category/SalwarSuits.png"),
};

// Common category names mapping to clean names
const categoryNameMapping: Record<string, string> = {
  "accessories": "accessories",
  "t-shirts": "t-shirts",
  "t shirts": "t-shirts",
  "tshirts": "t-shirts",
  "shirts": "shirts",
  "pants": "pants",
  "trousers": "pants",
  "jeans": "jeans",
  "shorts": "shorts",
  "jackets": "jackets",
  "sweaters": "sweaters",
  "hoodies": "hoodies",
  "dresses": "dresses",
  "skirts": "skirts",
  "blouses": "blouses",
  "bra": "bra",
  "Bikinis": "Bikini",
  "tops": "tops",
  "shoes": "shoes",
  "footwear": "shoes",
  "bags": "bags",
  "Capris": "Capris",
  "handbags": "bags",
  "watches": "watches",
  "jewelry": "jewelry",
  "jewellery": "jewelry",
  "sunglasses": "accessories",
  "belts": "accessories",
  "wallets": "accessories",
  "hats": "accessories",
  "caps": "accessories",
  "scarves": "accessories",
  "gloves": "accessories",
  "underwear": "underwear",
  "lingerie": "lingerie",
  "swimwear": "swimwear",
  "swimsuits": "swimwear",
  "activewear": "activewear",
  "formalwear": "formalwear",
  "suits": "formalwear",
  "blazers": "blazers",
  "coats": "coats",
  "raincoats": "coats",
  "tank tops": "tank-tops",
  "tanktops": "tank-tops",
  "rompers": "rompers",
  "jumpsuits": "jumpsuits",
  "palazzos": "palazzos",
  "leggings": "leggings",
  "cardigans": "cardigans",
  "pullovers": "pullovers",
  "hooded": "hoodies",
  "denim": "jeans",
  "casual wear": "casualwears",

  // Add these mappings for missing categories:
  "casualwear": "casualwears",
  "denim jacket": "denimjacket",
  "denimjacket": "denimjacket",
  "formal wear": "formalwear",
  "leather jackets": "jackets",
  "poloshirts": "poloshirts",
  "sports wear": "sportswear",
  "sportswear": "sportswear",
  "straight fit": "pants",
  "straightfit": "pants",
  "sweatshirts": "sweatshirts",
  "track pants": "pants",
  "traditional wear": "traditionalwears",
  "traditionalwear": "traditionalwears",

  // Women's specific categories:
  "salwar suit": "SalwarSuits",
  "salwar suits": "SalwarSuits",
  "salwar-suit": "SalwarSuits",
  "stockings": "socks",
  "vests": "vests",

  // Ensure consistent naming:
  "lether jeckets": "jackets",
  "polo shirts": "poloshirts",
  "sweatrshirts": "sweatshirts",
  "sweat shirts": "sweatshirts",
  "tradional wear": "traditionalwears",
  "fromal wear": "formalwear",
};

// Helper function to get category image based on name and gender
const getCategoryImage = (categoryName: string, gender: "mens" | "womens" | "unisex"): any => {
  const cleanName = categoryName.toLowerCase();
  let imageKey = categoryNameMapping[cleanName] || categoryNameMapping[cleanName.replace(/\s+/g, '-')] || cleanName;

  const possibleKeys = [
    imageKey,
    imageKey.toLowerCase().replace(/\s+/g, '-'),
    imageKey.toLowerCase().replace(/[^\w]/g, ''),
    imageKey.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toLowerCase()
    ),
  ];

  if (gender === "mens" || gender === "unisex") {
    for (const key of possibleKeys) {
      if (mensCategoryImages[key]) {
        return mensCategoryImages[key];
      }
    }
    return mensCategoryImages["default"];
  } else if (gender === "womens") {
    for (const key of possibleKeys) {
      if (womensCategoryImages[key]) {
        return womensCategoryImages[key];
      }
    }
    return womensCategoryImages["default"];
  }

  return require("../../assets/images/icon.png");
};

// Helper to split data into columns for masonry layout
const splitIntoColumns = <T,>(data: T[], numColumns: number = 2): T[][] => {
  const columns: T[][] = Array.from({ length: numColumns }, () => []);

  data.forEach((item, index) => {
    const columnIndex = index % numColumns;
    columns[columnIndex].push(item);
  });

  return columns;
};

// Function to generate dynamic heights for collage effect
const getRandomHeight = (baseHeight: number, index: number): number => {
  const patterns = [
    baseHeight * 0.8,
    baseHeight * 1.2,
    baseHeight * 1.4,
    baseHeight * 1.0,
    baseHeight * 1.3,
    baseHeight * 0.9,
  ];

  return patterns[index % patterns.length];
};

export default function Explore() {
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortId>("newest");
  const [showSortModal, setShowSortModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likedItems, setLikedItems] = useState<Record<string, boolean>>({});
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryItem[]>([]);
  const [searchUsers, setSearchUsers] = useState<SearchUser[]>([]);
  const [mode, setMode] = useState<"categories" | "items">("categories");
  const [selectedGender, setSelectedGender] = useState<"mens" | "womens" | "unisex">("mens");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    categories: CategoryItem[];
    users: SearchUser[];
  }>({ categories: [], users: [] });
  const { q } = useLocalSearchParams<{ q?: string }>();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toggleSave, savedItemIds } = useSavedItems();
  useEffect(() => {
    if (!q || typeof q !== "string") return;

    // fill input
    setSearch(q);
    setIsSearching(true);

    // run the same explore search logic you already use
    handleSearchChange(q);

  }, [q]);
  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, [selectedGender]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/categories");
      const allCategories = res.data || [];

      const filtered = allCategories.filter((cat: CategoryItem) => {
        if (selectedGender === "unisex") return true;
        return cat.type === selectedGender || cat.type === "unisex";
      });

      setCategories(allCategories);
      setFilteredCategories(filtered);
    } catch (err) {
      console.log("Category fetch error", err);
    }
  };

  // Handle category selection
  // const handleCategorySelect = (category: CategoryItem) => {
  //   setActiveCategory(category.name);
  //   setMode("items");
  //   setItems([]);
  //   setPage(1);
  //   fetchItemsByCategory(category.name, 1, true);
  // };
  const handleCategorySelect = (category: CategoryItem) => {
    setActiveCategory(category.name);
    setMode("items");
    setItems([]);
    setPage(1);
    setHasMore(true);
  };

  // Fetch items by category
  const fetchItemsByCategory = async (categoryName: string, pageNum = 1, shouldReset = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }

      const params: Record<string, any> = {
        page: pageNum,
        limit: 20,
        sort: sortBy,
        category: categoryName,
      };

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
      console.error("Category items fetch error:", err);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Back handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isSearching && search.trim()) {
          setSearch("");
          setIsSearching(false);
          return true;
        }
        if (mode === "items") {
          setMode("categories");
          setActiveCategory(null);
          return true;
        }
        return false;
      }
    );
    return () => backHandler.remove();
  }, [mode, isSearching, search]);

  useEffect(() => {
    if (q && typeof q === "string") {
      setSearch(q);
      setIsSearching(true);
      performSearch(q);
    }
  }, [q]);


  useEffect(() => {
    if (mode === "items" && activeCategory) {
      setItems([]);
      setPage(1);
      setHasMore(true);
      fetchItemsByCategory(activeCategory, 1, true);
    }
  }, [activeCategory, sortBy]);

  // Enhanced getCategoryImage function
  const getCategoryImageForItem = (category: CategoryItem) => {
    const categoryName = category.name.toLowerCase();
    let cleanName = categoryNameMapping[categoryName];

    if (!cleanName) {
      cleanName = categoryName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]/g, '')
        .replace(/-+/g, '-');
    }

    const genderToUse = category.type === "unisex" ? selectedGender : category.type;
    return getCategoryImage(category.name, genderToUse);
  };

  // Render category card with collage style
  const renderCategoryCard = (item: CategoryItem, index: number, columnIndex: number) => {
    const imageSource = getCategoryImageForItem(item);
    const cardHeight = getRandomHeight(COLUMN_WIDTH * 1.2, index * (columnIndex + 1));

    return (
      <TouchableOpacity
        style={[styles.categoryCard, {
          width: COLUMN_WIDTH,
          height: cardHeight,
          marginBottom: GAP,
        }]}
        onPress={() => handleCategorySelect(item)}
        activeOpacity={0.9}
      >
        <Image
          source={imageSource}
          style={[styles.categoryImage, {
            transform: [{ scale: index % 3 === 0 ? 1.1 : 1 }]
          }]}
          resizeMode="cover"
        />

        {/* Gradient Overlay */}
        <View style={styles.categoryGradient}>
          <View style={styles.categoryOverlay}>
            <Text style={styles.categoryTitle} numberOfLines={1}>
              {item.name}
            </Text>
            {item.itemCount !== undefined && (
              <Text style={styles.categoryCount}>
                {item.itemCount} {item.itemCount === 1 ? "item" : "items"}
              </Text>
            )}
          </View>
        </View>

        {/* Decorative element for some cards */}
        {(index % 5 === 0 || index % 7 === 0) && (
          <View style={[styles.collageBadge, {
            backgroundColor: index % 2 === 0 ? '#A855F7' : '#10B981'
          }]}>
            <Ionicons
              name={index % 2 === 0 ? "trending-up" : "flash"}
              size={12}
              color="#fff"
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Fetch like data
  const fetchLikeCount = async (itemId: string) => {
    try {
      const res = await api.get(`/api/like/item/${itemId}/count`);
      return res.data.count || 0;
    } catch (err) {
      console.log("Like count fetch failed", err);
      return 0;
    }
  };

  const fetchLikeStatus = async (itemId: string) => {
    try {
      const res = await api.get(`/api/like/item/${itemId}/status`);
      return res.data.liked || false;
    } catch (err) {
      console.log("Like status fetch failed", err);
      return false;
    }
  };

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

  // Render item card with collage style
  const renderItemCard = (item: ExploreItem, index: number, columnIndex: number) => {
    const isLiked = likedItems[item._id] || false;
    const isSaved = savedItemIds.includes(item._id);
    const rawPath =
      item.images?.length && item.images[0]
        ? item.images[0]
        : item.imageUrl;

    const imageUrl = resolveImageUrl(rawPath);


    const cardHeight = getRandomHeight(COLUMN_WIDTH * 1.5, index * (columnIndex + 1));
    const borderRadius = [18, 14, 22, 16, 20][index % 5];
    const rotation = index % 7 === 0 ? '0.5deg' : index % 7 === 1 ? '-0.3deg' : '0deg';

    return (
      <TouchableOpacity
        style={[styles.card, {
          width: COLUMN_WIDTH,
          height: cardHeight,
          borderRadius,
          marginBottom: GAP,
        }]}
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
            imageUrl
              ? { uri: imageUrl }
              : require("../../assets/images/icon.png")
          }
          style={styles.image}
          resizeMode="cover"
        />

        {/* Top Overlay */}
        <View style={styles.cardTopOverlay}>
          <TouchableOpacity
            style={[styles.iconRow, {
              backgroundColor: index % 3 === 0 ? 'rgba(0,0,0,0.6)' : 'rgba(168, 85, 247, 0.8)'
            }]}

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
            style={styles.bookmarkBtn}
            onPress={(e) => {
              e.stopPropagation();
              toggleSave(item._id);
            }}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={18}
              color={isSaved ? "#A855F7" : "#fff"}
            />
          </TouchableOpacity>
        </View>

        {/* Bottom Info Overlay */}
        <View style={[styles.cardBottomOverlay, {
          backgroundColor: index % 4 === 0 ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.65)'
        }]}>
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.wardrobe?.name || item.title || "Untitled"}
            </Text>
            <View style={styles.itemMeta}>

              <Text style={styles.itemBrand}>
                {String(item.brand || "Brand")}
              </Text>
            </View>
          </View>

          <View style={[styles.itemPrice, {
            backgroundColor: index % 2 === 0 ? '#10B981' : '#A855F7'
          }]}>
            <Text style={styles.priceText}>₹{item.price || "N/A"}</Text>
          </View>
        </View>

        {/* Optional decorative border */}
        {index % 6 === 0 && (
          <View style={[styles.collageBorder, {
            borderColor: index % 3 === 0 ? '#A855F7' : '#F59E0B'
          }]} />
        )}
      </TouchableOpacity>
    );
  };

  const handleLike = async (itemId: string) => {
    try {
      const wasLiked = likedItems[itemId] || false;

      setLikedItems(prev => ({
        ...prev,
        [itemId]: !wasLiked
      }));

      setLikeCounts(prev => ({
        ...prev,
        [itemId]: wasLiked ? Math.max(0, (prev[itemId] || 0) - 1) : (prev[itemId] || 0) + 1
      }));

      await api.post(`/api/like/item/${itemId}/toggle`);
    } catch (error) {
      console.error("Like error:", error);
      const wasLiked = likedItems[itemId] || false;
      setLikedItems(prev => ({
        ...prev,
        [itemId]: wasLiked
      }));
    }
  };

  // Split data into columns for masonry layout
  const categoryColumns = useMemo(() =>
    splitIntoColumns(filteredCategories, NUM_COLUMNS),
    [filteredCategories]
  );

  const itemColumns = useMemo(() =>
    splitIntoColumns(items, NUM_COLUMNS),
    [items]
  );

  // Header for categories view
  const renderCategoriesHeader = () => (
    <View style={styles.categoriesHeader}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            placeholder="Search outfits, styles, brands, users..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={search}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {search.trim() ? (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {!isSearching && (
        <View style={styles.genderToggleContainer}>
          <TouchableOpacity
            style={[
              styles.genderToggle,
              selectedGender === "mens" && styles.genderToggleActive
            ]}
            onPress={() => setSelectedGender("mens")}
          >
            <Ionicons
              name="male-outline"
              size={20}
              color={selectedGender === "mens" ? "#fff" : "#666"}
            />
            <Text style={[
              styles.genderToggleText,
              selectedGender === "mens" && styles.genderToggleTextActive
            ]}>
              Men
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderToggle,
              selectedGender === "womens" && styles.genderToggleActive
            ]}
            onPress={() => setSelectedGender("womens")}
          >
            <Ionicons
              name="female-outline"
              size={20}
              color={selectedGender === "womens" ? "#fff" : "#666"}
            />
            <Text style={[
              styles.genderToggleText,
              selectedGender === "womens" && styles.genderToggleTextActive
            ]}>
              Women
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderToggle,
              selectedGender === "unisex" && styles.genderToggleActive
            ]}
            onPress={() => setSelectedGender("unisex")}
          >
            <Ionicons
              name="people-outline"
              size={20}
              color={selectedGender === "unisex" ? "#fff" : "#666"}
            />
            <Text style={[
              styles.genderToggleText,
              selectedGender === "unisex" && styles.genderToggleTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Header for items view
  const renderItemsHeader = () => (
    <View style={styles.itemsHeader}>
      <View style={styles.itemsHeaderTop}>
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
      {activeCategory && (
        <View style={styles.activeCategoryContainer}>
          <Text style={styles.activeCategoryText}>Category: {activeCategory}</Text>
          <TouchableOpacity
            style={styles.backToCategories}
            onPress={() => {
              setMode("categories");
              setActiveCategory(null);
            }}
          >
            <Ionicons name="grid-outline" size={16} color="#A855F7" />
            <Text style={styles.backToCategoriesText}>All Categories</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render search results
  const renderSearchResults = () => {
    if (search.trim() === "") return null;

    return (
      <View style={styles.searchResultsContainer}>
        {/* Users Section */}
        {searchResults.users.length > 0 && (
          <View style={styles.searchSection}>
            <Text style={styles.searchSectionTitle}>Users</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.usersScrollView}>
              {searchResults.users.map((user) => {
                const avatarUrl = user.photo
                  ? resolveImageUrl(user.photo)
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user.username || "User"
                  )}&background=E9D5FF&color=6B21A8&size=128`;

                return (
                  <TouchableOpacity
                    key={user._id}
                    style={styles.userCard}
                    activeOpacity={0.85}
                    onPress={() => handleUserPress(user._id)}
                  >
                    <Image
                      source={{ uri: avatarUrl }}
                      style={styles.userAvatar}
                      resizeMode="cover"
                    />

                    <Text style={styles.userName} numberOfLines={1}>
                      {user.username}
                    </Text>
                  </TouchableOpacity>
                );
              })}

            </ScrollView>
          </View>
        )}

        {/* Categories Section */}
        {searchResults.categories.length > 0 && (
          <View style={styles.searchSection}>
            <Text style={styles.searchSectionTitle}>Categories</Text>
            <View style={styles.categoriesGrid}>
              {searchResults.categories.map((category, index) => (
                <TouchableOpacity
                  key={category._id}
                  style={styles.searchCategoryCard}
                  onPress={() => handleCategorySelect(category)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={getCategoryImageForItem(category)}
                    style={styles.searchCategoryImage}
                    resizeMode="cover"
                  />
                  <View style={styles.searchCategoryOverlay}>
                    <Text style={styles.searchCategoryTitle} numberOfLines={1}>
                      {category.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* No Results */}
        {search.trim() && searchResults.categories.length === 0 && searchResults.users.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color="#E5E7EB" />
            <Text style={styles.noResultsText}>No results found for "{search}"</Text>
          </View>
        )}
      </View>
    );
  };

  // Masonry List Component
  const MasonryList = ({
    data,
    renderItem,
    keyExtractor,
    isCategories = false
  }: {
    data: any[];
    renderItem: (item: any, index: number, columnIndex: number) => JSX.Element;
    keyExtractor: (item: any) => string;
    isCategories?: boolean;
  }) => {
    const columns = splitIntoColumns(data, NUM_COLUMNS);

    if (data.length === 0 && loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A855F7" />
        </View>
      );
    }

    if (data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color="#E5E7EB" />
          <Text style={styles.emptyText}>
            {isCategories ? "No categories found" : "No items found in this category"}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.masonryContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          mode === "items" ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => activeCategory && fetchItemsByCategory(activeCategory, 1, true)}
              colors={["#A855F7"]}
              tintColor="#A855F7"
            />
          ) : undefined
        }
        onScroll={({ nativeEvent }) => {
          if (mode === "items" && !loading && hasMore && activeCategory) {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToBottom = layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 100;

            if (isCloseToBottom) {
              fetchItemsByCategory(activeCategory, page + 1, false);
            }
          }
        }}
        scrollEventThrottle={400}
      >
        <View style={styles.masonryRow}>
          {columns.map((column, columnIndex) => (
            <View key={`column-${columnIndex}`} style={styles.column}>
              {column.map((item, index) => (
                <View key={keyExtractor(item)}>
                  {renderItem(item, index, columnIndex)}
                </View>
              ))}
            </View>
          ))}
        </View>

        {mode === "items" && loading && page > 1 && (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color="#A855F7" />
          </View>
        )}
      </ScrollView>
    );
  };

  // Helper functions
  const getAvatarUrl = (photo?: string, username?: string) => {
    if (photo && photo.trim() && photo !== "null") {
      if (photo.startsWith("http")) return photo;
      if (!photo.startsWith("/")) {
        return `https://api.digiwardrobe.com/${photo}`;
      }
      return `https://api.digiwardrobe.com${photo}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      username || "User"
    )}&background=E9D5FF&color=6B21A8&size=128`;
  };

  const handleUserPress = async (userId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const meRes = await api.get("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (String(meRes.data?._id) === String(userId)) {
          router.push("/profile");
          return;
        }
      }
      router.push(`/profile/${userId}`);
    } catch {
      router.push(`/profile/${userId}`);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearch(text);
    setIsSearching(text.trim().length > 0);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (text.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(text);
      }, 300);
    } else {
      setSearchResults({ categories: [], users: [] });
    }
  };

  const performSearch = async (searchValue: string) => {
    try {
      // Search users
      const userRes = await api.get("/api/user/search", {
        params: { q: searchValue.trim() },
      });
      const users = userRes.data.users || [];

      // Filter categories based on search term (case-insensitive)
      const searchTerm = searchValue.toLowerCase().trim();
      const filteredCategories = categories.filter(category => {
        const categoryName = category.name.toLowerCase();

        // Check if search term matches category name or related terms
        if (categoryName.includes(searchTerm)) {
          return true;
        }

        // Check for related terms (e.g., "shirt" should match "t-shirt", "polo shirt", etc.)
        const relatedTerms: Record<string, string[]> = {
          "shirt": ["shirt", "t-shirt", "tshirt", "polo", "poloshirt", "blouse", "top"],
          "pant": ["pant", "trouser", "jeans", "leggings", "cargo", "chino"],
          "jacket": ["jacket", "coat", "blazer", "hoodie", "sweater"],
          "shoe": ["shoe", "sneaker", "footwear", "boot", "sandal"],
          "dress": ["dress", "gown", "frock", "jumpsuit", "romper"],
          "accessory": ["accessory", "watch", "belt", "bag", "wallet", "jewelry"],
        };

        // Check if any related term matches
        for (const [key, terms] of Object.entries(relatedTerms)) {
          if (searchTerm.includes(key) || searchTerm === key) {
            for (const term of terms) {
              if (categoryName.includes(term)) {
                return true;
              }
            }
          }
        }

        return false;
      });

      setSearchResults({
        categories: filteredCategories,
        users: users
      });
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults({ categories: [], users: [] });
    }
  };

  const clearSearch = () => {
    setSearch("");
    setIsSearching(false);
    setSearchResults({ categories: [], users: [] });
  };

  return (
    <AppBackground>
      <View style={styles.screenContainer}>
        <WardrobeHeader
          onBack={() => {
            if (isSearching && search.trim()) {
              clearSearch();
              return;
            }
            if (mode === "items") {
              setMode("categories");
              setActiveCategory(null);
              return;
            }
            router.back();
          }}
          title={mode === "categories" ? "Explore" : activeCategory || "Items"}
          showFilters={false}
        />

        {mode === "categories" ? (
          <>
            {renderCategoriesHeader()}
            {isSearching ? (
              <ScrollView
                style={styles.searchResultsScrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {renderSearchResults()}
              </ScrollView>
            ) : (
              <MasonryList
                data={filteredCategories}
                renderItem={renderCategoryCard}
                keyExtractor={(item: CategoryItem) => item._id}
                isCategories={true}
              />
            )}
          </>
        ) : (
          <>
            {renderItemsHeader()}
            <MasonryList
              data={items}
              renderItem={renderItemCard}
              keyExtractor={(item: ExploreItem) => item._id}
            />
          </>
        )}

        {renderSortModal()}
      </View>
    </AppBackground>
  );

  // Sort Modal Component
  function renderSortModal() {
    return (
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
                  onPress={() => {
                    setSortBy(option.id as SortId);
                    setShowSortModal(false);
                  }}

                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={sortBy === option.id ? "#A855F7" : "#666"}
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
                    <Ionicons name="checkmark" size={20} color="#A855F7" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  }
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingTop: 5
  },
  container: {
    flex: 1,
  },

  // Categories View
  categoriesHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffffff",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    marginRight: 12,
    color: "#333",
  },
  genderToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  genderToggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: "#ffffffff",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  genderToggleActive: {
    backgroundColor: "#A855F7",
    borderColor: "#A855F7",
  },
  genderToggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginLeft: 6,
  },
  genderToggleTextActive: {
    color: "#fff",
  },

  // Search Results
  searchResultsScrollView: {
    flex: 1,
  },
  searchResultsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },
  usersScrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  userCard: {
    alignItems: "center",
    marginRight: 16,
    width: 80,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  userName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  searchCategoryCard: {
    width: (SCREEN_WIDTH - 48) / 3,
    height: 100,
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f8f8f9",
  },
  searchCategoryImage: {
    width: "100%",
    height: "100%",
  },
  searchCategoryOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  searchCategoryTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },

  // Masonry Layout
  masonryContainer: {
    flex: 1,
    paddingHorizontal: GAP,
  },
  masonryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  column: {
    flex: 1,
  },

  // Category Cards
  categoryCard: {
    overflow: "hidden",
    backgroundColor: "#f8f8f9",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  categoryGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "transparent",
    backgroundGradient: "vertical",
    backgroundGradientTop: "transparent",
    backgroundGradientBottom: "rgba(0,0,0,0.8)",
  },
  categoryOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "transparent",
  },
  categoryTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  categoryCount: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    fontWeight: "500",
  },
  collageBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },

  // Items View
  itemsHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  itemsHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  activeCategoryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  activeCategoryText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  backToCategories: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#F3E8FF",
    borderRadius: 12,
  },
  backToCategoriesText: {
    fontSize: 12,
    color: "#A855F7",
    fontWeight: "600",
    marginLeft: 4,
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
    backgroundColor: "#ffffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sortButtonText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    marginLeft: 6,
  },

  // Item Cards
  card: {
    overflow: "hidden",
    backgroundColor: "#f8f8f9",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    minWidth: 60,
    justifyContent: "center",
  },
  bookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  count: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cardBottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
    fontWeight: "700",
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
    marginBottom: 2,
  },
  categoryTagText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  itemBrand: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "500",
  },
  itemPrice: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  priceText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  collageBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 16,
    pointerEvents: "none",
  },

  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
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
    color: "#A855F7",
    fontWeight: "600",
  },
});