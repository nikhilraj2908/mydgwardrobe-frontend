import AppBackground from "@/components/AppBackground";
import WardrobeHeader from "@/components/WardrobeHeader";
import { useFollow } from "@/context/FollowContext";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/api";

interface User {
  _id: string;
  username: string;
  bio?: string;
  photo?: string;
}

interface Wardrobe {
  _id: string;
  name: string;
  totalItems: number;
  totalWorth: number;
  coverImage?: string;
}

interface WardrobeItem {
  _id: string;
  images?: string[];
  price: number;
  visibility: "public" | "private";
  accessLevel: "public" | "private" | "premium";
  wardrobe?: {
    _id: string;
    name: string;
  };
}

interface PremiumRequest {
  _id: string;
  requester: {
    _id: string;
    username: string;
    photo?: string;
  };
  item: WardrobeItem;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export default function OtherUserProfile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Premium states
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [hasPremiumItems, setHasPremiumItems] = useState(false);
  const [premiumCover, setPremiumCover] = useState<string | null>(null);
  const [premiumItemId, setPremiumItemId] = useState<string | null>(null);
  const [premiumRequestSent, setPremiumRequestSent] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumItemCount, setPremiumItemCount] = useState(0);
  const [premiumWorth, setPremiumWorth] = useState(0);
  const [isCheckingPremium, setIsCheckingPremium] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Owner states for premium requests
  const [premiumRequests, setPremiumRequests] = useState<PremiumRequest[]>([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  const { isFollowing, toggleFollow, ready } = useFollow();

  const followed = ready && user?._id ? isFollowing(userId) : false;

  const handleFollowToggle = async () => {
    if (!user?._id) return;
    await toggleFollow(userId);
  };

  // Check if current user has premium access
  const checkPremiumAccess = async () => {
    if (!premiumItemId) return;

    try {
      setIsCheckingPremium(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const accessRes = await api.get(
        `/api/premium/check?itemId=${premiumItemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHasPremiumAccess(accessRes.data.hasAccess);

      // 🔥 NEW: check request status
      if (!accessRes.data.hasAccess) {
        const statusRes = await api.get(
          `/api/premium/status?itemId=${premiumItemId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setPremiumRequestSent(statusRes.data.status === "pending");
      } else {
        setPremiumRequestSent(false);
      }

    } catch (e) {
      setHasPremiumAccess(false);
      setPremiumRequestSent(false);
    } finally {
      setIsCheckingPremium(false);
    }
  };

  // Request access to premium items
  const requestPremiumAccess = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login Required", "Please login to request premium access");
        router.push("/login");
        return;
      }

      if (!premiumItemId) {
        Alert.alert("Error", "Unable to send request");
        return;
      }

      await api.post(
        "/api/premium/request",
        { itemId: premiumItemId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPremiumRequestSent(true);
      Alert.alert(
        "Request Sent! 🚀",
        `Your request has been sent to ${user?.username}. You'll be notified when approved.`
      );

    } catch (error: any) {
      console.log("Premium request failed:", error.response?.data || error.message);

      if (error.response?.data?.message === "Request already sent") {
        setPremiumRequestSent(true);
        Alert.alert("Request Already Sent", "You have already requested access.");
      } else if (error.response?.status === 401) {
        Alert.alert("Login Required", "Please login to request premium access");
        router.push("/login");
      } else {
        Alert.alert("Error", "Failed to send request. Please try again.");
      }
    }
  };

  // Load premium requests (for owner)
  const loadPremiumRequests = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const response = await api.get('/api/premium/requests', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPremiumRequests(response.data || []);
    } catch (error) {
      console.log("Failed to load premium requests:", error);
    }
  };

  // Handle request response (approve/reject)
  const handleRequestResponse = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await api.post(
        '/api/premium/respond',
        { requestId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.message) {
        Alert.alert("Success", `Request ${action}d successfully`);

        // Remove from local state
        setPremiumRequests(prev => prev.filter(req => req._id !== requestId));

        // Refresh premium access if approved
        if (action === 'approve') {
          checkPremiumAccess();
        }
      }
    } catch (error) {
      Alert.alert("Error", `Failed to ${action} request`);
    }
  };
  
  const checkPremiumExistence = async () => {
    const res = await api.get(`/api/premium/user/${userId}/has-premium`);
    
    setHasPremiumItems(res.data.hasPremium);
    setPremiumItemId(res.data.sampleItemId);
    setPremiumItemCount(res.data.count);
    setPremiumWorth(res.data.totalWorth);
    setPremiumCover(
      res.data.coverImage ? resolveImageUrl(res.data.coverImage) : null
    );
  };

  // Load profile data
  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      checkPremiumExistence();
      // Check if viewing own profile
      if (token) {
        const meRes = await api.get("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isOwner) {
          return null; // or loader
        }
      }

      // Load user profile
      const userRes = await api.get(`/api/user/${userId}`);
      setUser(userRes.data);

      // Get follower count
      const followCountRes = await api.get(`/api/follow/counts/${userId}`);
      setFollowersCount(followCountRes.data.followers || 0);

      // Get user's wardrobes
      const wardrobeRes = await api.get(`/api/collections/${userId}/wardrobes`);
      setWardrobes(wardrobeRes.data.wardrobes || []);

    } catch (err) {
      console.log("Failed to load profile", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ Load flow
  useEffect(() => {
    if (!userId) return;
    loadProfile();
  }, [userId]);

  useEffect(() => {
    if (premiumItemId) {
      checkPremiumAccess();
    }
  }, [premiumItemId]);

  // Load premium requests if this is the owner's profile
  useEffect(() => {
    const loadOwnerData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const meRes = await api.get("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (meRes.data?._id === userId) {
          setIsOwner(true);
          loadPremiumRequests();
        }
      } catch (error) {
        console.log("Failed to check ownership:", error);
      }
    };

    loadOwnerData();
  }, [userId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  // Navigate to premium items
  const viewPremiumItems = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login Required", "Please login to view premium items");
        router.push("/login");
        return;
      }

      router.push(`/wardrobe/premium?userId=${userId}`);
    } catch (error) {
      console.log("Navigation error:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#A855F7" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate totals for public items
  const publishedItemCount = wardrobes.reduce((sum, w) => sum + (w.totalItems || 0), 0);
  const publishedWorth = wardrobes.reduce((sum, w) => sum + (w.totalWorth || 0), 0);
  const publishedCoverImage = wardrobes.find(w => w.coverImage)?.coverImage || null;

  return (
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>

    <AppBackground>
        <View style={styles.container}>
          {/* Header */}
          <WardrobeHeader
            onBack={() => router.back()}
            title={user.username}
            showFilters={false}
          />

          {/* Premium Requests Badge for Owner */}
          {isOwner && premiumRequests.length > 0 && (
            <TouchableOpacity
              style={styles.requestsBadge}
              onPress={() => setShowRequestsModal(true)}
            >
              <Ionicons name="notifications" size={20} color="#fff" />
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{premiumRequests.length}</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Scrollable content */}
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.scrollContent}
          >
            {/* USER HEADER */}
            <View style={styles.userCard}>
              {user.photo ? (
                <Image
                  source={{ uri: resolveImageUrl(user.photo) }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>
                    {user.username[0]?.toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{user.username.toUpperCase()}</Text>
                    <Text style={styles.handle}>@{user.username}</Text>
                  </View>

                  {ready && !isOwner && (
                    <TouchableOpacity
                      style={[
                        styles.followBtnInline,
                        followed && styles.followingBtn,
                      ]}
                      onPress={handleFollowToggle}
                    >
                      <Ionicons
                        name={followed ? "checkmark" : "person-add-outline"}
                        size={14}
                        color="#fff"
                      />
                      <Text style={styles.followText}>
                        {followed ? "Following" : "Follow"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.bio}>{user.bio || "No bio available"}</Text>
              </View>
            </View>

            {/* STATS */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>₹{publishedWorth + premiumWorth}</Text>
                <Text style={styles.statLabel}>Collection Worth</Text>
              </View>

              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() =>
                  router.push(`/profile/followers?userId=${userId}&tab=followers`)
                }
              >
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{followersCount}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.statBox}>
                <Text style={styles.statValue}>{wardrobes.length}</Text>
                <Text style={styles.statLabel}>Wardrobes</Text>
              </View>
            </View>

            {/* WARDROBES SECTION */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Wardrobes</Text>
            </View>

            {/* Box Grid for Published and Premium Items */}
            <View style={styles.boxGrid}>
              {/* Premium Collection Card - Shows if user has premium items */}
              {hasPremiumItems && (
                <TouchableOpacity
                  style={[styles.premiumCard, !hasPremiumAccess && styles.lockedCard]}
                  onPress={() => {
                    if (hasPremiumAccess) {
                      router.push(`/wardrobe/premium?userId=${userId}`);
                    } else {
                      setShowPremiumModal(true);
                    }
                  }}
                  activeOpacity={!hasPremiumAccess ? 0.9 : 0.7}
                >
                  {premiumCover ? (
                    <Image source={{ uri: premiumCover }} style={styles.cardImage} />
                  ) : (
                    <View style={styles.cardPlaceholder}>
                      <Text style={styles.cardPlaceholderText}>Premium Collection</Text>
                    </View>
                  )}

                  {/* Lock Overlay if locked */}
                  {!hasPremiumAccess && (
                    <View style={styles.lockOverlay}>
                      <Ionicons name="lock-closed" size={26} color="#fff" />
                      <Text style={styles.lockText}>Locked</Text>
                    </View>
                  )}

                  {/* Premium Badge */}
                  <View style={styles.premiumBadge}>
                    <Text style={styles.badgeText}>PREMIUM</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Public Items Card */}
              <TouchableOpacity
                style={styles.publicCard}
                onPress={() =>
                  // router.push(`/wardrobe/items/${userId}`)
                  router.push(`/profile/public-wardrobe?userId=${userId}`)
                }
                activeOpacity={0.7}
              >
                {publishedCoverImage ? (
                  <Image 
                    source={{ uri: resolveImageUrl(publishedCoverImage) }} 
                    style={styles.cardImage} 
                  />
                ) : (
                  <View style={styles.cardPlaceholder}>
                    <Text style={styles.cardPlaceholderText}>Public Items</Text>
                  </View>
                )}

                {/* Public Badge */}
                <View style={styles.publicBadge}>
                  <Text style={styles.badgeText}>PUBLIC</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* INDIVIDUAL WARDROBES */}
            {/* {wardrobes.length > 0 ? (
              wardrobes.map((w) => (
                <TouchableOpacity
                  key={w._id}
                  style={styles.wardrobeCard}
                  onPress={() =>
                    router.push(`/wardrobe/${w._id}?public=true`)
                  }
                >
                  <View style={[styles.wardrobeIcon, { backgroundColor: "#A855F7" }]}>
                    <Text style={styles.wardrobeIconText}>
                      {w.name[0]?.toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.wardrobeInfo}>
                    <Text style={styles.wardrobeName}>{w.name}</Text>
                    <Text style={styles.itemsCount}>
                      {w.totalItems || 0} items
                    </Text>
                  </View>
                  <Text style={styles.price}>₹{w.totalWorth || 0}</Text>
                  <Ionicons name="chevron-forward" size={22} color="#777" />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyWardrobes}>
                <Ionicons name="folder-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No wardrobes yet</Text>
              </View>
            )} */}
          </ScrollView>

          {/* Premium Access Modal */}
          <Modal
            visible={showPremiumModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPremiumModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowPremiumModal(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.modalIcon}>
                    <Ionicons name="lock-closed" size={48} color="#A855F7" />
                  </View>

                  <Text style={styles.modalTitle}>Request Premium Access</Text>
                  <Text style={styles.modalDescription}>
                    Send a request to <Text style={styles.boldText}>{user?.username}</Text> to access their exclusive premium collection. They will be notified and can approve your request.
                  </Text>

                  <View style={styles.premiumCardPreview}>
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumBadgeText}>PREMIUM ITEMS COUNT</Text>
                    </View>
                    <Text style={styles.premiumCardCount}>{premiumItemCount} items</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.sendRequestButton}
                    onPress={() => {
                      requestPremiumAccess();
                      setShowPremiumModal(false);
                    }}
                  >
                    <Ionicons name="send-outline" size={20} color="#fff" />
                    <Text style={styles.sendRequestButtonText}>Send Request</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowPremiumModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Premium Requests Modal (for owner) */}
          <Modal
            visible={showRequestsModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowRequestsModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.requestsModalContent}>
                <View style={styles.requestsModalHeader}>
                  <Text style={styles.modalTitle}>Premium Access Requests</Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowRequestsModal(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {premiumRequests.length === 0 ? (
                  <View style={styles.emptyRequests}>
                    <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyRequestsText}>No pending requests</Text>
                  </View>
                ) : (
                  <ScrollView style={styles.requestsList}>
                    {premiumRequests.map((request) => (
                      <View key={request._id} style={styles.requestItem}>
                        <View style={styles.requestHeader}>
                          {request.requester.photo ? (
                            <Image
                              source={{ uri: resolveImageUrl(request.requester.photo) }}
                              style={styles.requesterAvatar}
                            />
                          ) : (
                            <View style={styles.requesterAvatarFallback}>
                              <Text style={styles.requesterAvatarText}>
                                {request.requester.username[0]?.toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <View style={styles.requesterInfo}>
                            <Text style={styles.requesterName}>
                              {request.requester.username}
                            </Text>
                            <Text style={styles.requestTime}>
                              Wants to access your premium items
                            </Text>
                          </View>
                        </View>

                        <View style={styles.requestActions}>
                          {request.status === 'pending' ? (
                            <>
                              <TouchableOpacity
                                style={[styles.actionButton, styles.approveButton]}
                                onPress={() => handleRequestResponse(request._id, 'approve')}
                              >
                                <Ionicons name="checkmark" size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Approve</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.actionButton, styles.rejectButton]}
                                onPress={() => handleRequestResponse(request._id, 'reject')}
                              >
                                <Ionicons name="close" size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Reject</Text>
                              </TouchableOpacity>
                            </>
                          ) : (
                            <View style={[
                              styles.statusBadge,
                              request.status === 'approved' ? styles.approvedBadge : styles.rejectedBadge
                            ]}>
                              <Text style={styles.statusText}>
                                {request.status === 'approved' ? 'Approved' : 'Rejected'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>
        </View>
    </AppBackground>
      </SafeAreaView>

  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#ffffff70",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  backText: {
    color: "#A855F7",
    fontSize: 16,
    fontWeight: "600",
  },
  userCard: {
    flexDirection: "row",
    marginBottom: 24,
    alignItems: "center",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35
  },
  avatarFallback: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#A855F7",
    justifyContent: "center",
    alignItems: "center"
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700"
  },
  userInfo: {
    flex: 1,
    marginLeft: 16
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  handle: {
    color: "#777",
    marginVertical: 2,
    fontSize: 14,
  },
  bio: {
    color: "#444",
    fontSize: 14,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 8,
  },
  statValue: {
    fontWeight: "700",
    fontSize: 18,
    color: "#1A1A1A",
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  wardrobeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  wardrobeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  wardrobeIconText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  wardrobeInfo: {
    flex: 1
  },
  wardrobeName: {
    fontWeight: "700",
    fontSize: 14,
    color: "#1A1A1A",
    marginBottom: 2,
  },
  itemsCount: {
    fontSize: 13,
    color: "#777"
  },
  price: {
    marginRight: 12,
    fontWeight: "600",
    fontSize: 16,
    color: "#1A1A1A",
  },
  followBtnInline: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#A855F7",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  followingBtn: {
    backgroundColor: "#7C3AED",
  },
  followText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  boxGrid: {
    flexDirection: "column",
    marginBottom: 20,
  },
  emptyWardrobes: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#777",
    fontSize: 14,
    marginTop: 12,
  },
  // Card Styles (Replacing BoxWardrobeCard)
  premiumCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 3,
    marginBottom: 12,
    elevation: 3,
    overflow: "hidden",
    position: "relative",
    height: 220,
  },
  publicCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 3,
    marginBottom: 20,
    elevation: 3,
    overflow: "hidden",
    position: "relative",
    height: 220,
  },
  lockedCard: {
    opacity: 0.9,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E9D5FF",
    justifyContent: "center",
    alignItems: "center",
  },
  cardPlaceholderText: {
    color: "#7C3AED",
    fontSize: 16,
    fontWeight: "600",
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  lockText: {
    marginTop: 6,
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  premiumBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#A855F7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 6,
  },
  publicBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#10B981",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  requestsModalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    padding: 20,
    paddingBottom: 10,
    alignItems: "flex-end",
  },
  requestsModalHeader: {
    padding: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    paddingTop: 0,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1A1A1A",
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: "600",
    color: "#1A1A1A",
  },
  // Premium Card Preview
  premiumCardPreview: {
    backgroundColor: "#F8F5FF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    width: "100%",
  },
  premiumBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  premiumCardCount: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  // Buttons
  sendRequestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#A855F7",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 16,
    width: "100%",
  },
  sendRequestButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
  },
  // Premium Requests Styles
  requestsBadge: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 100,
    backgroundColor: "#A855F7",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeCount: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#EF4444",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeCountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  emptyRequests: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyRequestsText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  requestsList: {
    flex: 1,
    padding: 20,
  },
  requestItem: {
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  requesterAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  requesterAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#A855F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  requesterAvatarText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  requesterInfo: {
    flex: 1,
  },
  requesterName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  requestTime: {
    fontSize: 12,
    color: "#666",
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    flex: 1,
  },
  approveButton: {
    backgroundColor: "#10B981",
  },
  rejectButton: {
    backgroundColor: "#EF4444",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  approvedBadge: {
    backgroundColor: "#10B98120",
  },
  rejectedBadge: {
    backgroundColor: "#EF444420",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A1A1A",
  },
});