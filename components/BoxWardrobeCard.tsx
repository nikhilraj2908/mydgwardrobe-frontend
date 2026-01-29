import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  title: string;
  subtitle: string;
  image?: string | null;
  badge?: string;
  locked?: boolean;
  onPress: () => void;
}

export default function BoxWardrobeCard({
  title,
  subtitle,
  image,
  badge,
  locked = false,
  onPress,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, locked && styles.lockedCard]}
      onPress={onPress}
      activeOpacity={locked ? 0.9 : 0.7}
    >
      {image ? (
        <Image source={{ uri: image }} style={styles.image} />
      ) : (
        <View style={styles.placeholder} />
      )}

      {/* 🔒 LOCK OVERLAY */}
      {locked && (
        <View style={styles.lockOverlay}>
          <Ionicons name="lock-closed" size={26} color="#fff" />
          <Text style={styles.lockText}>Locked</Text>
        </View>
      )}

      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    marginBottom: 16,
    elevation: 3,
  },
  lockedCard: {
    opacity: 0.9,
  },
  image: {
    width: "100%",
    height: 110,
    borderRadius: 12,
    marginBottom: 8,
  },
  placeholder: {
    width: "100%",
    height: 110,
    borderRadius: 12,
    backgroundColor: "#E9D5FF",
    marginBottom: 8,
  },
  lockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    borderRadius: 12,
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
  title: {
    fontWeight: "700",
    fontSize: 14,
  },
  subtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#A855F7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
});
