import { View } from "react-native";

const Row = ({ children }) => (
  <View
    style={{
      flexDirection: "row",
      gap: 10,
      marginBottom: 12,
    }}
  >
    {children}
  </View>
);

export default Row;