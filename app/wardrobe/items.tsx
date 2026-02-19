// app/wardrobe/items.tsx
import AppBackground from "@/components/AppBackground";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/app/theme/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface WardrobeItem {
  _id: string;
  wardrobe: string;
  category: {
    _id: string;
    name: string;
    type: "mens" | "womens" | "unisex";
  };
  price: number;
  brand?: string;
  imageUrl?: string;
  images?: string[];
  createdAt: string;
  description?: string;
  // 👇 NEW FIELDS
  visibility?: "public" | "private";
  accessLevel?: "normal" | "premium";
}

// Category Icons - unchanged
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

const getCategoryIcon = (categoryName: string) => {
  const key = normalizeCategoryKey(categoryName);
  if (CATEGORY_ICONS.mens[key]) return CATEGORY_ICONS.mens[key];
  if (CATEGORY_ICONS.womens[key]) return CATEGORY_ICONS.womens[key];
  return null;
};

export default function AllWardrobeItemsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<"dateNewest" | "dateOldest" | "priceHigh" | "priceLow" | "nameAZ" | "publicFirst" | "privateFirst" | "premiumFirst">("dateNewest");
  const [isGridView, setIsGridView] = useState(true);
  const [loading, setLoading] = useState(true);
  const { userId } = useLocalSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [userGender, setUserGender] = useState<"mens" | "womens" | "unisex">("unisex");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const itemSelectionMode = selectedItemIds.length > 0;

  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [wardrobes, setWardrobes] = useState<any[]>([]);
  const [moving, setMoving] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      let res;

      if (userId) {
        res = await api.get(`/api/wardrobe/user/${userId}/items`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setItems(res.data.items);
      } else {
        res = await api.get("/api/wardrobe/my", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems(res.data);

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

  const handleItemPress = (id: string) => {
    if (itemSelectionMode) {
      toggleItemSelect(id);
    } else {
      router.push(`/wardrobe/item/${id}`);
    }
  };

  const handleItemLongPress = (id: string) => {
    if (!itemSelectionMode) {
      setSelectedItemIds([id]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setSelectedCategory(null);
      fetchItems();
    }, [userId])
  );

  const toggleItemSelect = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const cancelItemSelection = () => {
    setSelectedItemIds([]);
  };

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

  useEffect(() => {
    fetchWardrobes();
  }, []);

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
          onPress: isSingle ? deleteSingleItem : deleteMultipleItems,
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

  const handleMoveToWardrobe = async (targetWardrobeId: string, targetName: string) => {
    try {
      setMoving(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      if (selectedItemIds.length === 1) {
        await api.put(
          `/api/wardrobe/${selectedItemIds[0]}/move`,
          { targetWardrobeId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await api.put(
          `/api/wardrobe/move-bulk`,
          { itemIds: selectedItemIds, targetWardrobeId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      Alert.alert("Moved successfully");
      setMoveModalVisible(false);
      cancelItemSelection();
      fetchItems();
    } catch {
      Alert.alert("Error", "Failed to move items");
    } finally {
      setMoving(false);
    }
  };

  const categoriesWithCounts = useMemo(() => {
    const categoryMap = new Map<string, number>();

    items.forEach((item) => {
      const categoryName = item.category?.name;
      if (!categoryName) return;
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  const filteredItems = selectedCategory
    ? items.filter((item) => item.category?.name === selectedCategory)
    : items;

  const sortedItems = useMemo(() => {
  const items = [...filteredItems];
  switch (sortBy) {
    case "dateNewest":
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "dateOldest":
      return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case "priceHigh":
      return items.sort((a, b) => b.price - a.price);
    case "priceLow":
      return items.sort((a, b) => a.price - b.price);
    case "nameAZ":
      return items.sort((a, b) => (a.category?.name || "").localeCompare(b.category?.name || ""));

    // ✅ Updated Public First: normal public (2) → premium (1) → private (0)
    case "publicFirst":
      return items.sort((a, b) => {
        const getRank = (item: WardrobeItem) => {
          if (item.visibility === "public") {
            // Premium items have lower rank than normal public
            return item.accessLevel === "premium" ? 1 : 2;
          }
          return 0; // private
        };
        return getRank(b) - getRank(a);
      });

    // ✅ Updated Premium First: premium (2) → normal public (1) → private (0)
    case "premiumFirst":
      return items.sort((a, b) => {
        const getRank = (item: WardrobeItem) => {
          if (item.accessLevel === "premium") return 2;
          if (item.visibility === "public") return 1; // normal public
          return 0; // private
        };
        return getRank(b) - getRank(a);
      });

    // Private First stays as is (private first, others in original order)
    case "privateFirst":
      return items.sort((a, b) => {
        const aPrivate = a.visibility === "private" ? 1 : 0;
        const bPrivate = b.visibility === "private" ? 1 : 0;
        return bPrivate - aPrivate;
      });

    default:
      return items;
  }
}, [filteredItems, sortBy]);
  const DEFAULT_IMAGE = "https://ui-avatars.com/api/?name=Item&background=random";

  const getBrandLabel = (item: WardrobeItem) => {
    return item.brand && item.brand.trim() ? item.brand : "No Brand";
  };


  const renderVisibilityBadgeInline = (item: WardrobeItem) => {
    if (item.visibility === 'private') {
      return (
        <View style={[styles.visibilityBadgeInline, { backgroundColor: colors.danger + '20' }]}>
          <Ionicons name="lock-closed" size={10} color={colors.danger} />
          <Text style={[styles.visibilityBadgeText, { color: colors.danger }]}>Private</Text>
        </View>
      );
    }
    if (item.accessLevel === 'premium') {
      return (
        <View style={[styles.visibilityBadgeInline, { backgroundColor: '#FFD70020' }]}>
          <Ionicons name="diamond" size={10} color="#B8860B" />
          <Text style={[styles.visibilityBadgeText, { color: '#B8860B' }]}>Premium</Text>
        </View>
      );
    }
    return null;
  };
  const getItemImageUrl = (item: WardrobeItem): string | undefined => {
    const imagePath = item.images?.[0] || item.imageUrl || undefined;
    return resolveImageUrl(imagePath);
  };

  const renderCategoryChip = ({ name, count }: { name: string; count: number }) => {
    const icon = getCategoryIcon(name);
    const isSelected = selectedCategory === name;

    return (
      <TouchableOpacity
        key={name}
        onPress={() => setSelectedCategory(isSelected ? null : name)}
        style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
        activeOpacity={0.8}
      >
        <View style={[styles.categoryIconContainer, isSelected && styles.categoryIconContainerSelected]}>
          {icon ? (
            <Image
              source={icon}
              style={[styles.categoryIcon, isSelected && styles.categoryIconSelected]}
            />
          ) : (
            <Ionicons
              name="shirt-outline"
              size={22}
              color={isSelected ? colors.primaryDark : colors.primary}
            />
          )}

          {count > 0 && (
            <View style={[styles.categoryCountBadge, isSelected && styles.categoryCountBadgeSelected]}>
              <Text style={[styles.categoryCountText, isSelected && styles.categoryCountTextSelected]}>
                {count}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[styles.categoryChipLabel, isSelected && styles.categoryChipLabelSelected]}
          numberOfLines={2}
        >
          {name}
        </Text>
      </TouchableOpacity>
    );
  };

  // 👇 Helper to render visibility badge
  const renderVisibilityBadge = (item: WardrobeItem) => {
    // Don't show badges in selection mode
    if (itemSelectionMode) return null;

    if (item.visibility === "private") {
      return (
        <View style={styles.visibilityBadge}>
          <Ionicons name="lock-closed" size={14} color="#fff" />
        </View>
      );
    }
    if (item.accessLevel === "premium") {
      return (
        <View style={[styles.visibilityBadge, { backgroundColor: "#FFD700" }]}>
          <Ionicons name="diamond" size={14} color="#000" />
        </View>
      );
    }
    return null;
  };

  const renderGridViewItem = (item: WardrobeItem) => {
    const imageUri = getItemImageUrl(item);
    const isSelected = selectedItemIds.includes(item._id);
    const itemKey = `${item._id}-${itemSelectionMode ? 'select' : 'normal'}-${isSelected ? 'selected' : 'unselected'}`;

    return (
      <TouchableOpacity
        key={`${item._id}-${isSelected ? "selected" : "normal"}`}
        activeOpacity={0.85}
        delayLongPress={300}
        onPress={() => handleItemPress(item._id)}
        onLongPress={() => handleItemLongPress(item._id)}
        style={[styles.gridItem, isSelected && styles.selectedItem]}
      >
        <View style={styles.gridImageContainer}>
          <Image
            key={`image-${itemKey}`}
            source={imageUri ? { uri: imageUri } : require("../../assets/images/bg.jpg")}
            style={styles.gridImage}
            onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
          />

          {itemSelectionMode && !isSelected && <View style={styles.dimOverlay} />}

          {itemSelectionMode && (
            <View style={[styles.selectionIndicator, isSelected ? styles.selectedIndicator : styles.unselectedIndicator]}>
              {isSelected ? (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              ) : (
                <View style={[styles.unselectedCircle, { borderColor: colors.primary }]} />
              )}
            </View>
          )}

          {/* 👇 Visibility badge */}
          {renderVisibilityBadge(item)}

          <View style={styles.gridCategoryBadge}>
            <Text style={styles.gridCategoryText} numberOfLines={1}>
              {item.category?.name}
            </Text>
          </View>
        </View>

        <View style={[styles.gridItemInfo, itemSelectionMode && !isSelected && styles.dimmedTextContainer]}>
          <View style={styles.gridItemHeader}>
            <Text style={styles.gridItemName} numberOfLines={1}>
              {item.category?.name}
            </Text>
            <Text style={styles.gridItemPrice}>₹{item.price}</Text>
          </View>

          <Text style={styles.gridItemBrand} numberOfLines={1}>
            {getBrandLabel(item)}
          </Text>

          {item.description && (
            <Text style={styles.gridItemDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.listItemFooter}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={styles.listItemDate}>
              Added: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderListViewItem = (item: WardrobeItem) => {
    const imageUri = getItemImageUrl(item);
    const isSelected = selectedItemIds.includes(item._id);

    return (
      <TouchableOpacity
        key={`${item._id}-${isSelected ? "selected" : "normal"}`}
        activeOpacity={0.85}
        delayLongPress={300}
        onPress={() => handleItemPress(item._id)}
        onLongPress={() => handleItemLongPress(item._id)}
        style={[
          styles.listItem,
          isSelected && styles.selectedItem,
          itemSelectionMode && !isSelected && styles.dimmedListItem
        ]}
      >
        <Image
          source={imageUri ? { uri: imageUri } : require("../../assets/images/bg.jpg")}
          style={styles.listImage}
        />

        <View style={styles.listItemInfo}>
          <View style={styles.listItemHeader}>
            <Text style={styles.listItemName} numberOfLines={1}>
              {item.category?.name}
            </Text>
            <Text style={styles.listItemPrice}>₹{item.price}</Text>
          </View>

          {/* Meta row with icon, brand, and inline visibility badge */}
          <View style={styles.listItemMeta}>
            <Ionicons name="business-outline" size={14} color={colors.textMuted} />
            <Text style={styles.listItemBrand} numberOfLines={1}>
              {getBrandLabel(item)}
            </Text>
            {renderVisibilityBadgeInline(item)}
          </View>

          {item.description && (
            <Text style={styles.listItemDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.listItemFooter}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={styles.listItemDate}>
              Added: {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Right side: chevron or selection indicator */}
        <View style={styles.listRightContainer}>
          {itemSelectionMode ? (
            isSelected ? (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            ) : (
              <View style={[styles.unselectedCircle, { borderColor: colors.primary }]} />
            )
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
      <AppBackground>
        <View style={styles.container}>
          {/* ========== HEADER ========== */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>All Items</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => setIsGridView(!isGridView)}>
                <Ionicons
                  name={isGridView ? "grid-outline" : "list-outline"}
                  size={24}
                  color={isGridView ? colors.primary : colors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.sortButton} onPress={() => setSortModalVisible(true)}>
                <Ionicons name="filter-outline" size={18} color={colors.primary} />
                <Text style={styles.sortButtonText}>Sort</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ========== SELECTION BAR ========== */}
          {itemSelectionMode && (
            <View style={styles.selectionBar}>
              <Text style={styles.selectionText}>{selectedItemIds.length} selected</Text>
              <View style={{ flexDirection: "row", gap: 16 }}>
                {selectedItemIds.length === 1 && (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/add-wardrobe",
                        params: { mode: "edit", itemId: selectedItemIds[0] },
                      })
                    }
                  >
                    <Ionicons name="create-outline" size={22} color={colors.primary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setMoveModalVisible(true)}>
                  <Ionicons name="swap-horizontal-outline" size={22} color="#6366F1" />
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmItemDelete}>
                  <Ionicons name="trash-outline" size={22} color={colors.danger} />
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelItemSelection}>
                  <Ionicons name="close-outline" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ========== CATEGORIES SECTION ========== */}
          <View style={styles.categoriesSection}>
            <View style={styles.categoriesHeader}>
              <Text style={styles.categoriesTitle}>Categories</Text>
              <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.clearFilterButton}>
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
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                style={[styles.categoryChip, !selectedCategory && styles.categoryChipSelected]}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIconContainer, !selectedCategory && styles.categoryIconContainerSelected]}>
                  <Ionicons
                    name="apps-outline"
                    size={22}
                    color={!selectedCategory ? colors.primaryDark : colors.primary}
                  />
                  {items.length > 0 && (
                    <View style={[styles.categoryCountBadge, !selectedCategory && styles.categoryCountBadgeSelected]}>
                      <Text style={styles.categoryCountText}>{items.length}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.categoryChipLabel, !selectedCategory && styles.categoryChipLabelSelected]}>
                  All
                </Text>
              </TouchableOpacity>
              {categoriesWithCounts.map(renderCategoryChip)}
            </ScrollView>
          </View>

          {/* ========== RESULTS INFO ========== */}
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsText}>
              {selectedCategory
                ? `${filteredItems.length} ${filteredItems.length === 1 ? 'item' : 'items'} in "${selectedCategory}"`
                : `${items.length} items in collection`}
            </Text>
          </View>

          {/* ========== ITEMS LIST ========== */}
          <ScrollView
            style={styles.itemsContainer}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.itemsContent}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.loadingText}>Loading your items...</Text>
              </View>
            ) : sortedItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="shirt-outline" size={64} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>
                  {selectedCategory ? `No items in ${selectedCategory}` : "No items found"}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {selectedCategory
                    ? "Try selecting a different category"
                    : "Start by adding items to your wardrobe"}
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

          {/* ========== MOVE MODAL ========== */}
          <Modal
            animationType="slide"
            transparent
            visible={moveModalVisible}
            onRequestClose={() => setMoveModalVisible(false)}
          >
            <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Move to wardrobe</Text>
                <ScrollView>
                  {wardrobes
                    .filter(w => !selectedItemIds.includes(w._id))
                    .map(w => (
                      <TouchableOpacity
                        key={w._id}
                        style={[styles.moveWardrobeItem, { borderBottomColor: colors.border }]}
                        disabled={moving}
                        onPress={() => handleMoveToWardrobe(w._id, w.name)}
                      >
                        <Text style={[styles.moveWardrobeText, { color: colors.textPrimary }]}>{w.name}</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                </ScrollView>
                <TouchableOpacity
                  style={[styles.closeModalBtn, { backgroundColor: colors.card }]}
                  onPress={() => setMoveModalVisible(false)}
                >
                  <Text style={[styles.closeModalText, { color: colors.primary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* ========== SORT MODAL ========== */}
          <Modal
            animationType="slide"
            transparent
            visible={sortModalVisible}
            onRequestClose={() => setSortModalVisible(false)}
          >
            <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Sort By</Text>
                  <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <ScrollView>
                  {/* Date */}
                  <View style={styles.sortSection}>
                    <Text style={[styles.sortSectionTitle, { color: colors.textSecondary }]}>By Date</Text>
                    <View style={styles.sortButtons}>
                      <TouchableOpacity
                        style={[styles.sortBtn, sortBy === "dateNewest" && styles.activeSortBtn]}
                        onPress={() => { setSortBy("dateNewest"); setSortModalVisible(false); }}
                      >
                        <Text style={sortBy === "dateNewest" ? styles.activeSortText : styles.sortText}>
                          Newest First
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.sortBtn, sortBy === "dateOldest" && styles.activeSortBtn]}
                        onPress={() => { setSortBy("dateOldest"); setSortModalVisible(false); }}
                      >
                        <Text style={sortBy === "dateOldest" ? styles.activeSortText : styles.sortText}>
                          Oldest First
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Price */}
                  <View style={styles.sortSection}>
                    <Text style={[styles.sortSectionTitle, { color: colors.textSecondary }]}>By Price</Text>
                    <View style={styles.sortButtons}>
                      <TouchableOpacity
                        style={[styles.sortBtn, sortBy === "priceHigh" && styles.activeSortBtn]}
                        onPress={() => { setSortBy("priceHigh"); setSortModalVisible(false); }}
                      >
                        <Text style={sortBy === "priceHigh" ? styles.activeSortText : styles.sortText}>
                          Price: High to Low
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.sortBtn, sortBy === "priceLow" && styles.activeSortBtn]}
                        onPress={() => { setSortBy("priceLow"); setSortModalVisible(false); }}
                      >
                        <Text style={sortBy === "priceLow" ? styles.activeSortText : styles.sortText}>
                          Price: Low to High
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Name */}
                  <View style={styles.sortSection}>
                    <Text style={[styles.sortSectionTitle, { color: colors.textSecondary }]}>By Name</Text>
                    <TouchableOpacity
                      style={[styles.sortBtn, sortBy === "nameAZ" && styles.activeSortBtn]}
                      onPress={() => { setSortBy("nameAZ"); setSortModalVisible(false); }}
                    >
                      <Text style={sortBy === "nameAZ" ? styles.activeSortText : styles.sortText}>
                        Category A to Z
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Visibility */}
                  <View style={styles.sortSection}>
                    <Text style={[styles.sortSectionTitle, { color: colors.textSecondary }]}>Visibility First By</Text>
                    <View style={styles.sortButtons}>
                      <TouchableOpacity
                        style={[styles.sortBtn, sortBy === "publicFirst" && styles.activeSortBtn]}
                        onPress={() => { setSortBy("publicFirst"); setSortModalVisible(false); }}
                      >
                        <Text style={sortBy === "publicFirst" ? styles.activeSortText : styles.sortText}>
                          Public
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.sortBtn, sortBy === "privateFirst" && styles.activeSortBtn]}
                        onPress={() => { setSortBy("privateFirst"); setSortModalVisible(false); }}
                      >
                        <Text style={sortBy === "privateFirst" ? styles.activeSortText : styles.sortText}>
                          Private
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.sortBtn, sortBy === "premiumFirst" && styles.activeSortBtn]}
                        onPress={() => { setSortBy("premiumFirst"); setSortModalVisible(false); }}
                      >
                        <Text style={sortBy === "premiumFirst" ? styles.activeSortText : styles.sortText}>
                          Premium
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>

                <TouchableOpacity
                  style={[styles.closeModalBtn, { backgroundColor: colors.card }]}
                  onPress={() => setSortModalVisible(false)}
                >
                  <Text style={[styles.closeModalText, { color: colors.primary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </AppBackground>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.textPrimary,
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
      backgroundColor: colors.card,
      borderRadius: 20,
      gap: 6,
    },
    sortButtonText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "600",
    },
    categoriesSection: {
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
      color: colors.textPrimary,
    },
    clearFilterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.card,
      borderRadius: 12,
    },
    clearFilterText: {
      fontSize: 12,
      color: colors.textMuted,
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
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 6,
      position: "relative",
      borderWidth: 2,
      borderColor: "transparent",
    },
    categoryIconContainerSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.background,
      shadowColor: colors.primary,
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
      tintColor: colors.primaryDark,
    },
    categoryCountBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      backgroundColor: colors.primary,
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    categoryCountBadgeSelected: {
      backgroundColor: colors.primaryDark,
    },
    categoryCountText: {
      color: colors.background,
      fontSize: 10,
      fontWeight: "700",
    },
    categoryCountTextSelected: {
      color: colors.primary,
    },
    categoryChipLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textMuted,
      textAlign: "center",
      lineHeight: 14,
    },
    categoryChipLabelSelected: {
      color: colors.primary,
      fontWeight: "700",
    },
    resultsInfo: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.card,
    },
    resultsText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    itemsContainer: {
      flex: 1,
    },
    itemsContent: {
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 100,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textMuted,
      marginTop: 16,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 100,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      marginTop: 20,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: 8,
      maxWidth: 250,
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    gridItem: {
      width: "48%",
      backgroundColor: colors.surface,
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
      backgroundColor: colors.overlay,
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
      color: colors.textPrimary,
      flex: 1,
      marginRight: 8,
    },
    gridItemPrice: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.primary,
    },
    gridItemBrand: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 6,
    },
    gridItemDescription: {
      fontSize: 11,
      color: colors.textSecondary,
      lineHeight: 14,
      marginBottom: 8,
    },
    listContainer: {
      gap: 12,
    },
    listItem: {
      flexDirection: "row",
      backgroundColor: colors.surface,
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
      color: colors.textPrimary,
      flex: 1,
      marginRight: 8,
    },
    listItemPrice: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.primary,
    },
    listItemBrand: {
      fontSize: 13,
      color: colors.textMuted,
    },
    listItemDescription: {
      fontSize: 12,
      color: colors.textSecondary,
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
      color: colors.textMuted,
    },
    listRightContainer: {
      justifyContent: 'center',
      marginLeft: 8,
    },
    listItemMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
      flexWrap: 'wrap',
    },
    visibilityBadgeInline: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      gap: 3,
    },
    visibilityBadgeText: {
      fontSize: 10,
      fontWeight: '600',
    },
    selectionBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectionText: {
      fontWeight: "600",
      color: colors.textSecondary,
    },
    selectedItem: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    dimOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(255,255,255,0.7)",
      zIndex: 1,
    },
    dimmedTextContainer: {
      opacity: 0.6,
    },
    selectionIndicator: {
      position: "absolute",
      top: 8,
      right: 8,
      zIndex: 2,
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    unselectedIndicator: {
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: 12,
      backgroundColor: colors.background,
    },
    unselectedCircle: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      backgroundColor: "transparent",
    },
    dimmedListItem: {
      opacity: 0.6,
    },
    listSelectionIndicator: {
      marginLeft: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    // 👇 New style for visibility badge
    visibilityBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: "rgba(0,0,0,0.6)",
      borderRadius: 12,
      padding: 4,
      zIndex: 5,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modalContent: {
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
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
    },
    sortSection: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sortSectionTitle: {
      fontSize: 14,
      fontWeight: "600",
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
      backgroundColor: colors.card,
      alignItems: "center",
    },
    activeSortBtn: {
      backgroundColor: colors.primary,
    },
    sortText: {
      color: colors.textSecondary,
      fontWeight: "600",
      fontSize: 14,
    },
    activeSortText: {
      color: colors.background,
      fontWeight: "600",
      fontSize: 14,
    },
    closeModalBtn: {
      marginHorizontal: 20,
      marginTop: 20,
      padding: 14,
      alignItems: "center",
      borderRadius: 12,
    },
    closeModalText: {
      fontWeight: "600",
      fontSize: 16,
    },
    moveWardrobeItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 14,
      borderBottomWidth: 1,
    },
    moveWardrobeText: {
      fontSize: 15,
      fontWeight: "600",
    },
  });