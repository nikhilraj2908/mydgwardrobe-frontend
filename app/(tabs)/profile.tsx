import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import SavedGridCard from "../../components/SavedGridCard";
import api from "../../api/api";
import { useSavedItems } from "../../context/SavedItemsContext";
// Define types
const baseURL = api.defaults.baseURL;


interface Wardrobe {
  _id: string;
  name: string;
  color?: string;
  createdAt: string;
  itemCount?: number;
  totalWorth: number;
}

interface WardrobeItem {
  _id: string;
  wardrobe: string;
  category: string;
  price: number;
  brand: string;
  imageUrl: string;
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
    price: number;
    user: {
      username: string;
      photo?: string;
    };
    brand:string,
    name:string
  };
}



export default function ProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"myWardrobes" | "savedItems">("myWardrobes");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [recentWardrobes, setRecentWardrobes] = useState<Wardrobe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const { toggleSave, savedItemIds, refreshSaved } = useSavedItems();
const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
const fetchLikeCount = async (itemId: string) => {
  try {
    const res = await api.get(`/api/like/item/${itemId}/count`);
    return res.data.count || 0;
  } catch (err) {
    console.log("Like count fetch failed", err);
    return 0;
  }
};
  const fetchSavedItems = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/api/saved/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Saved items response:", res.data);
      setSavedItems(res.data || []);
    } catch (error) {
      console.error("Error fetching saved items:", error);
      setSavedItems([]);
    }
  };
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


  // Helper function to get full image URL
  const DEFAULT_AVATAR =
    'https://ui-avatars.com/api/?name=User&background=random';

 


  // Fetch user profile and wardrobes data
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // 1. Fetch user's actual profile data FIRST
      const userResponse = await api.get("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("User profile response:", userResponse.data);
      const user = userResponse.data;
      setUser(user);

      // 2. Fetch user's wardrobe collections
      const wardrobesResponse = await api.get("/api/wardrobe/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Wardrobes collections response:", wardrobesResponse.data);

      // 3. Fetch user's wardrobe items
      const itemsResponse = await api.get("/api/wardrobe/my", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Wardrobe items response:", itemsResponse.data);

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

      // 4. Process wardrobe collections data
      let wardrobesList: Wardrobe[] = [];
      if (wardrobesResponse.data?.wardrobes) {
        wardrobesList = wardrobesResponse.data.wardrobes;
        console.log("Wardrobes with totalWorth:", wardrobesList.map(w => ({
          name: w.name,
          totalWorth: w.totalWorth,
          itemCount: w.itemCount
        })));

        setWardrobes(wardrobesList);

        const sortedByDate = [...wardrobesList].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setRecentWardrobes(sortedByDate.slice(0, 3));
      }

      // Format collection worth
      const formattedWorth = formatPrice(totalWorth);

      // Extract user data from the actual user object
      const userName = user.username || "User";
      const userHandle = user.email ? `@${user.email.split('@')[0]}` : `@${user.username || "user"}`;

      // Create a bio based on user info
      const userBio = user.bio || createUserBio(user);

      // Default followers count
      const followersCount = 0;

      // Set user data with the correct wardrobe count
      setUserData({
        name: userName,
        handle: userHandle,
        bio: userBio,
        collectionWorth: formattedWorth,
        followers: formatNumber(followersCount),
        wardrobeCount: wardrobesList.length, // Use wardrobesList.length instead of wardrobes.length
      });

    } catch (error: any) {
      console.error("Error fetching profile data:", error);
      console.error("Error details:", error.response?.data || error.message);

      // Use fallback data if API fails
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
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  useEffect(() => {
    fetchProfileData();
    fetchSavedItems();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileData();
    fetchSavedItems();
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
        <ActivityIndicator size="large" color="#A855F7" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* User info */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            {user?.photo ? (
             <Image
  source={{
    uri: user.photo
      ? `${baseURL}${user.photo}`
      : "https://ui-avatars.com/api/?name=User"
  }}
  style={styles.avatarImage}
  onError={(e) =>
    console.log("Profile image load error:", e.nativeEvent.error)
  }
/>

            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(userData?.name.toUpperCase() || "User")}
                </Text>
              </View>
            )}
            {/* Add Story Button */}
            <TouchableOpacity style={styles.addStoryBtn} onPress={handleAddStory}>
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.name}>{userData?.name.toUpperCase() || "User"}</Text>
            <Text style={styles.handle}>{userData?.handle || "@user"}</Text>
            <Text style={styles.bio}>{userData?.bio || "Fashion enthusiast | Style curator"}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={handleEditProfile}>
            <Ionicons name="pencil" size={16} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionBtn, styles.menuBtn]} onPress={handleSettingsPress}>
            <Ionicons name="ellipsis-horizontal" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {userData?.collectionWorth || "₹0"}
            </Text>
            <Text style={styles.statLabel}>Collection Worth</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {userData?.followers || "0"}
            </Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{userData?.wardrobeCount || 0}</Text>
            <Text style={styles.statLabel}>Wardrobes</Text>
          </View>
        </View>

        {/* Tabs */}
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

        {/* Content based on active tab */}
        {activeTab === "myWardrobes" ? (
          <View style={styles.contentContainer}>
            <TouchableOpacity style={styles.addWardrobeBtn} onPress={handleAddWardrobe}>
              <Text style={styles.addWardrobeText}>+ Add New Wardrobe</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.wardrobeCard} onPress={handleAllWardrobeItemsPress}>
              <View style={styles.imagesRow}>
                {recentWardrobes.slice(0, 3).map((wardrobe, idx) => (
                  <View
                    key={wardrobe._id}
                    style={[
                      styles.wardrobeColor,
                      {
                        backgroundColor: wardrobe.color || "#A855F7",
                        marginLeft: idx === 0 ? 0 : -10,
                        zIndex: 3 - idx
                      }
                    ]}
                  />
                ))}
                {recentWardrobes.length === 0 && (
                  <View style={styles.wardrobeColor} />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.wardrobeName}>All Wardrobe Items</Text>
                <Text style={styles.itemsCount}>{totalItems} items</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={24} color="#000" />
            </TouchableOpacity>

            {recentWardrobes.map((wardrobe) => (
              <TouchableOpacity
                key={wardrobe._id}
                style={styles.wardrobeCard}
                onPress={() => handleWardrobePress(wardrobe)}
              >
                <View style={styles.imagesRow}>
                  <View
                    style={[
                      styles.wardrobeColor,
                      { backgroundColor: wardrobe.color || "#A855F7" }
                    ]}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.wardrobeName}>{wardrobe.name}</Text>
                  <Text style={styles.itemsCount}>
                    {wardrobe.itemCount || 0} items
                  </Text>
                </View>
                <View>
                  <Text>
                    {formatPrice(wardrobe.totalWorth || 0)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={24} color="#000" />
              </TouchableOpacity>
            ))}

            {wardrobes.length > 3 && (
              <TouchableOpacity
                style={styles.moreWardrobesContainer}
                onPress={handleAllWardrobesPress} // <-- Add this
              >
                <Text style={styles.moreWardrobesText}>
                  +{wardrobes.length - 3} more wardrobes
                </Text>
              </TouchableOpacity>
            )}
            {wardrobes.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="folder-outline" size={48} color="#ccc" />
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
                {/* Header with count and sort */}
                <View style={styles.savedHeader}>
                  <Text style={styles.savedCount}>
                    {savedItems.length} saved items
                  </Text>

                  <TouchableOpacity style={styles.sortButton}>
                    <Text style={styles.sortButtonText}>Sort by</Text>
                    <Ionicons name="chevron-down" size={16} color="#000" />
                  </TouchableOpacity>
                </View>

                {/* Grid layout */}
                {savedItems.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="bookmark-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>No saved items yet</Text>
                    <Text style={styles.emptyStateSubText}>
                      Items you save will appear here
                    </Text>
                  </View>
                ) : (
                  <View style={styles.gridContainer}>
                    {savedItems.map((saved) => {
                      // Extract item data
                      const itemData = {
                        _id: saved.item._id,
                        name: saved.item.name || 'Item Name',
                        brand: saved.item.brand || saved.item.user?.username || 'Brand',
                        price: saved.item.price || 0,
                        likes: likeCounts[saved.item._id] || 0, // fallback for demo
                        imageUrl: saved.item.imageUrl,
                      };

                      return (
                        <View key={saved._id} style={styles.gridItem}>
                          <SavedGridCard
                            item={itemData}
                            onPress={() => {
                              // Navigate to item detail if needed
                              console.log('Pressed item:', saved.item._id);
                            }}
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

      {/* Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsModalVisible}
        onRequestClose={handleCloseSettings}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseSettings}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={handleNavigateToSettings}
            >
              <Ionicons name="settings-outline" size={20} color="#666" />
              <Text style={styles.modalItemText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalItem}
              onPress={handleNavigateToHelp}
            >
              <Ionicons name="help-circle-outline" size={20} color="#666" />
              <Text style={styles.modalItemText}>Help & Support</Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={[styles.modalItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={[styles.modalItemText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    paddingTop: 20
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
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#A855F7",
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
    color: "#fff",
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
    backgroundColor: "#A855F7",
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  editBtn: {
    backgroundColor: "#A855F7",
  },
  menuBtn: {
    backgroundColor: "#7C3AED",
  },
  name: {
    fontWeight: "700",
    fontSize: 18,
    marginBottom: 4,
  },
  handle: {
    color: "#777",
    fontSize: 14,
    marginBottom: 8,
  },
  bio: {
    color: "#444",
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
  },
  statLabel: {
    color: "#777",
    fontSize: 12,
  },
  tabRow: {
    flexDirection: "row",
    marginBottom: 20,
    marginTop: 10,
    backgroundColor: "#F5F5F5",
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
    backgroundColor: "#A855F7",
  },
  tabText: {
    fontWeight: "600",
    color: "#666",
    fontSize: 14,
  },
  activeTabText: {
    color: "#fff",
  },
  contentContainer: {
    marginBottom: 20,
  },
  addWardrobeBtn: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D8B4FE",
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#FAF5FF",
  },
  addWardrobeText: {
    color: "#A855F7",
    fontWeight: "600",
    fontSize: 14,
  },
  wardrobeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
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
    backgroundColor: "#A855F7",
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
    color: "#A855F7",
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
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
  },

  sortButtonText: {
    fontSize: 14,
    color: '#000',
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },

  gridItem: {
    width: '48%', // Two items per row with 4% gap
    marginBottom: 16,
  },

});