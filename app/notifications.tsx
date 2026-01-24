import api from "@/api/api";
import AppBackground from "@/components/AppBackground";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Notification {
    _id: string;
    message: string;
    read: boolean;
    createdAt: string;
    item?: string;
    actor: {
        username: string;
        photo?: string;
    };
}

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    /* ================= LOAD ================= */
    const loadNotifications = async () => {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await api.get("/api/notifications", {
            headers: { Authorization: `Bearer ${token}` },
        });

        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
    };

    /* ================= MARK ALL ================= */
    const markAllRead = async () => {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        await api.post(
            "/api/notifications/read-all",
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );

        loadNotifications();
    };

    /* ================= MARK SINGLE ================= */
    const markSingleRead = async (id: string) => {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        await api.post(
            `/api/notifications/${id}/read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // Optimistic UI update
        setNotifications((prev) =>
            prev.map((n) =>
                n._id === id ? { ...n, read: true } : n
            )
        );
        setUnreadCount((c) => Math.max(0, c - 1));
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const onBack = () => router.back();

    /* ================= TIME FORMAT ================= */
    const formatNotificationTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();

        const isToday = date.toDateString() === now.toDateString();

        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);

        const isYesterday =
            date.toDateString() === yesterday.toDateString();

        const time = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });

        if (isToday) return time;
        if (isYesterday) return `Yesterday · ${time}`;

        const formattedDate = date.toLocaleDateString([], {
            day: "2-digit",
            month: "short",
        });

        return `${formattedDate} · ${time}`;
    };

    return (
        <AppBackground>
            <View style={styles.container}>
                {/* ================= HEADER ================= */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={22} color="#000" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Notifications</Text>
                    </View>

                    <TouchableOpacity onPress={markAllRead}>
                        <Text style={styles.mark}>Mark all read</Text>
                    </TouchableOpacity>
                </View>

                {/* ================= LIST ================= */}
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={async () => {
                                // ✅ mark ONLY this notification
                                if (!item.read) {
                                    await markSingleRead(item._id);
                                }
                                if (item.type === "follow") {
                                    router.push(`/profile/${item.actor._id}`);
                                    return;
                                }

                                // 👉 navigate to item
                                if (item.item) {
                                    if (item.type === "comment") {
                                        router.push({
                                            pathname: `/wardrobe/item/${item.item}`,
                                            params: { openComments: "true" },
                                        });
                                    } else {
                                        router.push(`/wardrobe/item/${item.item}`);
                                    }
                                }
                            }}
                        >
                            <View style={styles.card}>
                                <Image
                                    source={
                                        item.actor.photo
                                            ? {
                                                uri: `https://api.digiwardrobe.com${item.actor.photo}`,
                                            }
                                            : require("../assets/icons/person-round.png")
                                    }
                                    style={styles.avatar}
                                />

                                <View style={{ flex: 1 }}>
                                    <Text style={styles.message}>
                                        <Text style={styles.name}>
                                            {item.actor.username}
                                        </Text>{" "}
                                        {item.message}
                                    </Text>

                                    <Text style={styles.time}>
                                        {formatNotificationTime(item.createdAt)}
                                    </Text>
                                </View>

                                {!item.read && <View style={styles.unreadDot} />}
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </AppBackground>
    );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff96",
        padding: 16,
        marginTop: 30,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },

    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
    },

    backBtn: {
        marginRight: 6,
        padding: 4,
    },

    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#000",
    },

    mark: {
        color: "#A855F7",
        fontWeight: "600",
        fontSize: 14,
    },

    card: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderColor: "#eee",
    },

    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },

    name: { fontWeight: "700" },
    message: { fontSize: 14 },
    time: { fontSize: 12, color: "#999", marginTop: 4 },

    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#A855F7",
    },
});
