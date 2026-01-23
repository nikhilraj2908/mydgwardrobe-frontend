import React from "react";
import {
  ScrollView,
  View,
  Image,
  Text,
  TouchableOpacity,
} from "react-native";
import Row from "../components/Row";
import Card from "../components/Card";

// 🔥 TEMP DEMO DATA (replace later)
const CATEGORIES = Array.from({ length: 30 }).map((_, i) => ({
  key: `Category-${i}|womens`,
  label: `Category ${i + 1}`,
  image: require("../../assets/images/icon.png"),
}));


export default function CuratedExploreLayout({ onSelectCategory }) {
  let index = 0;
  let patternIndex = 0;
  const rows = [];

  while (index < CATEGORIES.length) {
    const pattern = LAYOUT_PATTERN[patternIndex % LAYOUT_PATTERN.length];
    const rowItems = CATEGORIES.slice(index, index + pattern.columns);

    rows.push(
      <Row key={`row-${index}`}>
        {rowItems.map((item, i) => (
          <Card
            key={item.key}
            data={item}
            size={pattern.sizes[i]}
            onPress={onSelectCategory}
          />
        ))}
      </Row>
    );

    index += pattern.columns;
    patternIndex++;
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16 }}
    >
      {rows}
    </ScrollView>
  );
}
