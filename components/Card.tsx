import { Image, Text, TouchableOpacity ,View} from "react-native";

const Card = ({ data, onPress, size }) => {
  const height =
    size === "tall"
      ? 260
      : size === "wide"
      ? 200
      : 140;

  const flex = size === "wide" ? 2 : 1;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(data.key)}
      style={{
        flex,
        height,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#eee",
      }}
    >
      <Image
        source={data.image}
        style={{ width: "100%", height: "100%" }}
        resizeMode="cover"
      />

      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          paddingVertical: 8,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontWeight: "600",
            fontSize: 14,
          }}
        >
          {data.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default Card;