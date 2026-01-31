import { useFollow } from "@/context/FollowContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTheme } from "../../app/theme/ThemeContext";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import api from "../../api/api";
import SavedGridCard from "../../components/SavedGridCard";
import { useAuth } from "../../context/AuthContext";
import { useSavedItems } from "../../context/SavedItemsContext";
import AppBackground from "@/components/AppBackground";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
import BoxWardrobeCard from "../../components/BoxWardrobeCard";

interface Wardrobe {
  _id: string;
  name: string;
  color?: string;
  createdAt: string;
  itemCount?: number;
  totalWorth: number;
  coverImage?: string;
}

interface WardrobeItem {
  _id: string;
  wardrobe: string;
  category: string;
  price: number;
  brand: string;
  imageUrl: string;
  images?: string[];
  visibility?: "public" | "private";
  user?: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  mobile?: string;
  gender?: string;
  dob?: string;
  photo?: string;
  createdAt: string;
}

interface UserData {
  name: string;
  handle: string;
  bio: string;
  collectionWorth: string;
  followers: string;
  wardrobeCount: number;
}

interface SavedItem {
  _id: string;
  item: {
    _id: string;
    imageUrl: string;
    images?: string[];
    price: number;
    user: {
      username: string;
      photo?: string;
    };
    brand: string,
    name: string
  };
}

export default function ProfileScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"myWardrobes" | "savedItems">("myWardrobes");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [recentWardrobes, setRecentWardrobes] = useState<Wardrobe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [premiumWorth, setPremiumWorth] = useState(0);
  const [allItemsWorth, setAllItemsWorth] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const { savedItemIds } = useSavedItems();
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const { resetSaved } = useSavedItems();
  const { clearFollowing } = useFollow();
  const [pendingPremiumCount, setPendingPremiumCount] = useState(0);
  // Filter premium items (public items of the logged-in user)
  // ✅ Premium items (public + premium access)
  const premiumItems = wardrobeItems.filter(
    item =>
      item.visibility === "public" &&
      item.accessLevel === "premium"
  );

  // ✅ Public normal items (free items)
  const publicItems = wardrobeItems.filter(
    item =>
      item.visibility === "public" &&
      item.accessLevel === "public"
  );

  // ✅ All items (everything)
  const allItems = wardrobeItems;

  const fetchPendingPremiumCount = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    const res = await api.get("/api/premium/pending-count", {
      headers: { Authorization: `Bearer ${token}` },
    });

    setPendingPremiumCount(res.data.count || 0);
  };

  useEffect(() => {
    fetchPendingPremiumCount();
  }, []);

  // Calculate premium worth
  useEffect(() => {
    const worth = premiumItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      return sum + price;
    }, 0);

    setPremiumWorth(worth);
  }, [premiumItems]);

  const publicWorth = publicItems.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    return sum + price;
  }, 0);


  useEffect(() => {
    const total = allItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      return sum + price;
    }, 0);

    setAllItemsWorth(total);
  }, [allItems]);


  // Wardrobe selection state
  const [selectedWardrobeIds, setSelectedWardrobeIds] = useState<string[]>([]);
  const wardrobeSelectionMode = selectedWardrobeIds.length > 0;
  const selectedWardrobe = selectedWardrobeIds.length === 1 ? wardrobes.find(w => w._id === selectedWardrobeIds[0]) : null;

  const toggleWardrobeSelect = (id: string) => {
    setSelectedWardrobeIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const cancelWardrobeSelection = () => {
    setSelectedWardrobeIds([]);
  };

  const confirmWardrobeDelete = () => {
    const isSingle = selectedWardrobeIds.length === 1;
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
          onPress: isSingle ? deleteSingleWardrobeFromProfile : deleteMultipleWardrobesFromProfile,
        },
      ]
    );
  };

  const deleteSingleWardrobeFromProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await api.delete(`/api/wardrobe/${selectedWardrobeIds[0]}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedWardrobeIds([]);
      fetchProfileData();
    } catch (err) {
      console.error("Profile single delete failed", err);
    }
  };

  const deleteMultipleWardrobesFromProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      await api.delete("/api/wardrobe/bulk-delete", {
        headers: { Authorization: `Bearer ${token}` },
        data: { wardrobeIds: selectedWardrobeIds },
      });
      setSelectedWardrobeIds([]);
      fetchProfileData();
    } catch (err) {
      console.error("Profile bulk delete failed", err);
    }
  };

  const fetchLikeCount = async (itemId: string) => {
    try {
      const res = await api.get(`/api/like/item/${itemId}/count`);
      return res.data.count || 0;
    } catch (err) {
      console.log("Like count fetch failed", err);
      return 0;
    }
  };

  const { logout } = useAuth();

  const getWardrobeCoverImage = (wardrobeId: string) => {
    const items = wardrobeItems.filter(i => i.wardrobe === wardrobeId);
    if (!items.length) return null;
    const firstItem = items[0];
    const imagePath = firstItem.images?.[0] || firstItem.imageUrl || null;
    return imagePath ? resolveImageUrl(imagePath) : null;
  };

  // Get first image from all items for "All Items" box
  const getAllItemsCoverImage = () => {
    if (!wardrobeItems.length) return null;
    const firstItem = wardrobeItems[0];
    const imagePath = firstItem.images?.[0] || firstItem.imageUrl || null;
    return imagePath ? resolveImageUrl(imagePath) : null;
  };

  // Get first image from premium items for "Premium" box
  const getPremiumCoverImage = () => {
    if (!premiumItems.length) return null;
    const firstItem = premiumItems[0];
    const imagePath = firstItem.images?.[0] || firstItem.imageUrl || null;
    return imagePath ? resolveImageUrl(imagePath) : null;
  };

  useEffect(() => {
    if (activeTab !== "savedItems") return;
    const loadSavedItems = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;
        const res = await api.get("/api/saved/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cleanSavedItems = (res.data || []).filter((s: any) => s && s.item && s.item._id);
        setSavedItems(cleanSavedItems);
      } catch (err) {
        console.log("Failed to load saved items", err);
        setSavedItems([]);
      }
    };
    loadSavedItems();
  }, [activeTab, savedItemIds]);

  useEffect(() => {
    if (activeTab !== "savedItems") return;
    const loadLikes = async () => {
      const counts: Record<string, number> = {};
      for (const saved of savedItems) {
        const itemId = saved.item._id;
        counts[itemId] = await fetchLikeCount(itemId);
      }
      setLikeCounts(counts);
    };
    loadLikes();
  }, [savedItems, activeTab]);

  const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=random';

  // Fetch user profile and wardrobes data
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.push("/login-username");
        return;
      }

      // 1. Fetch user's actual profile data
      const userResponse = await api.get("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = userResponse.data;
      setUser(user);

      // 2. Fetch followers & following counts
      const followCountRes = await api.get(`/api/follow/counts/${user._id}`);
      setFollowersCount(followCountRes.data.followers || 0);
      setFollowingCount(followCountRes.data.following || 0);

      // 3. Fetch user's wardrobe collections
      const wardrobesResponse = await api.get("/api/wardrobe/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 4. Fetch user's wardrobe items
      const itemsResponse = await api.get("/api/wardrobe/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      let allItems: WardrobeItem[] = [];
      let totalWorth = 0;

      if (Array.isArray(itemsResponse.data)) {
        allItems = itemsResponse.data;
        setWardrobeItems(allItems);
        setTotalItems(allItems.length);

        // Calculate total collection worth
        totalWorth = allItems.reduce((sum, item) => {
          const price = parseFloat(String(item.price)) || 0;
          return sum + price;
        }, 0);
      }

      // 5. Process wardrobe collections data
      let wardrobesList: Wardrobe[] = [];
      if (wardrobesResponse.data?.wardrobes) {
        wardrobesList = wardrobesResponse.data.wardrobes;
        setWardrobes(wardrobesList);

        const sortedByDate = [...wardrobesList].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setRecentWardrobes(sortedByDate.slice(0, 3));
      }

      // Format collection worth
      const formattedWorth = formatPrice(totalWorth);

      // Extract user data
      const userName = user.username || "User";
      const userHandle = user.email ? `@${user.email.split('@')[0]}` : `@${user.username || "user"}`;
      const userBio = user.bio || createUserBio(user);

      // Set user data
      setUserData({
        name: userName,
        handle: userHandle,
        bio: userBio,
        collectionWorth: formattedWorth,
        followers: formatNumber(followCountRes.data.followers || 0),
        wardrobeCount: wardrobesList.length,
      });

    } catch (error: any) {
      console.error("Error fetching profile data:", error);
      setUserData({
        name: "John Doe",
        handle: "@johndoe",
        bio: "Fashion enthusiast | Style curator",
        collectionWorth: "₹0",
        followers: "0",
        wardrobeCount: 0,
      });
      setWardrobes([]);
      setRecentWardrobes([]);
      setWardrobeItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Create a bio based on user info
  const createUserBio = (user: User): string => {
    let bioParts = [];
    if (user.gender) {
      bioParts.push(`${user.gender} fashion enthusiast`);
    } else {
      bioParts.push("Fashion enthusiast");
    }
    bioParts.push("Style curator");
    return bioParts.join(" | ");
  };

  // Helper function to format price
  const formatPrice = (price: number): string => {
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    } else if (price >= 1000) {
      return `₹${(price / 1000).toFixed(1)}K`;
    }
    return `₹${price}`;
  };

  // Helper function to format numbers with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    if (!name || name.trim() === "") return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
  };

  const handleWardrobePress = (wardrobe: Wardrobe) => {
    router.push(`/wardrobe/${wardrobe._id}?name=${encodeURIComponent(wardrobe.name)}`);
  };

  const handleAllWardrobesPress = () => {
    router.push("/wardrobe/all");
  };

  const handleAllWardrobeItemsPress = () => {
    router.push("/wardrobe/items");
  };


  const handlePremiumWardrobePress = () => {
    router.push({
      pathname: "/wardrobe/premium",
      params: {
        userId: user?._id,   // ✅ REQUIRED
      },
    });
  };

  const handleAddWardrobe = () => {
    router.push("/profile/create-wardrobe");
  };

  const handleEditProfile = () => {
    router.push("/profile/edit-profile");
  };

  const handleAddStory = () => {
    console.log("Add story pressed");
  };

  const handleSettingsPress = () => {
    setSettingsModalVisible(true);
  };

  const handleCloseSettings = () => {
    setSettingsModalVisible(false);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      resetSaved();
      clearFollowing();
      router.replace("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleNavigateToSettings = () => {
    setSettingsModalVisible(false);
    router.push("/settings");
  };

  const handleNavigateToHelp = () => {
    setSettingsModalVisible(false);
    router.push("/help");
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primaryDark} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  const getCoverImage = (items: WardrobeItem[]) => {
    if (!items.length) return null;

    const first = items[0];
    const imagePath = first.images?.[0] || first.imageUrl || null;
    return imagePath ? resolveImageUrl(imagePath) : null;
  };

  const premiumImage = getCoverImage(premiumItems);
  const publicImage = getCoverImage(publicItems);
  const allItemsImage = getCoverImage(allItems);


  return (
    <>
      <AppBackground>
        <ScrollView
          style={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              {user?.photo ? (
                <Image
                  source={{ uri: user?.photo ? resolveImageUrl(user.photo) : DEFAULT_AVATAR }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {getInitials(userData?.name.toUpperCase() || "User")}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.addStoryBtn} onPress={handleAddStory}>
                <Ionicons name="add" size={20} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.name}>{userData?.name.toUpperCase() || "User"}</Text>
              <Text style={styles.handle}>{userData?.handle || "@user"}</Text>
              <Text style={styles.bio}>{userData?.bio || "Fashion enthusiast | Style curator"}</Text>
            </View>
          </View>

          <View style={styles.actionButtonsContainer}>
            {/* Premium Requests */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.premiumBtn]}
              onPress={() => router.push("/premium/requests")}
            >
              <Ionicons name="diamond" size={16} color="#fff" />

              {pendingPremiumCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingPremiumCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Edit Profile */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={handleEditProfile}
            >
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>

            {/* Menu */}
            <TouchableOpacity
              style={[styles.actionBtn, styles.menuBtn]}
              onPress={handleSettingsPress}
            >
              <Ionicons name="ellipsis-horizontal" size={16} color="#fff" />
            </TouchableOpacity>
          </View>


          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userData?.collectionWorth || "₹0"}</Text>
              <Text style={styles.statLabel}>Collection Worth</Text>
            </View>
            <TouchableOpacity
              style={styles.statBox}
              onPress={() => router.push(`/profile/followers?userId=${user?._id}&tab=followers`)}
            >
              <Text style={styles.statValue}>{followersCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userData?.wardrobeCount || 0}</Text>
              <Text style={styles.statLabel}>Wardrobes</Text>
            </View>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "myWardrobes" && styles.activeTab]}
              onPress={() => setActiveTab("myWardrobes")}
            >
              <Text style={[styles.tabText, activeTab === "myWardrobes" && styles.activeTabText]}>
                My Wardrobes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "savedItems" && styles.activeTab]}
              onPress={() => setActiveTab("savedItems")}
            >
              <Text style={[styles.tabText, activeTab === "savedItems" && styles.activeTabText]}>
                Saved Items
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === "myWardrobes" ? (
            <View style={styles.contentContainer}>
              <TouchableOpacity style={styles.addWardrobeBtn} onPress={handleAddWardrobe}>
                <Text style={styles.addWardrobeText}>+ Add New Wardrobe</Text>
              </TouchableOpacity>

              {/* Box-shaped Wardrobes Grid */}
              <View style={styles.boxGrid}>
                {/* PREMIUM ITEMS */}
                <BoxWardrobeCard
                  title="Premium Items"
                  subtitle={`${premiumItems.length} items • ${formatPrice(premiumWorth)}`}
                  badge="Premium"
                  image={premiumImage}
                  onPress={handlePremiumWardrobePress}
                />



                {/* ALL ITEMS */}
                <BoxWardrobeCard
                  title="All Items"
                  subtitle={`${allItems.length} items • ${formatPrice(allItemsWorth)}`}
                  image={allItemsImage}
                  onPress={handleAllWardrobeItemsPress}
                />
              </View>


              {/* Regular Wardrobes List */}
              {recentWardrobes.map((wardrobe) => {
                const isSelected = selectedWardrobeIds.includes(wardrobe._id);
                return (
                  <TouchableOpacity
                    key={wardrobe._id}
                    style={[styles.wardrobeCard, isSelected && { borderWidth: 2, borderColor: theme.colors.primaryDark }]}
                    onPress={() => wardrobeSelectionMode ? toggleWardrobeSelect(wardrobe._id) : handleWardrobePress(wardrobe)}
                    onLongPress={() => {
                      if (!wardrobeSelectionMode) {
                        setSelectedWardrobeIds([wardrobe._id]);
                      }
                    }}
                  >
                    <View style={styles.imagesRow}>
                      {(() => {
                        const coverImage = wardrobe.coverImage || getWardrobeCoverImage(wardrobe._id);
                        return coverImage ? (
                          <View style={styles.imageWrapper}>
                            <Image source={{ uri: coverImage }} style={styles.wardrobeImage} resizeMode="cover" />
                            <View style={styles.imageOverlay} />
                          </View>
                        ) : (
                          <View style={[styles.wardrobeColor, { backgroundColor: wardrobe.color || theme.colors.primaryDark }]} />
                        );
                      })()}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.wardrobeName}>{wardrobe.name}</Text>
                      <Text style={styles.itemsCount}>{wardrobe.itemCount || 0} items</Text>
                    </View>
                    <View>
                      <Text>{formatPrice(wardrobe.totalWorth || 0)}</Text>
                    </View>
                    {wardrobeSelectionMode ? (
                      <Ionicons
                        name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                        color={theme.colors.primaryDark}
                      />
                    ) : (
                      <Ionicons name="chevron-forward-outline" size={24} color="#000" />
                    )}
                  </TouchableOpacity>
                );
              })}

              {wardrobeSelectionMode && (
                <View style={styles.selectionBar}>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {selectedWardrobeIds.length === 1 && selectedWardrobe && (
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
                        <Ionicons name="create-outline" size={20} color={theme.colors.primaryDark} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={confirmWardrobeDelete}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={cancelWardrobeSelection}>
                    <Ionicons name="close-outline" size={22} color="#585858ff" />
                  </TouchableOpacity>
                </View>
              )}

              {wardrobes.length > 3 && (
                <TouchableOpacity style={styles.moreWardrobesContainer} onPress={handleAllWardrobesPress}>
                  <Text style={styles.moreWardrobesText}>+{wardrobes.length - 3} more wardrobes</Text>
                </TouchableOpacity>
              )}
              {wardrobes.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="folder-outline" size={48} color="#e677f5ff" />
                  <Text style={styles.emptyStateText}>No wardrobes yet</Text>
                  <Text style={styles.emptyStateSubText}>
                    Create your first wardrobe to organize your items
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.contentContainer}>
              {activeTab === "savedItems" && (
                <View style={styles.savedContainer}>
                  <View style={styles.savedHeader}>
                    <Text style={styles.savedCount}>{savedItems.length} saved items</Text>
                    <TouchableOpacity style={styles.sortButton}>
                      <Text style={styles.sortButtonText}>Sort by</Text>
                      <Ionicons name="chevron-down" size={16} color="#000" />
                    </TouchableOpacity>
                  </View>
                  {savedItems.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="bookmark-outline" size={48} color="#ccc" />
                      <Text style={styles.emptyStateText}>No saved items yet</Text>
                      <Text style={styles.emptyStateSubText}>Items you save will appear here</Text>
                    </View>
                  ) : (
                    <View style={styles.savedGrid}>
                      {savedItems.map((saved) => {
                        if (!saved.item) return null;
                        const imagePath = saved.item.images?.length && saved.item.images[0]
                          ? saved.item.images[0]
                          : saved.item.imageUrl;
                        const itemData = {
                          _id: saved.item._id,
                          name: saved.item.name || "Item",
                          brand: saved.item.brand || saved.item.user?.username || "Brand",
                          price: saved.item.price || 0,
                          likes: likeCounts[saved.item._id] || 0,
                          imageUrl: resolveImageUrl(imagePath),
                        };
                        return (
                          <View key={saved._id} style={styles.savedGridItem}>
                            <SavedGridCard
                              item={itemData}
                              onPress={() => router.push(`/wardrobe/item/${itemData._id}`)}
                            />
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={settingsModalVisible}
          onRequestClose={handleCloseSettings}
        >
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleCloseSettings}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.modalItem} onPress={handleNavigateToSettings}>
                <Ionicons name="settings-outline" size={20} color="#666" />
                <Text style={styles.modalItemText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalItem} onPress={handleNavigateToHelp}>
                <Ionicons name="help-circle-outline" size={20} color="#666" />
                <Text style={styles.modalItemText}>Help & Support</Text>
              </TouchableOpacity>
              <View style={styles.modalDivider} />
              <TouchableOpacity style={[styles.modalItem, styles.logoutItem]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                <Text style={[styles.modalItemText, styles.logoutText]}>Logout</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </AppBackground>
    </>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      paddingTop: 0
    },
    selectionBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#ffffffff",
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#fff",
    },
    loadingText: {
      marginTop: 12,
      color: "#666",
      fontSize: 16,
    },
    userCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 20,
      marginTop: 20,
      paddingRight: 80,
    },
    avatarContainer: {
      position: "relative",
    },
    imageWrapper: {
      width: 40,
      height: 40,
      borderRadius: 8,
      overflow: "hidden",
      backgroundColor: "#1a2c50ff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 4,
    },
    wardrobeImage: {
      width: "100%",
      height: "100%",
    },
    imageOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#ffffff3f",
    },
    avatar: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: theme.colors.primary,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "#fff",
    },
    avatarImage: {
      width: 70,
      height: 70,
      borderRadius: 35,
      borderWidth: 2,
      borderColor: "#fff",
    },
    avatarText: {
      color: theme.colors.textPrimary,
      fontWeight: "700",
      fontSize: 24
    },
    addStoryBtn: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: "#fff",
      justifyContent: "center",
      alignItems: "center",
    },

    actionButtonsContainer: {
      position: "absolute",
      top: 16,
      right: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },

    actionBtn: {
      width: 32,
      height: 32,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
    },

    premiumBtn: {
      backgroundColor: "#A855F7", // or gold: "#F59E0B"
    },

    editBtn: {
      backgroundColor: theme.colors.primary,
    },

    menuBtn: {
      backgroundColor: theme.colors.primary,
    },


    name: {
      fontWeight: "700",
      fontSize: 18,
      marginBottom: 4,
    },
    handle: {
      color: "#777676ff",
      fontSize: 14,
      marginBottom: 8,
    },
    bio: {
      color: "#000000ff",
      fontSize: 14,
      lineHeight: 20,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
      marginTop: 10,
      paddingHorizontal: 10,
    },
    statBox: {
      alignItems: "center",
      flex: 1,
    },
    statValue: {
      fontWeight: "700",
      fontSize: 18,
      marginBottom: 4,
      color: theme.colors.primary,
    },
    statLabel: {
      color: theme.colors.primary,
      fontSize: 12,
    },
    tabRow: {
      flexDirection: "row",
      marginBottom: 20,
      marginTop: 10,
      backgroundColor: "#ffffffff",
      borderRadius: 30,
      padding: 4,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 30,
      alignItems: "center",
    },
    activeTab: {
      backgroundColor: theme.colors.primary,
    },
    tabText: {
      fontWeight: "600",
      color: "#666",
      fontSize: 14,
    },
    activeTabText: {
      color: theme.colors.textPrimary
    },
    contentContainer: {
      marginBottom: 20,
    },
    addWardrobeBtn: {
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: theme.colors.midary,
      borderRadius: 20,
      padding: 14,
      alignItems: "center",
      marginBottom: 16,
      backgroundColor: "#FAF5FF",
    },
    addWardrobeText: {
      color: theme.colors.primaryDark,
      fontWeight: "600",
      fontSize: 14,
    },
    // Box grid for Premium and All Items
    boxGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    // Regular wardrobes
    wardrobeCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#a453fc4d",
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
    },
    imagesRow: {
      flexDirection: "row",
    },
    wardrobeColor: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.colors.primary,
    },
    wardrobeName: {
      fontWeight: "700",
      fontSize: 14,
    },
    itemsCount: {
      color: "#777",
      marginTop: 4,
      fontSize: 12,
    },
    emptyState: {
      alignItems: "center",
      padding: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: "#666",
      marginTop: 12,
      fontWeight: "600",
    },
    emptyStateSubText: {
      fontSize: 14,
      color: "#999",
      marginTop: 4,
      textAlign: "center",
    },
    moreWardrobesContainer: {
      alignItems: "center",
      padding: 16,
    },
    moreWardrobesText: {
      color: theme.colors.primaryDark,
      fontWeight: "600",
      fontSize: 14,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      justifyContent: "flex-start",
      alignItems: "flex-end",
      paddingTop: 60,
      paddingRight: 16,
    },
    modalContent: {
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 8,
      width: 200,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    modalItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    modalItemText: {
      marginLeft: 12,
      fontSize: 16,
      color: "#333",
      flex: 1,
    },
    modalDivider: {
      height: 1,
      backgroundColor: "#f0f0f0",
      marginVertical: 4,
    },
    logoutItem: {
      marginTop: 4,
    },
    logoutText: {
      color: "#ef4444",
    },
    savedContainer: {
      flex: 1,
    },
    savedHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingHorizontal: 4,
    },
    savedCount: {
      fontSize: 16,
      fontWeight: '600',
      color: '#000',
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      backgroundColor: '#ffffffff',
      borderRadius: 20,
    },
    sortButtonText: {
      fontSize: 14,
      color: '#000',
    },
    savedGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    savedGridItem: {
      width: '48%',
      marginBottom: 16,
    },
    badge: {
      position: "absolute",
      top: -4,
      right: -4,
      backgroundColor: "#EF4444",
      borderRadius: 10,
      minWidth: 18,
      height: 18,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    badgeText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "700",
    },

  });