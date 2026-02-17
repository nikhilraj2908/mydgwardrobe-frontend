import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { lightTheme, darkTheme, blueTheme } from "./theme";

export default function ThemeSelector() {
  const { setTheme } = useTheme();

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Choose Theme</Text>

      <TouchableOpacity onPress={() => setTheme(lightTheme)}>
        <Text>Light Theme</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setTheme(darkTheme)}>
        <Text>Dark Theme</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setTheme(blueTheme)}>
        <Text>Blue Theme</Text>
      </TouchableOpacity>
    </View>
  );
}
