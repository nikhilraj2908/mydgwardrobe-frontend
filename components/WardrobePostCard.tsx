import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import api from "../api/api";

const { width } = Dimensions.get('window');
const BASE_URL = "https://api.digiwardrobe.com";

interface WardrobeItem {
  _id: string;
  name: string;
  imageUrl?: string;
  image?: string;
  brand?: string;
  category?: string;
  price?: number;
  visibility?: string;
}

interface WardrobePostCardProps {
  item: {
    _id: string;
    name?: string;
    description?: string;
    totalWorth?: number;  // This should come from backend
    itemCount?: number;   // This should come from backend
    imageUrl?: string;
    image?: string;
    likes?: number;
    user?: {
      _id: string;
      username: string;
      photo?: string;
    };
  };
  onUpdate?: (postId: string, updatedData: any) => void;
}

export default function WardrobePostCard({ item, onUpdate }: WardrobePostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  const [isOpen, setIsOpen] = useState(false);
  const [itemsInside, setItemsInside] = useState<WardrobeItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Dynamic values from props
  const totalItems = item.itemCount || 0;
  const totalWorth = item.totalWorth || 0;
  
  // Animation values
  const leftDoorAnim = useRef(new Animated.Value(0)).current;
  const rightDoorAnim = useRef(new Animated.Value(0)).current;
  const interiorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Don't fetch like status since endpoint doesn't exist
    // fetchLikeStatus();
  }, [item._id]);

  // Fetch wardrobe items - using the same endpoint as your profile page
  const loadWardrobeItems = async () => {
    if (itemsInside.length > 0) return;
    
    setLoadingItems(true);
    setError(null);
    
    try {
      
      // Fetch items specific to this wardrobe by name
      // Since your backend uses wardrobe name to filter items
      const response = await api.get(`/api/wardrobe/public/${item._id}/items`);

      
      console.log("Wardrobe items response:", response.data);
      
      // Try different response structures
      let items: WardrobeItem[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        items = response.data;
      } else if (response.data?.items && Array.isArray(response.data.items)) {
        items = response.data.items;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        items = response.data.data;
      }
      
      if (items.length > 0) {
        setItemsInside(items);
      } else {
        // If no items found, check if we have itemCount > 0 but no items
        // This might happen if the endpoint doesn't exist yet
        if (totalItems > 0) {
          setError("Could not load items. Please try again.");
        } else {
          setError("This wardrobe is empty");
        }
      }
      
    } catch (error: any) {
      console.log("Error loading wardrobe items:", error.message);
      
      // If we have itemCount but can't fetch items, show error
      if (totalItems > 0) {
        setError("Failed to load items. Check your connection.");
      } else {
        setError("This wardrobe is empty");
      }
      
    } finally {
      setLoadingItems(false);
    }
  };

  // Door opening animation
  const openWardrobe = () => {
    loadWardrobeItems();
    
    Animated.parallel([
      Animated.timing(leftDoorAnim, {
        toValue: -width * 0.35,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rightDoorAnim, {
        toValue: width * 0.35,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(interiorAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setIsOpen(true);
  };

  // Door closing animation
  const closeWardrobe = () => {
    Animated.parallel([
      Animated.timing(leftDoorAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rightDoorAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(interiorAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    setIsOpen(false);
  };

  const toggleWardrobe = () => {
    if (!isOpen) {
      openWardrobe();
    } else {
      closeWardrobe();
    }
  };

  // Format price with commas
  const formatPrice = (price: number) => {
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    } else if (price >= 1000) {
      return `₹${(price / 1000).toFixed(1)}K`;
    }
    return `₹${price}`;
  };

  // Simplified like handler without backend check
  const handleLike = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login Required", "Please login to like posts");
        return;
      }

      setLoading(true);
      
      // Toggle like locally
      const newLiked = !liked;
      setLiked(newLiked);
      const newCount = newLiked ? likeCount + 1 : likeCount - 1;
      setLikeCount(newCount);
      
      // Try to update on backend if endpoint exists
      try {
        const res = await api.post(
          "/api/like/toggle",
          {
            postType: "wardrobe",
            postId: item._id,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        // Update with backend response if available
        if (res.data?.liked !== undefined) {
          setLiked(res.data.liked);
          setLikeCount(res.data.count || newCount);
        }
        
      } catch (apiError) {
        console.log("Like API call failed, using local state only");
        // Continue with local state
      }
      
      // Update parent component
      onUpdate?.(item._id, { likes: newCount, liked: newLiked });
      
    } catch (error: any) {
      console.log("Like error:", error);
      Alert.alert("Error", "Failed to like wardrobe");
    } finally {
      setLoading(false);
    }
  };

  const openItemModal = (wardrobeItem: WardrobeItem) => {
    setSelectedItem(wardrobeItem);
    setShowItemModal(true);
  };

  const renderItemInside = ({ item: wardrobeItem }: { item: WardrobeItem }) => (
    <TouchableOpacity
      style={styles.itemInsideCard}
      onPress={() => openItemModal(wardrobeItem)}
      activeOpacity={0.7}
    >
      <View style={styles.itemImageContainer}>
        <Image 
          source={{ 
            uri: wardrobeItem.imageUrl 
              ? `${BASE_URL}${wardrobeItem.imageUrl}`
              : wardrobeItem.image 
          }} 
          style={styles.itemInsideImage}
          defaultSource={require("../assets/images/icon.png")}
        />
      </View>
      <View style={styles.itemInsideInfo}>
        <Text style={styles.itemInsideName} numberOfLines={1}>
          {wardrobeItem.name || `${wardrobeItem.category} Item`}
        </Text>
        {wardrobeItem.brand && (
          <Text style={styles.itemInsideBrand} numberOfLines={1}>
            {wardrobeItem.brand}
          </Text>
        )}
        {wardrobeItem.price && (
          <Text style={styles.itemInsidePrice} numberOfLines={1}>
            {formatPrice(wardrobeItem.price)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.userIcon}>
            <Text style={styles.userInitial}>
              {item.user?.username?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>{item.user?.username || "User"}</Text>
            <Text style={styles.userHandle}>@{item.user?.username?.toLowerCase() || "user"}</Text>
          </View>
        </View>
        
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={styles.description}>
          {item.description || `${item.name || "My Wardrobe"} collection`}
        </Text>
      </View>

      {/* Wardrobe Container */}
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={toggleWardrobe}
        style={styles.wardrobeTouchable}
      >
        <View style={styles.wardrobeWrapper}>
          {/* Wardrobe Exterior (Closed State) */}
          <Animated.View 
            style={[
              styles.wardrobeExterior,
              {
                opacity: interiorAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              }
            ]}
          >
            <View style={styles.wardrobeFrame}>
              {/* Left Door */}
              <Animated.View 
                style={[
                  styles.door,
                  styles.leftDoor,
                  {
                    transform: [{ translateX: leftDoorAnim }],
                  }
                ]}
              >
                <View style={styles.doorContent}>
                  <Ionicons name="chevron-back" size={30} color="#FFF" />
                  <Text style={styles.doorText}>PEEK INSIDE</Text>
                </View>
                <View style={styles.doorHandle} />
              </Animated.View>

              {/* Right Door */}
              <Animated.View 
                style={[
                  styles.door,
                  styles.rightDoor,
                  {
                    transform: [{ translateX: rightDoorAnim }],
                  }
                ]}
              >
                <View style={styles.doorContent}>
                  <Text style={styles.doorText}>{item.name?.toUpperCase() || "WARDROBE"}</Text>
                  <Ionicons name="chevron-forward" size={30} color="#FFF" />
                </View>
                <View style={styles.doorHandle} />
              </Animated.View>

              {/* Wardrobe Preview */}
              <View style={styles.wardrobePreview}>
                <View style={styles.previewOverlay} />
                <Text style={styles.wardrobeTitle}>{item.name || "Wardrobe Collection"}</Text>
                
                <View style={styles.wardrobeStats}>
                  <View style={styles.statBadge}>
                    <Ionicons name="cash-outline" size={16} color="#FFF" />
                    <Text style={styles.statText}>
                      {formatPrice(totalWorth)}
                    </Text>
                  </View>
                  
                  <View style={styles.statDivider} />
                  
                  <View style={styles.statBadge}>
                    <Ionicons name="shirt-outline" size={16} color="#FFF" />
                    <Text style={styles.statText}>
                      {totalItems} {totalItems === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.peekInstruction}>
                  <Ionicons name={isOpen ? "chevron-down" : "hand-right-outline"} size={14} color="#FFF" />
                  <Text style={styles.peekText}>
                    {isOpen ? "Tap to close" : "Tap to peek inside"}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Wardrobe Interior (Open State) */}
          <Animated.View 
            style={[
              styles.wardrobeInterior,
              {
                opacity: interiorAnim,
                transform: [
                  { scale: interiorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  })}
                ],
              }
            ]}
          >
            <View style={styles.interiorHeader}>
              <Text style={styles.interiorTitle}>Inside This Wardrobe</Text>
              <Text style={styles.interiorSubtitle}>
                {loadingItems ? "Loading..." : `${itemsInside.length} items • ${formatPrice(totalWorth)} value`}
              </Text>
            </View>

            {loadingItems ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#A855F7" />
                <Text style={styles.loadingText}>Loading items...</Text>
              </View>
            ) : itemsInside.length > 0 ? (
              <FlatList
                data={itemsInside}
                renderItem={renderItemInside}
                keyExtractor={(item) => item._id}
                numColumns={2}
                columnWrapperStyle={styles.itemsGrid}
                scrollEnabled={false}
                contentContainerStyle={styles.itemsContainer}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#888" />
                <Text style={styles.emptyText}>
                  {totalItems > 0 ? "Could not load items" : "No items in this wardrobe"}
                </Text>
              </View>
            )}
            
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="shirt-outline" size={18} color="#A855F7" />
          <Text style={styles.statsText}>{totalItems} items</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="cash-outline" size={18} color="#10B981" />
          <Text style={styles.statsText}>{formatPrice(totalWorth)} value</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="heart-outline" size={18} color="#EF4444" />
          <Text style={styles.statsText}>{likeCount} likes</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
          disabled={loading}
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={24}
            color={liked ? "#EF4444" : "#666"}
          />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Alert.alert("Comments", "Comments feature coming soon!");
          }}
        >
          <Ionicons name="chatbubble-outline" size={22} color="#666" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-social-outline" size={22} color="#666" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Item Detail Modal */}
      <Modal
        visible={showItemModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Item Details</Text>
              <TouchableOpacity onPress={() => setShowItemModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {selectedItem && (
              <>
                <Image 
                  source={{ 
                    uri: selectedItem.imageUrl 
                      ? `${BASE_URL}${selectedItem.imageUrl}`
                      : selectedItem.image 
                  }} 
                  style={styles.modalImage}
                  defaultSource={require("../assets/images/icon.png")}
                />
                <Text style={styles.modalItemName}>
                  {selectedItem.name || `${selectedItem.category} Item`}
                </Text>
                {selectedItem.brand && (
                  <Text style={styles.modalItemBrand}>Brand: {selectedItem.brand}</Text>
                )}
                {selectedItem.category && (
                  <Text style={styles.modalItemCategory}>Category: {selectedItem.category}</Text>
                )}
                {selectedItem.price && (
                  <Text style={styles.modalItemPrice}>Price: {formatPrice(selectedItem.price)}</Text>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 22,
    marginVertical: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  
  userIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E9D5FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  
  userInitial: {
    fontWeight: "700",
    fontSize: 18,
    color: "#6B21A8",
  },
  
  userDetails: {
    flex: 1,
  },
  
  username: {
    fontWeight: "700",
    fontSize: 14,
    color: "#000",
  },
  
  userHandle: {
    fontSize: 12,
    color: "#666",
  },
  
  descriptionContainer: {
    marginBottom: 16,
  },
  
  description: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  
  wardrobeTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  
  wardrobeWrapper: {
    height: 360,
    position: 'relative',
  },
  
  wardrobeExterior: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#8B5CF6',
  },
  
  wardrobeFrame: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  
  door: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderWidth: 1,
    borderColor: '#6D28D9',
  },
  
  leftDoor: {
    borderRightWidth: 2,
    borderRightColor: '#5B21B6',
  },
  
  rightDoor: {
    borderLeftWidth: 2,
    borderLeftColor: '#5B21B6',
  },
  
  doorContent: {
    alignItems: 'center',
  },
  
  doorText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 1,
    textAlign: 'center',
  },
  
  doorHandle: {
    position: 'absolute',
    width: 8,
    height: 40,
    backgroundColor: '#FBBF24',
    borderRadius: 4,
    left: 12,
  },
  
  wardrobePreview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  
  wardrobeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  
  wardrobeStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
  },
  
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  
  statText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 18,
    marginLeft: 6,
  },
  
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  
  peekInstruction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.5)',
  },
  
  peekText: {
    fontSize: 12,
    color: '#FFF',
    marginLeft: 6,
    fontWeight: '500',
  },
  
  wardrobeInterior: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    padding: 16,
  },
  
  interiorHeader: {
    marginBottom: 16,
  },
  
  interiorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  
  interiorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  itemsContainer: {
    paddingBottom: 8,
  },
  
  itemsGrid: {
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  
  itemInsideCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 12,
  },
  
  itemImageContainer: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#E5E7EB',
  },
  
  itemInsideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  
  itemInsideInfo: {
    paddingHorizontal: 4,
  },
  
  itemInsideName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  
  itemInsideBrand: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  
  itemInsidePrice: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 2,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  
  errorText: {
    fontSize: 12,
    color: '#1D4ED8',
    marginLeft: 6,
    textAlign: 'center',
  },
  
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  statsText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  
  actionText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#666',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
  },
  
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
  },
  
  modalItemName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  
  modalItemBrand: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  
  modalItemCategory: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  
  modalItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
});