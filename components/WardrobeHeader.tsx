import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  onBack: () => void;
  onSearch?: () => void;
  onNotification?: () => void;

  // 👇 FILTER PROPS
  showFilters?: boolean;
  activeSort?: "worth" | "alpha" | "views";
  onSort?: (type: "worth" | "alpha" | "views") => void;
}

export default function WardrobeHeader({
  onBack,
  onSearch,
  onNotification,
  showFilters = false,
  activeSort,
  onSort,
}: Props) {
  return (
    <View style={styles.wrapper}>
      {/* HEADER ROW (Home-style) */}
      <View style={styles.header}>
        <View style={styles.left}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} />
          </TouchableOpacity>

          <Text style={styles.logoText}>
            <Text style={styles.logoHighlight}>D</Text><Text style={styles.logoHighlight1}>W</Text>
          </Text>
        </View>

        
      </View>

      {/* 👇 FILTER ROW */}
      {showFilters && onSort && (
        <View style={styles.filtersRow}>
          <FilterBtn
            label="Worth"
            icon="cash-outline"
            active={activeSort === "worth"}
            onPress={() => onSort("worth")}
          />

          <FilterBtn
            label="A–Z"
            icon="text-outline"
            active={activeSort === "alpha"}
            onPress={() => onSort("alpha")}
          />

          <FilterBtn
            label="Views"
            icon="eye-outline"
            active={activeSort === "views"}
            onPress={() => onSort("views")}
          />
        </View>
      )}
    </View>
  );
}

/* ===== Filter Button ===== */

function FilterBtn({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: any;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.filterBtn, active && styles.filterActive]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={active ? "#7C3AED" : "#666"}
      />
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ===== Styles ===== */

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 25,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
  },

  backBtn: {
    marginRight: 10,
  },

  logoText: {
    fontSize: 22,
  },

  logoHighlight: {
    color: "#A855F7",
    fontFamily: "Cookie",
    fontSize: 35,
  },
  logoHighlight1:{
fontFamily: "Cookie",
    fontSize: 35,

  },

  headerIcons: {
    flexDirection: "row",
  },

  filtersRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 10,
  },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },

  filterActive: {
    backgroundColor: "#F3E8FF",
  },

  filterText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },

  filterTextActive: {
    color: "#7C3AED",
    fontWeight: "600",
  },
});
