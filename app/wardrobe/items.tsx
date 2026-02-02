// app/wardrobe/items.tsx
import AppBackground from "@/components/AppBackground";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import api from "../../api/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface WardrobeItem {
  _id: string;
  wardrobe: string;
  category: string;
  price: number;
  brand?: string;
  imageUrl?: string;
  images?: string[];
  createdAt: string;
  description?: string;
}

// Category Icons - Same as in add-wardrobe
const CATEGORY_ICONS = {
  mens: {
    accessories: require("../../assets/categories/mens/Accessories.png"),
    blazers: require("../../assets/categories/mens/Blazers.png"),
    cargos: require("../../assets/categories/mens/Cargo.png"),
    shirts: require("../../assets/categories/mens/Shirts.png"),
    chinos: require("../../assets/categories/mens/Chino.png"),
    coats: require("../../assets/categories/mens/Coats.png"),
    denimjackets: require("../../assets/categories/mens/DenimJackets.png"),
    dhotis: require("../../assets/categories/mens/Dhotis.png"),
    formalwear: require("../../assets/categories/mens/FormalWear.png"),
    hoodies: require("../../assets/categories/mens/Hoodies.png"),
    jackets: require("../../assets/categories/mens/Jackets.png"),
    jeans: require("../../assets/categories/mens/Jeans.png"),
    joggers: require("../../assets/categories/mens/Joggers.png"),
    kurtas: require("../../assets/categories/mens/Kurtas.png"),
    pajamas: require("../../assets/categories/mens/Pajamas.png"),
    pants: require("../../assets/categories/mens/Pants.png"),
    poloshirts: require("../../assets/categories/mens/PoloShirts.png"),
    raincoats: require("../../assets/categories/mens/Raincoats.png"),
    sherwanis: require("../../assets/categories/mens/Sherwanis.png"),
    shorts: require("../../assets/categories/mens/Shorts.png"),
    socks: require("../../assets/categories/mens/Socks.png"),
    sportswear: require("../../assets/categories/mens/Sportswear.png"),
    lifestyle: require("../../assets/categories/mens/Lifestyle.png"),
    straightfit: require("../../assets/categories/mens/Straightfit.png"),
    suits: require("../../assets/categories/mens/Suits.png"),
    tanktops: require("../../assets/categories/mens/TankTops.png"),
    thermals: require("../../assets/categories/mens/Thermals.png"),
    trackpants: require("../../assets/categories/mens/TrackPants.png"),
    traditionalwear: require("../../assets/categories/mens/TraditionalWear.png"),
    trousers: require("../../assets/categories/mens/Trousers.png"),
    underwear: require("../../assets/categories/mens/Underwear.png"),
    vests: require("../../assets/categories/mens/Vests.png"),
    sweaters: require("../../assets/categories/mens/Sweaters.png"),
    swimwear: require("../../assets/categories/mens/Swimwear.png"),
    leatherjackets: require("../../assets/categories/mens/LeatherJackets.png"),
    casualwear: require("../../assets/categories/mens/CasualWear.png"),
    "t-shirts": require("../../assets/categories/mens/T-Shirts.png"),
  },

  womens: {
    accessories: require("../../assets/categories/womens/Accessories.png"),
    anarkalis: require("../../assets/categories/womens/Anarkali.png"),
    bikinis: require("../../assets/categories/womens/Bikini.png"),
    blazers: require("../../assets/categories/womens/Blazer.png"),
    blouse: require("../../assets/categories/womens/Blouse.png"),
    bras: require("../../assets/categories/womens/Bra.png"),
    capris: require("../../assets/categories/womens/Capri.png"),
    cardigans: require("../../assets/categories/womens/Cardigan.png"),
    casualwear: require("../../assets/categories/womens/CasualWear.png"),
    coats: require("../../assets/categories/womens/Coat.png"),
    dresses: require("../../assets/categories/womens/Dress.png"),
    formalwear: require("../../assets/categories/womens/FormalWear.png"),
    gowns: require("../../assets/categories/womens/Gown.png"),
    hoodies: require("../../assets/categories/womens/Hoodie.png"),
    jackets: require("../../assets/categories/womens/Jacket.png"),
    jeans: require("../../assets/categories/womens/Jean.png"),
    jumpsuits: require("../../assets/categories/womens/Jumpsuit.png"),
    kurtis: require("../../assets/categories/womens/Kurti.png"),
    leggings: require("../../assets/categories/womens/Legging.png"),
    lehengas: require("../../assets/categories/womens/Lehnga.png"),
    lingerie: require("../../assets/categories/womens/Lingerie.png"),
    nightwear: require("../../assets/categories/womens/NightWear.png"),
    pajamas: require("../../assets/categories/womens/Pajama.png"),
    panties: require("../../assets/categories/womens/Panty.png"),
    palazzos: require("../../assets/categories/womens/Plazzo.png"),
    raincoats: require("../../assets/categories/womens/Raincoat.png"),
    rompers: require("../../assets/categories/womens/Romper.png"),
    salwarsuits: require("../../assets/categories/womens/SalwarSuit.png"),
    sarees: require("../../assets/categories/womens/Saree.png"),
    shirts: require("../../assets/categories/womens/Shirt.png"),
    socks: require("../../assets/categories/womens/Socks.png"),
    shorts: require("../../assets/categories/womens/Shorts.png"),
    sportswear: require("../../assets/categories/womens/SportsWear.png"),
    stockings: require("../../assets/categories/womens/Stocking.png"),
    suits: require("../../assets/categories/womens/Suit.png"),
    sweaters: require("../../assets/categories/womens/Sweater.png"),
    swimwear: require("../../assets/categories/womens/SwimWear.png"),
    tanktops: require("../../assets/categories/womens/TankTop.png"),
    traditionalwear: require("../../assets/categories/womens/TraditionalWear.png"),
    trousers: require("../../assets/categories/womens/Trouser.png"),
    't-shirts': require("../../assets/categories/womens/Tshirt.png"),
    vests: require("../../assets/categories/womens/Vest.png"),
    tops: require("../../assets/categories/womens/Top.png"),
    skirts: require("../../assets/categories/womens/Skirt.png"),
  },

  unisex: {},
};

const normalizeCategoryKey = (name: string) =>
  name.toLowerCase().replace(/\s+/g, "");

// Helper function to get category icon
const getCategoryIcon = (categoryName: string) => {
  const key = normalizeCategoryKey(categoryName);
  
  // Try mens first, then womens
  if (CATEGORY_ICONS.mens[key]) {
    return CATEGORY_ICONS.mens[key];
  }
  
  if (CATEGORY_ICONS.womens[key]) {
    return CATEGORY_ICONS.womens[key];
  }
  
  return null;
};

export default function AllWardrobeItemsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<"dateNewest" | "dateOldest" | "priceHigh" | "priceLow" | "nameAZ">("dateNewest");
  const [isGridView, setIsGridView] = useState(true);
  const [loading, setLoading] = useState(true);
  const { userId } = useLocalSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userGender, setUserGender] = useState<"mens" | "womens" | "unisex">("unisex");

  // const SERVER_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;

  const fetchItems = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      let res;

      if (userId) {
        // 👤 Viewing someone else
        res = await api.get(`/api/wardrobe/user/${userId}/items`, {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : undefined,
        });

        setItems(res.data.items);
      } else {
        // 👤 Viewing myself
        res = await api.get("/api/wardrobe/my", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setItems(res.data);
        
        // Try to get user gender
        try {
          const userRes = await api.get("/api/user/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (userRes.data?.gender) {
            setUserGender(userRes.data.gender);
          }
        } catch (err) {
          console.log("Could not fetch user gender");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

useFocusEffect(
  useCallback(() => {
    setSelectedCategory(null);
    fetchItems();
  }, [userId])
);

  // Get unique categories with counts
  const categoriesWithCounts = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    items.forEach((item) => {
      const category = item.category;
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [items]);

  // Filter items based on selected category
  const filteredItems = selectedCategory
    ? items.filter((item) => item.category === selectedCategory)
    : items;

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case "dateOldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "priceHigh":
        return b.price - a.price;
      case "priceLow":
        return a.price - b.price;
      case "nameAZ":
        return a.category.localeCompare(b.category);
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Helper to construct full image URL
  const DEFAULT_IMAGE =
    "https://ui-avatars.com/api/?name=Item&background=random";

 const getBrandLabel = (item: WardrobeItem) => {
  if (item.brand && item.brand.trim().length > 0) {
    return item.brand;
  }

  return "No Brand";
};

const getItemImageUrl = (item: WardrobeItem): string => {
  const imagePath =
    item.images?.[0] ||
    item.imageUrl ||
    null;

  return imagePath
    ? resolveImageUrl(imagePath)
    : DEFAULT_IMAGE;
};

  // Render category chip
  const renderCategoryChip = ({ name, count }: { name: string; count: number }) => {
    const icon = getCategoryIcon(name);
    const isSelected = selectedCategory === name;
    
    return (
      <TouchableOpacity
        key={name}
        onPress={() => setSelectedCategory(isSelected ? null : name)}
        style={[
          styles.categoryChip,
          isSelected && styles.categoryChipSelected,
        ]}
        activeOpacity={0.8}
      >
        <View style={[
          styles.categoryIconContainer,
          isSelected && styles.categoryIconContainerSelected,
        ]}>
          {icon ? (
            <Image 
              source={icon} 
              style={[
                styles.categoryIcon,
                isSelected && styles.categoryIconSelected
              ]} 
            />
          ) : (
            <Ionicons
              name="shirt-outline"
              size={22}
              color={isSelected ? "#fff" : "#A855F7"}
            />
          )}
          
          {/* Item count badge */}
          {count > 0 && (
            <View style={[
              styles.categoryCountBadge,
              isSelected && styles.categoryCountBadgeSelected
            ]}>
              <Text style={[styles.categoryCountText,
              isSelected && styles.categoryCountTextSelected

              ]}>{count}</Text>
            </View>
          )}
        </View>
        
        <Text 
          style={[
            styles.categoryChipLabel,
            isSelected && styles.categoryChipLabelSelected
          ]}
          numberOfLines={2}
        >
          {name}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render item card for grid view
  const renderGridViewItem = (item: WardrobeItem) => (
    <TouchableOpacity
      key={item._id}
      activeOpacity={0.9}
      style={styles.gridItem}
      onPress={() => router.push(`/wardrobe/item/${item._id}`)}
    >
      {/* Item Image */}
      <View style={styles.gridImageContainer}>
        <Image
          source={{ uri: getItemImageUrl(item) }}
          style={styles.gridImage}
        />
        
        {/* Category Badge */}
        <View style={styles.gridCategoryBadge}>
          <Text style={styles.gridCategoryText} numberOfLines={1}>
            {item.category}
          </Text>
        </View>
      </View>
      
      {/* Item Info */}
      <View style={styles.gridItemInfo}>
        <View style={styles.gridItemHeader}>
          <Text style={styles.gridItemName} numberOfLines={1}>
            {item.category}
          </Text>
          <Text style={styles.gridItemPrice}>₹{item.price}</Text>
        </View>
        
        <Text style={styles.gridItemBrand} numberOfLines={1}>
  {getBrandLabel(item)}
</Text>
        
        {/* Description if available */}
        {item.description && (
          <Text style={styles.gridItemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <Text style={styles.gridItemDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render item card for list view
  const renderListViewItem = (item: WardrobeItem) => (
    <TouchableOpacity
      key={item._id}
      activeOpacity={0.9}
      style={styles.listItem}
      onPress={() => router.push(`/wardrobe/item/${item._id}`)}
    >
      <Image
        source={{ uri: getItemImageUrl(item) }}
        style={styles.listImage}
      />
      
      <View style={styles.listItemInfo}>
        <View style={styles.listItemHeader}>
          <Text style={styles.listItemName} numberOfLines={1}>
            {item.category}
          </Text>
          <Text style={styles.listItemPrice}>₹{item.price}</Text>
        </View>
        
        <View style={styles.listItemMeta}>
          <Ionicons name="business-outline" size={14} color="#666" />
          <Text style={styles.listItemBrand} numberOfLines={1}>
  {getBrandLabel(item)}
</Text>
        </View>
        
        {item.description && (
          <Text style={styles.listItemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.listItemFooter}>
          <Ionicons name="calendar-outline" size={12} color="#999" />
          <Text style={styles.listItemDate}>
            Added: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <AppBackground>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wardrobe</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setIsGridView(!isGridView)}>
              <Ionicons 
                name={isGridView ? "grid-outline" : "list-outline"} 
                size={24} 
                color={isGridView ? "#A855F7" : "#666"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => setSortModalVisible(true)}
            >
              <Ionicons name="filter-outline" size={18} color="#A855F7" />
              <Text style={styles.sortButtonText}>Sort</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories Filter Section */}
        <View style={styles.categoriesSection}>
          <View style={styles.categoriesHeader}>
            <Text style={styles.categoriesTitle}>Categories</Text>
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              style={styles.clearFilterButton}
            >
              <Text style={styles.clearFilterText}>
                {selectedCategory ? "Clear" : `Total: ${items.length}`}
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScrollView}
            contentContainerStyle={styles.categoriesContent}
          >
            {/* All Items Chip */}
            <TouchableOpacity
              onPress={() => setSelectedCategory(null)}
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipSelected,
              ]}
              activeOpacity={0.8}
            >
              <View style={[
                styles.categoryIconContainer,
                !selectedCategory && styles.categoryIconContainerSelected,
              ]}>
                <Ionicons
                  name="apps-outline"
                  size={22}
                  color={!selectedCategory ? "#fff" : "#A855F7"}
                />
                
                {/* Total count badge */}
                {items.length > 0 && (
                  <View style={[
                    styles.categoryCountBadge,
                    !selectedCategory && styles.categoryCountBadgeSelected
                  ]}>
                    <Text style={styles.categoryCountText}>{items.length}</Text>
                  </View>
                )}
              </View>
              
              <Text 
                style={[
                  styles.categoryChipLabel,
                  !selectedCategory && styles.categoryChipLabelSelected
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            
            {/* Category Chips */}
            {categoriesWithCounts.map(renderCategoryChip)}
          </ScrollView>
        </View>

        {/* Results Info */}
        <View style={styles.resultsInfo}>
          <Text style={styles.resultsText}>
            {selectedCategory 
              ? `${filteredItems.length} ${filteredItems.length === 1 ? 'item' : 'items'} in "${selectedCategory}"`
              : `${items.length} items in collection`
            }
          </Text>
        </View>

        {/* Items List */}
        <ScrollView 
          style={styles.itemsContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.itemsContent}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#A855F7" size="large" />
              <Text style={styles.loadingText}>Loading your items...</Text>
            </View>
          ) : sortedItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="shirt-outline" size={64} color="#E5E7EB" />
              <Text style={styles.emptyTitle}>
                {selectedCategory ? `No items in ${selectedCategory}` : "No items found"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {selectedCategory 
                  ? "Try selecting a different category"
                  : "Start by adding items to your wardrobe"
                }
              </Text>
            </View>
          ) : isGridView ? (
            <View style={styles.gridContainer}>
              {sortedItems.map(renderGridViewItem)}
            </View>
          ) : (
            <View style={styles.listContainer}>
              {sortedItems.map(renderListViewItem)}
            </View>
          )}
        </ScrollView>

        {/* Sort Modal */}
        <Modal 
          animationType="slide" 
          transparent 
          visible={sortModalVisible} 
          onRequestClose={() => setSortModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sort By</Text>
                <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.sortSection}>
                <Text style={styles.sortSectionTitle}>By Date</Text>
                <View style={styles.sortButtons}>
                  <TouchableOpacity 
                    style={[styles.sortBtn, sortBy === "dateNewest" && styles.activeSortBtn]} 
                    onPress={() => {
                      setSortBy("dateNewest");
                      setSortModalVisible(false);
                    }}
                  >
                    <Text style={sortBy === "dateNewest" ? styles.activeSortText : styles.sortText}>
                      Newest First
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.sortBtn, sortBy === "dateOldest" && styles.activeSortBtn]} 
                    onPress={() => {
                      setSortBy("dateOldest");
                      setSortModalVisible(false);
                    }}
                  >
                    <Text style={sortBy === "dateOldest" ? styles.activeSortText : styles.sortText}>
                      Oldest First
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sortSection}>
                <Text style={styles.sortSectionTitle}>By Price</Text>
                <View style={styles.sortButtons}>
                  <TouchableOpacity 
                    style={[styles.sortBtn, sortBy === "priceHigh" && styles.activeSortBtn]} 
                    onPress={() => {
                      setSortBy("priceHigh");
                      setSortModalVisible(false);
                    }}
                  >
                    <Text style={sortBy === "priceHigh" ? styles.activeSortText : styles.sortText}>
                      Price: High to Low
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.sortBtn, sortBy === "priceLow" && styles.activeSortBtn]} 
                    onPress={() => {
                      setSortBy("priceLow");
                      setSortModalVisible(false);
                    }}
                  >
                    <Text style={sortBy === "priceLow" ? styles.activeSortText : styles.sortText}>
                      Price: Low to High
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sortSection}>
                <Text style={styles.sortSectionTitle}>By Name</Text>
                <TouchableOpacity 
                  style={[styles.sortBtn, sortBy === "nameAZ" && styles.activeSortBtn]} 
                  onPress={() => {
                    setSortBy("nameAZ");
                    setSortModalVisible(false);
                  }}
                >
                  <Text style={sortBy === "nameAZ" ? styles.activeSortText : styles.sortText}>
                    Category A to Z
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.closeModalBtn} 
                onPress={() => setSortModalVisible(false)}
              >
                <Text style={styles.closeModalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </AppBackground>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 15,
    paddingTop: 45,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3E8FF",
    borderRadius: 20,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    color: "#A855F7",
    fontWeight: "600",
  },
  
  // Categories Section
  categoriesSection: {
    backgroundColor: "#ffffffff",
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  categoriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  clearFilterText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  categoriesScrollView: {
    paddingLeft: 16,
    paddingTop: 2,
  },
  categoriesContent: {
    paddingRight: 16,
    gap: 12,
  },
  
  // Category Chips
  categoryChip: {
    alignItems: "center",
    width: 70,
  },
  categoryChipSelected: {
    transform: [{ scale: 1.05 }],
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryIconContainerSelected: {
    backgroundColor: "#A855F7",
    borderColor: "#fff",
    shadowColor: "#A855F7",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  categoryIconSelected: {
    tintColor: "#fff",
  },
  categoryCountBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#A855F7",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  categoryCountBadgeSelected: {
    backgroundColor: "#fff",
  },
  categoryCountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  categoryCountTextSelected:{
color: "#A855F7",
  },
  categoryChipLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 14,
  },
  categoryChipLabelSelected: {
    color: "#A855F7",
    fontWeight: "700",
  },
  
  // Results Info
  resultsInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
  },
  resultsText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  
  // Items Container
  itemsContainer: {
    flex: 1,
  },
  itemsContent: {
    padding: 16,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    maxWidth: 250,
  },
  
  // Grid View
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridImageContainer: {
    position: "relative",
    width: "100%",
    height: 160,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  gridCategoryBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gridCategoryText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  gridItemInfo: {
    padding: 12,
  },
  gridItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  gridItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    marginRight: 8,
  },
  gridItemPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#A855F7",
  },
  gridItemBrand: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 6,
  },
  gridItemDescription: {
    fontSize: 11,
    color: "#9CA3AF",
    lineHeight: 14,
    marginBottom: 8,
  },
  gridItemDate: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  
  // List View
  listContainer: {
    gap: 12,
  },
  listItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  listItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  listItemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    marginRight: 8,
  },
  listItemPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#A855F7",
  },
  listItemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  listItemBrand: {
    fontSize: 13,
    color: "#6B7280",
  },
  listItemDescription: {
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 16,
    marginBottom: 8,
  },
  listItemFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  listItemDate: {
    fontSize: 11,
    color: "#9CA3AF",
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
  sortSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f7",
  },
  sortSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
  },
  sortButtons: {
    flexDirection: "row",
    gap: 12,
  },
  sortBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
  },
  activeSortBtn: {
    backgroundColor: "#A855F7",
  },
  sortText: {
    color: "#444",
    fontWeight: "600",
    fontSize: 14,
  },
  activeSortText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  closeModalBtn: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  closeModalText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 16,
  },
});