import { Ionicons } from "@expo/vector-icons";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const stories = [
    { name: "Add Story", add: true },
    { name: "Sarah", initials: "S" },
    { name: "Alex", initials: "A" },
    { name: "Emma", initials: "E" },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>
          YOUR <Text style={{ color: "#A855F7" }}>DG</Text> CLOSET
        </Text>

        <View style={styles.headerIcons}>
          <Ionicons name="search-outline" size={26} />
          <Ionicons name="notifications-outline" size={26} style={{ marginLeft: 15 }} />
        </View>
      </View>

      {/* Stories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 15 }}>
        {stories.map((s, i) => (
          <View key={i} style={styles.storyItem}>
            <View style={[styles.storyCircle, s.add && styles.addCircle]}>
              {s.add ? (
                <Ionicons name="add" size={28} color="#A855F7" />
              ) : (
                <Text style={styles.storyInitial}>{s.initials}</Text>
              )}
            </View>
            <Text style={styles.storyName}>{s.name}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Feed */}
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.userIcon}>
            <Text style={styles.userInitial}>SM</Text>
          </View>
          <View>
            <Text style={styles.username}>Sarah Mitchell</Text>
            <Text style={styles.userHandle}>@sarahm</Text>
          </View>
          <Ionicons
            name="ellipsis-vertical"
            size={20}
            style={{ marginLeft: "auto" }}
          />
        </View>

        <Image
          source={require("../../assets/images/sample-outfit1.jpg")}
          style={styles.postImage}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15, backgroundColor: "#fff" },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  logoText: { fontSize: 22, fontWeight: "700" },

  headerIcons: { flexDirection: "row" },

  storyItem: { alignItems: "center", marginRight: 18 },

  storyCircle: {
    width: 70,
    height: 70,
    borderRadius: 50,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },

  addCircle: {
    borderWidth: 2,
    borderColor: "#A855F7",
    backgroundColor: "#fff",
  },

  storyInitial: { fontSize: 24, fontWeight: "700" },

  storyName: { marginTop: 4, fontSize: 12, color: "#444" },

  postCard: {
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
  },

  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E9D5FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  userInitial: { fontWeight: "700" },

  username: { fontWeight: "700" },

  userHandle: { color: "#777", fontSize: 12 },

  postImage: {
    width: "100%",
    height: 260,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
});
