import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import api from "../api/api";
import { useSavedItems } from "../context/SavedItemsContext";

import { useFollow } from "../context/FollowContext";


const { width } = Dimensions.get('window');
const BASE_URL = "https://api.digiwardrobe.com";

interface CommentType {
  _id: string;
  text: string;
  user:
  | string
  | {
    _id?: string;
    id?: string;
    username: string;
    photo?: string;
  };
  createdAt: string;
}


export default function ItemPostCard({ item, onDelete, currentUserId }: any) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedComment, setSelectedComment] = useState<CommentType | null>(null);
  const [showCommentActions, setShowCommentActions] = useState(false);
  const [justFollowed, setJustFollowed] = useState(false);
  // const [saved, setSaved] = useState(false);
  // const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // Debug log
 const { isFollowing, toggleFollow, ready } = useFollow();
  const ownerId =
    typeof item.user === "string" ? item.user : item.user?._id;

  const followed = ready && ownerId ? isFollowing(String(ownerId)) : false;

  const isOwner = currentUserId && ownerId && String(currentUserId) === String(ownerId);

const showFollowPlus =
  ready && !isOwner && ownerId && !followed && !justFollowed;

const showTick =
  ready && !isOwner && ownerId && justFollowed;

  const { savedItemIds, toggleSave, isReady } = useSavedItems();
  const saved = savedItemIds.includes(item._id);
  console.log("ItemPostCard received item:", {
    id: item._id,
    name: item.name,
    imageUrl: item.imageUrl,
    image: item.image,
    price: item.price
  });
  const handleDeleteItem = async () => {
    try {
      setDeleting(true);
      const token = await AsyncStorage.getItem("token");

      await api.delete(`/api/wardrobe/item/${item._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMenuVisible(false);
      onDelete?.(item._id);

    } catch (err) {
      console.log("Delete failed", err);
    } finally {
      setDeleting(false);
    }
  };



  const canDeleteComment = (comment: CommentType) => {
    if (!currentUserId || !item) return false;

    const currentId = String(currentUserId);

    const commentUserId =
      typeof comment.user === "string"
        ? String(comment.user)
        : String(comment.user?._id || comment.user?.id || "");

    const itemOwnerId =
      typeof item.user === "string" ? String(item.user) : String(item.user?._id || "");

    return commentUserId === currentId || itemOwnerId === currentId;
  };

  const handleDeleteComment = async () => {
    if (!selectedComment?._id) return;

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login Required", "Please login to delete comments");
        return;
      }

      await api.delete(`/api/comment/${selectedComment._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setComments((prev) => prev.filter((c) => c._id !== selectedComment._id));
      setCommentCount((prev) => Math.max(0, prev - 1));

      setShowCommentActions(false);
      setSelectedComment(null);
    } catch (err) {
      Alert.alert("Error", "Unable to delete comment");
    }
  };
  /* ======================================================
     CHECK IF ITEM IS SAVED
  ====================================================== */


  /* ======================================================
     TOGGLE SAVE
  ====================================================== */

  const handleSave = () => {
    if (!isReady) {
      Alert.alert("Please wait", "Loading your profile…");
      return;
    }
    toggleSave(item._id);
  };

  useEffect(() => {
    fetchLikeStatus();   // 👈 IMPORTANT
    fetchLikeCount();
    fetchComments();
    // checkFollowStatus();
  }, [item._id]);



  const fetchLikeStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await api.get(
        `/api/like/item/${item._id}/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setLiked(Boolean(res.data.liked));
    } catch (err) {
      console.log("Like status fetch failed", err);
    }
  };

  // const isOwner = currentUserId === item.user?._id;
  const fetchLikeCount = async () => {
    try {
      const res = await api.get(`/api/like/item/${item._id}/count`);
      setLikeCount(res.data.count || 0);
    } catch (error) {
      console.error("Error fetching like count:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/api/comment/${item._id}`);
      setComments(res.data.comments || []);
      setCommentCount(res.data.comments?.length || 0);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleLike = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login Required", "Please login to like posts");
        return;
      }

      setLoading(true);

      const res = await api.post(
        "/api/like/toggle",
        {
          postType: "item",
          postId: item._id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const isNowLiked = res.data.liked;

      setLiked(isNowLiked);
      setLikeCount((prev: number) =>
        isNowLiked ? prev + 1 : Math.max(0, prev - 1)
      );
    } catch (error: any) {
      console.error("Like error:", error);
      Alert.alert("Error", "Failed to like");
    } finally {
      setLoading(false);
    }
  };


  const handlePostOwnerPress = () => {
    if (!item.user?._id) return;
    router.push(`/profile/${item.user._id}`);
  };



  const handleComment = async () => {
    if (!commentText.trim()) return;

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Login Required", "Please login to comment");
        return;
      }

      setLoading(true);
      const res = await api.post(
        `/api/comment/${item._id}`,
        { text: commentText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setComments((prev) => [res.data.comment, ...prev]);
      setCommentCount(prev => prev + 1);
      setCommentText("");
    } catch (error: any) {
      console.error("Comment error:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to comment");
    } finally {
      setLoading(false);
    }
  };

  const openComments = () => {
    setShowComments(true);
  };

  // Helper function to get image URL
  const getImageUrl = () => {
    // Try multiple possible image fields
    let imagePath = item.imageUrl || item.image || item.photo || item.picture;

    if (!imagePath) return null;

    // If already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // If starts with slash, prepend BASE_URL
    if (imagePath.startsWith('/')) {
      return `${BASE_URL}${imagePath}`;
    }

    // Otherwise, prepend BASE_URL with slash
    return `${BASE_URL}/${imagePath}`;
  };

  // Helper function to get user avatar URL
  const getUserAvatarUrl = () => {
    const photoPath = item.user?.photo;

    if (!photoPath) return null;

    if (photoPath.startsWith('http')) {
      return photoPath;
    }

    if (photoPath.startsWith('/')) {
      return `${BASE_URL}${photoPath}`;
    }

    return `${BASE_URL}/${photoPath}`;
  };
  const formatCommentTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  useEffect(() => {
    console.log("Saved IDs from context:", savedItemIds);
  }, [savedItemIds]);
  const renderComment = ({ item: comment }: { item: CommentType }) => {
    const userObj = typeof comment.user === "string" ? null : comment.user;


    const handleUserPress = () => {
      if (!userObj?._id && !userObj?.id) return;

      const userId = userObj._id || userObj.id;
      router.push(`/profile/${userId}`);
    };







    return (
      <View style={styles.commentItem}>
        <View style={styles.commentUser}>
          {userObj?.photo ? (
            <TouchableOpacity onPress={handleUserPress}>
              <Image
                source={{ uri: `${BASE_URL}${userObj.photo}` }}
                style={styles.commentAvatar}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.commentAvatarPlaceholder}
              onPress={handleUserPress}
            >
              <Text style={styles.commentInitial}>
                {userObj?.username?.charAt(0).toUpperCase() || "U"}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.commentContent}>
            <View style={styles.commentHeaderRow}>
              <TouchableOpacity onPress={handleUserPress}>
                <Text style={styles.commentUsername}>
                  {userObj?.username || "User"}
                </Text>
              </TouchableOpacity>


              {canDeleteComment(comment) && (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedComment(comment);
                    setShowCommentActions(true);
                  }}
                >
                  <Ionicons name="ellipsis-vertical" size={16} color="#000" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.commentText}>{comment.text}</Text>

            <Text style={styles.commentTime}>
              {formatCommentTime(comment.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };
useEffect(() => {
  // Whenever a new post/user renders, reset local UI state
  setJustFollowed(false);
}, [ownerId]);

  const imageUrl = getImageUrl();
  const avatarUrl = getUserAvatarUrl();


const handleFollowPress = async () => {
  if (!ready || !ownerId) return;

  await toggleFollow(String(ownerId));

  setJustFollowed(true);
  setTimeout(() => setJustFollowed(false), 1200);
};

  return (
    <>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center" }}
            onPress={handlePostOwnerPress}
          >
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>
                  {item.user?.username?.[0]?.toUpperCase() || "U"}
                </Text>
              )}
            </View>

            <View>
              <Text style={styles.username}>{item.user?.username}</Text>
              <Text style={styles.handle}>
                @{item.user?.username?.toLowerCase()}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", marginLeft: "auto" }}>

            {/* FOLLOW ICON */}
            {/* FOLLOW UI */}
            {showFollowPlus && (
              <TouchableOpacity
                onPress={handleFollowPress}
                style={styles.followIcon}
              >
                <Ionicons
                  name="person-add-outline"
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            )}

            {showTick && (
              <View style={styles.followIcon}>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color="#A855F7"
                />
              </View>
            )}


            {/* MENU */}
            <TouchableOpacity onPress={() => setMenuVisible(v => !v)}>
              <Ionicons name="ellipsis-vertical" size={18} color="#666" />
            </TouchableOpacity>

          </View>

        </View>


        {/* Image */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              onError={() => {
                console.log("Image failed to load:", imageUrl);
                setImageError(true);
              }}
              onLoad={() => setImageError(false)}
            />
          ) : (
            <View style={[styles.image, styles.noImage]}>
              <Ionicons name="image-outline" size={50} color="#CCC" />
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          )}

          {/* Price badge */}
          {item.price && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>₹{item.price / 1000}K</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <View style={styles.leftActions}>
            <TouchableOpacity
              onPress={handleLike}
              disabled={loading}
              style={styles.actionIcon}
            >
              <Image
                source={require("../assets/icons/like.png")}
                style={[
                  styles.actionImageIcon,
                  liked && { tintColor: "#A855F7" } // only when liked
                ]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openComments}
              style={styles.actionIcon}
            >
              <Image
                source={require("../assets/icons/comment.png")}
                style={styles.actionImageIcon}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleSave}>
            <Image
              source={
                saved
                  ? require("../assets/icons/bookmark-saved.png")
                  : require("../assets/icons/bookmark.png")
              }
              style={[
                styles.actionImageIconbookmark,
                saved && { tintColor: "#A855F7" }
              ]}
            />
          </TouchableOpacity>



        </View>

        {/* Likes */}
        <Text style={styles.likes}>{likeCount} likes</Text>

        {/* Item Details */}
        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.description && (
            <Text style={styles.itemDescription}>{item.description}</Text>
          )}
        </View>

        {/* View Comments */}
        {commentCount > 0 && (
          <TouchableOpacity onPress={openComments} style={styles.viewComments}>
            <Text style={styles.viewCommentsText}>
              View all {commentCount} comments
            </Text>
          </TouchableOpacity>
        )}

        {/* Add Comment Input */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
            onSubmitEditing={handleComment}
            editable={!loading}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            onPress={handleComment}
            disabled={!commentText.trim() || loading}
            style={styles.sendButton}
          >
            <Text style={[
              styles.sendButtonText,
              !commentText.trim() && styles.sendButtonDisabled
            ]}>
              Post
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowComments(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowComments(false)}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Comments</Text>
            <View style={{ width: 40 }} />
          </View>

          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(comment) => comment._id}
            contentContainerStyle={styles.commentsList}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.modalCommentInput}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.modalUserAvatar} />
            ) : (
              <View style={styles.modalUserAvatarPlaceholder}>
                <Text style={styles.modalUserInitial}>
                  {item.user?.username?.[0]?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <TextInput
              style={styles.modalInput}
              placeholder="Add a comment..."
              value={commentText}
              onChangeText={setCommentText}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              onPress={handleComment}
              disabled={!commentText.trim()}
              style={styles.modalSendButton}
            >
              <Ionicons
                name="send"
                size={22}
                color={commentText.trim() ? "#A855F7" : "#CCC"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        transparent
        visible={showCommentActions}
        animationType="fade"
        onRequestClose={() => setShowCommentActions(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setShowCommentActions(false)}
          activeOpacity={1}
        >
          <View style={styles.actionSheet}>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => {
                Alert.alert(
                  "Delete Comment",
                  "Are you sure you want to delete this comment?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: handleDeleteComment },
                  ]
                );
              }}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {menuVisible && (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={[
                styles.menuItem,
                !isOwner && styles.menuItemDisabled
              ]}
              disabled={!isOwner || deleting}
              onPress={isOwner ? handleDeleteItem : undefined}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={isOwner ? "red" : "#aaa"}
              />
              <Text
                style={[
                  styles.menuText,
                  !isOwner && styles.menuTextDisabled
                ]}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}


    </>

  );
}

const styles = StyleSheet.create({

  menuOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 99,
  },
  commentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  actionSheet: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  deleteBtn: {
    paddingVertical: 14,
  },

  deleteText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  menuBox: {
    position: "absolute",
    top: 50,
    right: 12,
    width: 150,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 12,
    paddingVertical: 6,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },

  menuItemDisabled: {
    opacity: 0.4,
  },

  menuText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "500",
    color: "red",
  },

  menuTextDisabled: {
    color: "#999",
  },



  menuTextDelete: {
    marginLeft: 10,
    color: "red",
    fontSize: 15,
    fontWeight: "500",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 5,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E9D5FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  actionImageIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  actionImageIconbookmark: {
    width: 25,
    height: 25,
    resizeMode: "contain",
  },

  avatarImg: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  avatarText: {
    fontWeight: "700",
    color: "#6B21A8",
    fontSize: 16,
  },

  username: {
    fontWeight: "700",
    fontSize: 14,
    color: "#000",
  },

  handle: {
    fontSize: 12,
    color: "#777",
  },

  imageContainer: {
    width: "100%",
    height: 260,                 // fixed height (important)
    backgroundColor: "#F9FAFB",  // light neutral background
    justifyContent: "center",
    alignItems: "center",
    padding: 12,                 // 👈 padding for all images
  },

  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  noImageText: {
    marginTop: 8,
    color: "#666",
    fontSize: 14,
  },

  priceBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  priceText: {
    fontWeight: "700",
    color: "#7C3AED",
    fontSize: 14,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  leftActions: {
    flexDirection: "row",
    gap: 14,
  },

  actionIcon: {
    padding: 0,

  },

  likes: {
    paddingHorizontal: 14,
    paddingTop: 8,
    fontWeight: "700",
    color: "#000",
    fontSize: 14,
  },

  itemDetails: {
    paddingHorizontal: 14,
    paddingTop: 1,
    paddingBottom: 1,
  },

  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },

  itemDescription: {
    fontSize: 14,
    color: "#555",
    lineHeight: 18,
  },

  viewComments: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 4,
  },

  viewCommentsText: {
    fontSize: 14,
    color: "#666",
  },

  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },

  commentInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
    color: "#000",
  },

  sendButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  sendButtonText: {
    color: "#A855F7",
    fontWeight: "600",
    fontSize: 14,
  },

  sendButtonDisabled: {
    color: "#CCC",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFF",
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  backButton: {
    padding: 4,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },

  commentsList: {
    padding: 16,
  },

  commentItem: {
    marginBottom: 16,
  },

  commentUser: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },

  commentAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E9D5FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  commentInitial: {
    fontWeight: "600",
    color: "#6B21A8",
    fontSize: 14,
  },

  commentContent: {
    flex: 1,
  },

  commentUsername: {
    fontWeight: "600",
    fontSize: 14,
    color: "#000",
    marginBottom: 2,
  },

  commentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 18,
    marginBottom: 2,
  },

  commentTime: {
    fontSize: 12,
    color: "#888",
  },

  modalCommentInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },

  modalUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },

  modalUserAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E9D5FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  modalUserInitial: {
    fontWeight: "600",
    color: "#6B21A8",
    fontSize: 16,
  },

  modalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#000",
  },

  modalSendButton: {
    paddingLeft: 12,
    paddingRight: 4,
  },
  followIcon: {
    marginRight: 12,
    padding: 4,
  },
});