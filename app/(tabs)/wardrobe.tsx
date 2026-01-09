import CollectionPostCard from "@/components/CollectionPostCard";
import WardrobeHeader from "@/components/WardrobeHeader";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from "react-native";
import api from "../../api/api";

export default function Wardrobe() {
  const router = useRouter();

  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<
    "worth" | "alpha" | "views"
  >("worth");

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/feed/collections");
      setCollections(res.data || []);
    } catch (err) {
      console.log("Load error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SORTING ================= */

  const sortedCollections = [...collections].sort((a, b) => {
    if (sortBy === "worth") {
      return b.stats.totalWorth - a.stats.totalWorth;
    }

    if (sortBy === "alpha") {
      return a.user.username.localeCompare(b.user.username);
    }

    if (sortBy === "views") {
      return (b.views || 0) - (a.views || 0);
    }

    return 0;
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: 15 }}>
      <WardrobeHeader
        onBack={() => router.back()}
        onSearch={() => console.log("Search")}
        onNotification={() => console.log("Notification")}
        showFilters
        activeSort={sortBy}
        onSort={setSortBy}
      />


      <FlatList
        data={sortedCollections}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <CollectionPostCard item={item} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator
              size="small"
              color="#A855F7"
              style={{ marginVertical: 20 }}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});
