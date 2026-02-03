import WardrobeHeader from "@/components/WardrobeHeader";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";

import AppBackground from "@/components/AppBackground";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../../api/api";
import { useFollow } from "../../../context/FollowContext";
import { useSavedItems } from "../../../context/SavedItemsContext";
const SCREEN_WIDTH = Dimensions.get("window").width;

export default function ItemDetails() {
    const { id, openComments } = useLocalSearchParams<{
        id: string;
        openComments?: string;
    }>();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [likes, setLikes] = useState(0);
    const [liked, setLiked] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState<any[]>([]);
    const [commentCount, setCommentCount] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedComment, setSelectedComment] = useState<any>(null);
    const [showCommentActions, setShowCommentActions] = useState(false);
    const { isFollowing, toggleFollow, ready } = useFollow();
    const [activeIndex, setActiveIndex] = useState(0);

    // const [isFollowing, setIsFollowing] = useState(false);
    // const [followLoading, setFollowLoading] = useState(false);
    // const [isSelf, setIsSelf] = useState(false);




    const handleFollowToggle = async () => {
        if (!ownerId || isSelf) return;
        await toggleFollow(String(ownerId));
    };


    const fetchCurrentUser = async () => {
        try {
            const res = await api.get("/api/auth/me");
            setCurrentUser(res.data.user);
        } catch (err) {
            console.log("User fetch failed");
        }
    };
    const { toggleSave, savedItemIds } = useSavedItems();

    //   const saved = savedItemIds.includes(item._id);
    const fetchComments = async () => {
        try {
            const res = await api.get(`/api/comment/${id}`);
            setComments(res.data.comments || []);
            setCommentCount(res.data.comments?.length || 0);
        } catch (err) {
            console.log("Fetch comments failed", err);
        }
    };

    useEffect(() => {
        if (openComments === "true") {
            setShowComments(true);
        }

    }, [openComments]);


    useEffect(() => {
        fetchItemDetails();
    }, [id]);

    useEffect(() => {
        fetchCurrentUser();
    }, []);
    const canDeleteComment = (comment: any) => {
        if (!currentUser || !item) return false;

        const currentUserId = String(currentUser._id || currentUser.id);

        const commentUserId =
            typeof comment.user === "string"
                ? comment.user
                : String(comment.user?._id);

        const itemOwnerId =
            typeof item.user === "string"
                ? item.user
                : String(item.user?._id);

        return (
            commentUserId === currentUserId || // comment owner
            itemOwnerId === currentUserId      // item owner
        );

    };
    const handleDeleteComment = async () => {
        if (!selectedComment) return;

        try {
            await api.delete(`/api/comment/${selectedComment._id}`);

            setComments(prev =>
                prev.filter(c => c._id !== selectedComment._id)
            );

            setCommentCount(prev => prev - 1);
            setShowCommentActions(false);
            setSelectedComment(null);
        } catch (err) {
            Alert.alert("Error", "Unable to delete comment");
        }
    };


    const handleComment = async () => {
        if (!commentText.trim()) return;

        try {
            setActionLoading(true);
            const res = await api.post(`/api/comment/${id}`, {
                text: commentText,
            });

            setComments(prev => [res.data.comment, ...prev]);
            setCommentCount(prev => prev + 1);
            setCommentText("");
        } catch (err) {
            console.log("Comment error", err);
        } finally {
            setActionLoading(false);
        }
    };

    const fetchLikeStatus = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            const res = await api.get(
                `/api/like/item/${id}/me`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setLiked(Boolean(res.data.liked));
        } catch (err) {
            console.log("Like status fetch failed", err);
        }
    };




    const fetchItemDetails = async () => {
        await fetchComments();
        try {
            const res = await api.get(`/api/wardrobe/item/${id}`);
            setItem(res.data);

            const likeRes = await api.get(`/api/like/item/${id}/count`);
            setLikes(likeRes.data.count || 0);

            await fetchLikeStatus(); // ✅ ADD THIS
        } catch (err) {
            console.log("Item fetch failed", err);
        } finally {
            setLoading(false);
        }
    };
    const handleLike = async () => {
        try {
            setActionLoading(true);
            const res = await api.post("/api/like/toggle", {
                postType: "item",
                postId: id,
            });

            setLiked(res.data.liked);
            setLikes(prev => (res.data.liked ? prev + 1 : prev - 1));
        } catch (err) {
            console.log("Like error", err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleOwnerPress = async () => {
        if (!item?.user?._id) return;

        try {
            const token = await AsyncStorage.getItem("token");

            if (token) {
                const meRes = await api.get("/api/user/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (meRes.data?._id === item.user._id) {
                    router.push("/profile");
                    return;
                }
            }

            router.push(`/profile/${item.user._id}`);
        } catch {
            router.push(`/profile/${item.user._id}`);
        }
    };



    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#A855F7" />
            </View>
        );
    }

    if (!item) {
        return (
            <View style={styles.center}>
                <Text>Item not found</Text>
            </View>
        );
    }
    const ownerId =
        typeof item.user === "string"
            ? item.user
            : item.user?._id;

    const isSelf =
        currentUser?._id &&
        ownerId &&
        String(currentUser._id) === String(ownerId);

    const followed =
        ready && ownerId ? isFollowing(String(ownerId)) : false;
    // ✅ SAFE — item exists here
    const saved = savedItemIds.includes(item._id);

    const formatCommentTime = (dateString: string) => {
        const date = new Date(dateString);

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };






    const images: string[] =
        Array.isArray(item.images) && item.images.length > 0
            ? item.images
                .map((img: string) => resolveImageUrl(img))
                .filter(Boolean) as string[]
            : [];
    return (

        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
            <AppBackground>
                <View style={styles.container}>
                    <WardrobeHeader title="Item Details" onBack={() => router.back()} />

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* IMAGE */}
                        {/* OWNER */}
                        <View style={styles.itemHeaderContainer}>
                            <View style={styles.ownerTopRow}>
                                <TouchableOpacity
                                    style={styles.ownerLeft}
                                    onPress={handleOwnerPress}
                                >
                                    {item.user?.photo ? (
                                        <Image
                                            source={{
                                                uri: resolveImageUrl(item.user.photo) ??
                                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                        item.user?.username || "User"
                                                    )}&background=E9D5FF&color=6B21A8&size=128`
                                            }}
                                            style={styles.ownerAvatar}
                                        />

                                    ) : (
                                        <View style={styles.ownerAvatarFallback}>
                                            <Text style={styles.ownerInitial}>
                                                {item.user?.username?.[0]?.toUpperCase() || "U"}
                                            </Text>
                                        </View>
                                    )}

                                    <View>
                                        <Text style={styles.ownerUsername}>@{item.user?.username}</Text>
                                        <Text style={styles.ownerSub}>Item Owner</Text>
                                    </View>
                                </TouchableOpacity>

                                {/* FOLLOW BUTTON */}
                                {ready && (
                                    <TouchableOpacity
                                        style={[
                                            styles.followBtn,
                                            followed && styles.followingBtn,
                                            isSelf && styles.disabledBtn,
                                        ]}
                                        onPress={handleFollowToggle}
                                        disabled={isSelf}
                                    >
                                        <Ionicons
                                            name={isSelf ? "person" : followed ? "checkmark" : "person-add-outline"}
                                            size={16}
                                            color="#fff"
                                        />
                                        <Text style={styles.followText}>
                                            {isSelf ? "You" : followed ? "Following" : "Follow"}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        <View style={styles.imageCard}>
                            {images.length > 0 ? (
                                <ScrollView
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                >
                                    {images.map((img, index) => (
                                        <Image
                                            key={index}
                                            source={{ uri: img }}
                                            style={styles.image}
                                        />
                                    ))}
                                </ScrollView>
                            ) : (
                                <View style={[styles.image, styles.noImage]}>
                                    <Ionicons name="image-outline" size={60} color="#ccc" />
                                    <Text style={{ color: "#999", marginTop: 8 }}>No images</Text>
                                </View>
                            )}
                        </View>




                        {/* ACTIONS */}
                        <View style={styles.actionRow}>
                            {/* LIKE */}
                            <View style={styles.leftActions}>
                                <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
                                    <Image
                                        source={require("../../../assets/icons/like.png")}
                                        style={[
                                            styles.actionImageIcon,
                                            liked && { tintColor: "#A855F7" },
                                        ]}
                                    />
                                    <Text>{likes}</Text>
                                </TouchableOpacity>

                                {/* COMMENT */}
                                <TouchableOpacity
                                    onPress={() => setShowComments(true)}
                                    style={styles.actionBtn}
                                >
                                    <Image
                                        source={require("../../../assets/icons/comment.png")}
                                        style={styles.actionImageIcon}
                                    />
                                    <Text>{commentCount}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* SAVE */}
                            <TouchableOpacity onPress={() => toggleSave(item._id)}>
                                <Image
                                    source={
                                        saved
                                            ? require("../../../assets/icons/bookmark-saved.png")
                                            : require("../../../assets/icons/bookmark.png")
                                    }
                                    style={[
                                        styles.actionImageIconbookmark,
                                        saved && { tintColor: "#A855F7" },
                                    ]}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* DETAILS */}
                        <View style={styles.details}>
                            <Text style={styles.brand}>{item.brand}</Text>
                            <Text style={styles.title}>{item.title || item.wardrobe?.name}</Text>
                            <Text style={styles.price}>₹{item.price}</Text>

                            <Text style={styles.descTitle}>Description</Text>
                            <Text style={styles.desc}>{item.description}</Text>

                            <View style={styles.metaRow}>
                                <Text style={styles.meta}>Wardrobe: {item.wardrobe?.name}</Text>
                                <Text style={styles.meta}>
                                    Added: {new Date(item.createdAt).toDateString()}
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                    <Modal
                        visible={showComments}
                        animationType="slide"
                        onRequestClose={() => setShowComments(false)}
                    >
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => setShowComments(false)}>
                                    <Ionicons name="arrow-back" size={24} />
                                </TouchableOpacity>
                                <Text style={styles.modalTitle}>Comments</Text>
                                <View style={{ width: 24 }} />
                            </View>

                            <ScrollView contentContainerStyle={styles.commentsList}>
                                {comments.map((comment) => (

                                    <View key={comment._id} style={styles.commentItem}>
                                        <View style={styles.commentUser}>
                                            {/* Avatar */}
                                            {comment.user?.photo ? (
                                                <Image
                                                    source={{
                                                        uri: resolveImageUrl(comment.user.photo) ??
                                                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                                                comment.user?.username || "User"
                                                            )}&background=E9D5FF&color=6B21A8&size=128`
                                                    }}
                                                    style={styles.commentAvatar}
                                                />

                                            ) : (
                                                <View style={styles.commentAvatarPlaceholder}>
                                                    <Text style={styles.commentInitial}>
                                                        {comment.user?.username?.charAt(0).toUpperCase() || "U"}
                                                    </Text>
                                                </View>

                                            )}

                                            {/* Content */}
                                            <View style={styles.commentContent}>
                                                <View style={styles.commentHeaderRow}>
                                                    <Text style={styles.commentUsername}>
                                                        {comment.user?.username || "User"}
                                                    </Text>

                                                    {canDeleteComment(comment) && (
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                setSelectedComment(comment);
                                                                setShowCommentActions(true);
                                                            }}
                                                        >
                                                            <Ionicons name="ellipsis-vertical" size={16} />
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
                                ))}


                            </ScrollView>

                            <View style={styles.modalCommentInput}>
                                <TextInput
                                    placeholder="Add a comment..."
                                    value={commentText}
                                    onChangeText={setCommentText}
                                    style={styles.modalInput}
                                />
                                <TouchableOpacity onPress={handleComment}>
                                    <Ionicons name="send" size={22} color="#A855F7" />
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

                </View>
            </AppBackground >
        </SafeAreaView>
    );
} const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    itemHeaderContainer: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 6,
    },
    followingBtn: {
        backgroundColor: "#7C3AED",
    },

    disabledBtn: {
        opacity: 0.6,
    },



    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 16,
    },

    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
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
    details: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },

    brand: {
        fontSize: 14,
        color: "#888",
        fontWeight: "600",
    },

    title: {
        fontSize: 22,
        fontWeight: "700",
        marginVertical: 6,
    },

    price: {
        fontSize: 20,
        fontWeight: "700",
        color: "#9b5cff",
        marginBottom: 16,
    },

    descTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 6,
    },

    desc: {
        fontSize: 15,
        color: "#555",
        lineHeight: 22,
    },

    metaRow: {
        marginTop: 16,
    },

    meta: {
        fontSize: 13,
        color: "#777",
    },

    leftActions: {
        flexDirection: "row",
        gap: 14,
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

    /* OWNER ROW */
    ownerTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },

    ownerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    ownerAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
    },

    ownerAvatarFallback: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#A855F7",
        justifyContent: "center",
        alignItems: "center",
    },

    ownerInitial: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },

    ownerUsername: {
        fontWeight: "700",
        fontSize: 14,
        color: "#000",
    },

    ownerSub: {
        fontSize: 12,
        color: "#777",
    },

    /* FOLLOW */
    followBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#A855F7",
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },

    followText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 13,
    },
    imageSlider: {
        marginTop: 20,
    },

    noImage: {
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
    },

    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 10,
    },

    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#ddd",
        marginHorizontal: 4,
    },

    activeDot: {
        backgroundColor: "#A855F7",
    },
imageCard: {
  backgroundColor: "#fff",
  marginHorizontal: 12,
  overflow: "hidden",

  // subtle depth
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
},

image: {
  width: SCREEN_WIDTH - 24, // align with margins
  height: 420,
  resizeMode: "contain",
  backgroundColor: "#fff", // IMPORTANT
},

});

