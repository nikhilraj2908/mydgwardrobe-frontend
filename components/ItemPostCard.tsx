import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
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
const { width } = Dimensions.get('window');
const BASE_URL = "https://api.digiwardrobe.com";

interface CommentType {
  _id: string;
  text: string;
  user: {
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
  // const [saved, setSaved] = useState(false);
  // const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // Debug log
  const { savedItemIds, toggleSave } = useSavedItems();

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

  /* ======================================================
     CHECK IF ITEM IS SAVED
  ====================================================== */


  /* ======================================================
     TOGGLE SAVE
  ====================================================== */



  useEffect(() => {
    fetchLikeCount();
    fetchComments();

    // AsyncStorage.getItem("userId").then(setCurrentUserId);
  }, []);

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

      setLiked(res.data.liked);
      setLikeCount((prev: number) => (res.data.liked ? prev + 1 : prev - 1));
    } catch (error: any) {
      console.error("Like error:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to like");
    } finally {
      setLoading(false);
    }
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
  const itemOwnerId =
    typeof item.user === "string"
      ? item.user
      : item.user?._id;

  const isOwner =
    Boolean(currentUserId && itemOwnerId) &&
    String(currentUserId) === String(itemOwnerId);

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

  const renderComment = ({ item: comment }: { item: CommentType }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentUser}>
        {comment.user.photo ? (
          <Image
            source={{ uri: `${BASE_URL}${comment.user.photo}` }}
            style={styles.commentAvatar}
          />
        ) : (
          <View style={styles.commentAvatarPlaceholder}>
            <Text style={styles.commentInitial}>
              {comment.user.username?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
        )}
        <View style={styles.commentContent}>
          <Text style={styles.commentUsername}>{comment.user.username}</Text>
          <Text style={styles.commentText}>{comment.text}</Text>
          <Text style={styles.commentTime}>
            {new Date(comment.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const imageUrl = getImageUrl();
  const avatarUrl = getUserAvatarUrl();

  return (
    <>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={styles.avatarText}>
                {item.user?.username?.[0]?.toUpperCase() || "U"}
              </Text>
            )}
          </View>

          <View>
            <Text style={styles.username}>{item.user?.username || "User"}</Text>
            <Text style={styles.handle}>@{item.user?.username?.toLowerCase() || "user"}</Text>
          </View>

          <TouchableOpacity
            style={{ marginLeft: "auto" }}
            onPress={() => setMenuVisible(v => !v)}
          >
            <Ionicons name="ellipsis-vertical" size={18} color="#666" />
          </TouchableOpacity>


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
                  liked && { tintColor: "#FF0000" } // only when liked
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

          <TouchableOpacity onPress={() => toggleSave(item._id)}>
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
    position: 'relative',
  },

  image: {
    width: "100%",
    height: 260,
    backgroundColor: "#f5f5f5",
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
});