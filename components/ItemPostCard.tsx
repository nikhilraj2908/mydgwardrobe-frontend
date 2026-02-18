import { resolveImageUrl } from "@/utils/resolveImageUrl";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState, useMemo } from "react";
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
import { useFollow } from "../context/FollowContext";
import { useSavedItems } from "../context/SavedItemsContext";
import { useTheme } from "@/app/theme/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get('window');

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
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes || 0);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedComment, setSelectedComment] = useState<CommentType | null>(null);
  const [showCommentActions, setShowCommentActions] = useState(false);
  const [justFollowed, setJustFollowed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({});

  const { isFollowing, toggleFollow, ready } = useFollow();
  const ownerId = typeof item.user === "string" ? item.user : item.user?._id;

  const followed = ready && ownerId ? isFollowing(String(ownerId)) : false;
  const isOwner = currentUserId && ownerId && String(currentUserId) === String(ownerId);
  const showFollowPlus = ready && !isOwner && ownerId && !followed && !justFollowed;
  const showTick = ready && !isOwner && ownerId && justFollowed;

  const { savedItemIds, toggleSave, isReady } = useSavedItems();
  const saved = savedItemIds.includes(item._id);

  const images: string[] = Array.isArray(item.images)
    ? item.images.filter(Boolean)
    : item.images
      ? [item.images]
      : Array.isArray(item.imageUrl)
        ? item.imageUrl.filter(Boolean)
        : item.imageUrl
          ? [item.imageUrl]
          : item.image
            ? [item.image]
            : [];

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

  const handleSave = () => {
    if (!isReady) {
      Alert.alert("Please wait", "Loading your profile…");
      return;
    }
    toggleSave(item._id);
  };

  useEffect(() => {
    fetchLikeStatus();
    fetchLikeCount();
    fetchComments();
  }, [item._id]);

  const fetchLikeStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await api.get(`/api/like/item/${item._id}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLiked(Boolean(res.data.liked));
    } catch (err) {
      console.log("Like status fetch failed", err);
    }
  };

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
        { postType: "item", postId: item._id },
        { headers: { Authorization: `Bearer ${token}` } }
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
    const ownerId =
      typeof item.user === "string" ? item.user : item.user?._id;
    if (!ownerId) return;
    if (currentUserId && String(currentUserId) === String(ownerId)) {
      router.push("/profile");
    } else {
      router.push(`/profile/${ownerId}`);
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
        { headers: { Authorization: `Bearer ${token}` } }
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

  const openComments = () => setShowComments(true);

  const getUserAvatarUrl = () => {
    const photoPath = item.user?.photo;
    if (!photoPath) return null;
    return resolveImageUrl(photoPath);
  };

  const formatCommentTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    setJustFollowed(false);
  }, [ownerId]);

  const avatarUrl = getUserAvatarUrl();

  const handleFollowPress = async () => {
    if (!ready || !ownerId) return;
    await toggleFollow(String(ownerId));
    setJustFollowed(true);
    setTimeout(() => setJustFollowed(false), 1200);
  };

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
                source={{ uri: resolveImageUrl(userObj.photo) }}
                style={styles.commentAvatar}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.commentAvatarPlaceholder, { backgroundColor: colors.card }]}
              onPress={handleUserPress}
            >
              <Text style={[styles.commentInitial, { color: colors.primary }]}>
                {userObj?.username?.charAt(0).toUpperCase() || "U"}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.commentContent}>
            <View style={styles.commentHeaderRow}>
              <TouchableOpacity onPress={handleUserPress}>
                <Text style={[styles.commentUsername, { color: colors.textPrimary }]}>
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
                  <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.commentText, { color: colors.textSecondary }]}>
              {comment.text}
            </Text>

            <Text style={[styles.commentTime, { color: colors.textMuted }]}>
              {formatCommentTime(comment.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
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
            <View style={[styles.avatar, { backgroundColor: colors.card }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {item.user?.username?.[0]?.toUpperCase() || "U"}
                </Text>
              )}
            </View>

            <View>
              <Text style={[styles.username, { color: colors.textPrimary }]}>
                {item.user?.username}
              </Text>
              <Text style={[styles.handle, { color: colors.textMuted }]}>
                @{item.user?.username?.toLowerCase()}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", marginLeft: "auto" }}>
            {showFollowPlus && (
              <TouchableOpacity onPress={handleFollowPress} style={styles.followIcon}>
                <Ionicons name="person-add-outline" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            )}

            {showTick && (
              <View style={styles.followIcon}>
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
              </View>
            )}

            <TouchableOpacity onPress={() => setMenuVisible(v => !v)}>
              <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image */}
        <View
          style={styles.imageContainer}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
          {images.length > 0 ? (
            <>
              <FlatList
                data={images}
                horizontal
                pagingEnabled
                snapToInterval={containerWidth}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                keyExtractor={(uri, index) => `${uri}-${index}`}
                initialNumToRender={1}
                maxToRenderPerBatch={1}
                windowSize={2}
                onMomentumScrollEnd={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
                  setActiveIndex(index);
                }}
                renderItem={({ item: uri }) => {
                  const finalUrl = resolveImageUrl(uri);
                  return (
                    <View
                      style={{
                        width: containerWidth,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={{ uri: finalUrl }}
                        style={[
                          styles.image,
                          {
                            height: imageRatios[finalUrl]
                              ? containerWidth * imageRatios[finalUrl]
                              : containerWidth * 0.75,
                          },
                        ]}
                        onLoad={(e) => {
                          const source = e?.nativeEvent?.source;
                          if (!source?.width || !source?.height) return;
                          setImageRatios((prev) => ({
                            ...prev,
                            [finalUrl]: source.height / source.width,
                          }));
                        }}
                      />
                    </View>
                  );
                }}
              />

              {images.length > 1 && (
                <View style={styles.dotsContainer}>
                  {images.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, i === activeIndex && styles.activeDot]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={[styles.image, styles.noImage, { backgroundColor: colors.surface }]}>
              <Ionicons name="image-outline" size={50} color={colors.textMuted} />
              <Text style={[styles.noImageText, { color: colors.textMuted }]}>No Image</Text>
            </View>
          )}

          {typeof item.price === "number" && (
            <View style={[styles.priceBadge, { backgroundColor: colors.card }]}>
              <Text style={[styles.priceText, { color: colors.primary }]}>
                ₹{item.price / 1000}K
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <View style={styles.leftActions}>
            <TouchableOpacity onPress={handleLike} disabled={loading} style={styles.actionIcon}>
              <Image
                source={require("../assets/icons/like.png")}
                style={[styles.actionImageIcon, liked && { tintColor: colors.primary }]}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={openComments} style={styles.actionIcon}>
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
              style={[styles.actionImageIconbookmark, saved && { tintColor: colors.primary }]}
            />
          </TouchableOpacity>
        </View>

        {/* Likes */}
        <Text style={[styles.likes, { color: colors.textPrimary }]}>{likeCount} likes</Text>

        {/* Item Details */}
        <View style={styles.itemDetails}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.name}</Text>
          {item.description && (
            <Text style={[styles.itemDescription, { color: colors.textSecondary }]}>
              {item.description}
            </Text>
          )}
        </View>

        {/* View Comments */}
        {commentCount > 0 && (
          <TouchableOpacity onPress={openComments} style={styles.viewComments}>
            <Text style={[styles.viewCommentsText, { color: colors.textSecondary }]}>
              View all {commentCount} comments
            </Text>
          </TouchableOpacity>
        )}

        {/* Add Comment Input */}
        <View style={[styles.commentInputContainer, { borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.commentInput, { color: colors.textPrimary }]}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textMuted}
            value={commentText}
            onChangeText={setCommentText}
            onSubmitEditing={handleComment}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={handleComment}
            disabled={!commentText.trim() || loading}
            style={styles.sendButton}
          >
            <Text
              style={[
                styles.sendButtonText,
                !commentText.trim() && styles.sendButtonDisabled,
                { color: commentText.trim() ? colors.primary : colors.textMuted },
              ]}
            >
              Post
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowComments(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Comments</Text>
            <View style={{ width: 40 }} />
          </View>

          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(comment) => comment._id}
            contentContainerStyle={[styles.commentsList, { paddingBottom: insets.bottom + 16 }]}
            showsVerticalScrollIndicator={false}
          />

          <View
            style={[
              styles.modalCommentInput,
              { borderTopColor: colors.border, paddingBottom: insets.bottom + 12 },
            ]}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.modalUserAvatar} />
            ) : (
              <View style={[styles.modalUserAvatarPlaceholder, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalUserInitial, { color: colors.primary }]}>
                  {item.user?.username?.[0]?.toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <TextInput
              style={[
                styles.modalInput,
                { color: colors.textPrimary, borderColor: colors.border },
              ]}
              placeholder="Add a comment..."
              placeholderTextColor={colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity
              onPress={handleComment}
              disabled={!commentText.trim()}
              style={styles.modalSendButton}
            >
              <Ionicons
                name="send"
                size={22}
                color={commentText.trim() ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Comment Actions Modal */}
      <Modal
        transparent
        visible={showCommentActions}
        animationType="fade"
        onRequestClose={() => setShowCommentActions(false)}
      >
        <TouchableOpacity
          style={[styles.overlay, { backgroundColor: colors.overlay }]}
          onPress={() => setShowCommentActions(false)}
          activeOpacity={1}
        >
          <View
            style={[
              styles.actionSheet,
              { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16 },
            ]}
          >
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
              <Text style={[styles.deleteText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Menu Modal */}
      {menuVisible && (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuBox, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.menuItem, !isOwner && styles.menuItemDisabled]}
              disabled={!isOwner || deleting}
              onPress={isOwner ? handleDeleteItem : undefined}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={isOwner ? colors.danger : colors.textMuted}
              />
              <Text
                style={[
                  styles.menuText,
                  !isOwner && styles.menuTextDisabled,
                  { color: isOwner ? colors.danger : colors.textMuted },
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

const createStyles = (colors: any) =>
  StyleSheet.create({
    dotsContainer: {
      position: "absolute",
      bottom: 10,
      flexDirection: "row",
      alignSelf: "center",
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      marginHorizontal: 4,
    },
    activeDot: {
      backgroundColor: colors.primary,
    },
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
      justifyContent: "flex-end",
    },
    actionSheet: {
      padding: 16,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    deleteBtn: {
      paddingVertical: 14,
    },
    deleteText: {
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
    menuBox: {
      position: "absolute",
      top: 50,
      right: 12,
      width: 150,
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
    },
    menuTextDisabled: {
      color: colors.textMuted,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginTop: 12,
      marginBottom: 5,
      overflow: "hidden",
      elevation: 5,
      shadowColor: colors.primary,
      shadowOpacity: 0.12,
      shadowRadius: 5,
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
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },
    actionImageIcon: {
      width: 30,
      height: 30,
      resizeMode: "contain",
      tintColor: colors.textMuted,
    },
    actionImageIconbookmark: {
      width: 25,
      height: 25,
      resizeMode: "contain",
      tintColor: colors.textMuted,
    },
    avatarImg: {
      width: 42,
      height: 42,
      borderRadius: 21,
    },
    avatarText: {
      fontWeight: "700",
      fontSize: 16,
    },
    username: {
      fontWeight: "700",
      fontSize: 14,
    },
    handle: {
      fontSize: 12,
    },
    imageContainer: {
      width: "100%",
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
    },
    image: {
      width: "100%",
      resizeMode: "contain",
    },
    noImage: {
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    noImageText: {
      marginTop: 8,
      fontSize: 14,
    },
    priceBadge: {
      position: "absolute",
      bottom: 12,
      right: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    priceText: {
      fontWeight: "700",
      fontSize: 14,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
      marginBottom: 4,
    },
    itemDescription: {
      fontSize: 14,
      lineHeight: 18,
    },
    viewComments: {
      paddingHorizontal: 14,
      paddingVertical: 4,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 4,
    },
    viewCommentsText: {
      fontSize: 14,
    },
    commentInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderTopWidth: 1,
    },
    commentInput: {
      flex: 1,
      fontSize: 14,
      paddingVertical: 6,
    },
    sendButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    sendButtonText: {
      fontWeight: "600",
      fontSize: 14,
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    modalContainer: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      borderBottomWidth: 1,
    },
    backButton: {
      padding: 4,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
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
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
    },
    commentInitial: {
      fontWeight: "600",
      fontSize: 14,
    },
    commentContent: {
      flex: 1,
    },
    commentUsername: {
      fontWeight: "600",
      fontSize: 14,
      marginBottom: 2,
    },
    commentText: {
      fontSize: 14,
      lineHeight: 18,
      marginBottom: 2,
    },
    commentTime: {
      fontSize: 12,
    },
    modalCommentInput: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderTopWidth: 1,
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
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    modalUserInitial: {
      fontWeight: "600",
      fontSize: 16,
    },
    modalInput: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
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