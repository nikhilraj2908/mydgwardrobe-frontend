import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResizeMode, Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import api from "../../api/api";
import { resolveImageUrl } from "@/utils/resolveImageUrl";
const { width } = Dimensions.get("window");

export default function StoryView() {
  const router = useRouter();
  const { index } = useLocalSearchParams();

  /* ================= STATE ================= */
  const [groups, setGroups] = useState<any[]>([]);
  const [userIndex, setUserIndex] = useState(Number(index) || 0);
  const [storyIndex, setStoryIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);

  const videoRef = useRef<Video>(null);

  /* ================= LOAD STORIES ================= */
  useEffect(() => {
    const load = async () => {
      const uid = await AsyncStorage.getItem("userId");
      setCurrentUserId(uid);

      const res = await api.get("/api/story");
      setGroups(res.data);

      setLoading(false);
    };

    load();
  }, []);

  /* ================= SAFE DERIVED DATA ================= */
  const group = groups[userIndex];
  const story = group?.stories?.[storyIndex];

 const mediaUrl = resolveImageUrl(story?.media);

  /* ================= MARK VIEW ================= */
  useEffect(() => {
    if (story?._id) {
      api.post(`/api/story/${story._id}/view`).catch(() => {});
    }
  }, [story?._id]);

  /* ================= AUTO NEXT ================= */
  useEffect(() => {
    if (!story || paused) return;

    const timer = setTimeout(goNext, story.duration * 1000);
    return () => clearTimeout(timer);
  }, [storyIndex, userIndex, paused]);

  /* ================= NAV ================= */
  const goNext = () => {
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (userIndex < groups.length - 1) {
      setUserIndex((u) => u + 1);
      setStoryIndex(0);
    } else {
      router.back();
    }
  };

  const goPrev = () => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (userIndex > 0) {
      const prev = groups[userIndex - 1];
      setUserIndex((u) => u - 1);
      setStoryIndex(prev.stories.length - 1);
    }
  };

  /* ================= DELETE ================= */
  const isOwner = currentUserId === group?.user?._id;

  const deleteStory = async () => {
    await api.delete(`/api/story/${story._id}`);

    const updated = [...groups];
    updated[userIndex].stories.splice(storyIndex, 1);

    if (updated[userIndex].stories.length === 0) {
      updated.splice(userIndex, 1);
    }

    setGroups(updated);
    setStoryIndex(0);

    if (!updated.length) router.back();
  };

  /* ================= SWIPE DOWN ================= */
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 20,
    onPanResponderRelease: (_, g) => {
      if (g.dy > 80) router.back();
    },
  });

  /* ================= LOADING ================= */
  if (loading || !group || !story) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  /* ================= UI ================= */
  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Progress */}
      <View style={styles.progressRow}>
        {group.stories.map((_: any, i: number) => (
          <View
            key={i}
            style={[
              styles.progress,
              i <= storyIndex && styles.progressActive,
            ]}
          />
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.username}>{group.user.username}</Text>
        {isOwner && (
          <Pressable onPress={deleteStory}>
            <Text style={styles.delete}>Delete</Text>
          </Pressable>
        )}
      </View>

      {/* Touch Navigation */}
      <Pressable
        style={styles.touch}
        onPress={(e) =>
          e.nativeEvent.locationX < width / 2 ? goPrev() : goNext()
        }
        onLongPress={() => setPaused(true)}
        onPressOut={() => setPaused(false)}
      >
        {story.mediaType === "image" ? (
          <Image source={{ uri: mediaUrl }} style={styles.media} />
        ) : (
          <Video
            ref={videoRef}
            source={{ uri: mediaUrl }}
            style={styles.media}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={!paused}
          />
        )}
      </Pressable>

      {/* Views */}
      <Text style={styles.views}>
        👁 {story.viewers?.length || 0} views
      </Text>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  progressRow: { flexDirection: "row", padding: 6 },
  progress: {
    flex: 1,
    height: 3,
    backgroundColor: "#444",
    marginHorizontal: 2,
    borderRadius: 2,
  },
  progressActive: { backgroundColor: "#fff" },
  header: {
    position: "absolute",
    top: 40,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  username: { color: "#fff", fontWeight: "600", fontSize: 16 },
  delete: { color: "red", fontWeight: "600" },
  touch: { flex: 1 },
  media: { width: "100%", height: "100%" },
  views: {
    position: "absolute",
    bottom: 40,
    left: 16,
    color: "#fff",
  },
});
