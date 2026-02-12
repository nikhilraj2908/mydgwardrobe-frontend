import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ImageEditor() {
  const { uri } = useLocalSearchParams();
  const router = useRouter();

  const [image, setImage] = useState(uri as string);

  const rotateImage = async () => {
    const result = await ImageManipulator.manipulateAsync(
      image,
      [{ rotate: 90 }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );

    setImage(result.uri);
  };

  const flipImage = async () => {
    const result = await ImageManipulator.manipulateAsync(
      image,
      [{ flip: ImageManipulator.FlipType.Horizontal }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
    );

    setImage(result.uri);
  };

  const saveImage = () => {
  router.replace({
    pathname: "/(tabs)/add-wardrobe",
    params: { editedUri: image },
  });
};

  return (
    <View style={styles.container}>
      <Image source={{ uri: image }} style={styles.image} />

      <View style={styles.toolbar}>
        <TouchableOpacity onPress={rotateImage} style={styles.toolBtn}>
          <Ionicons name="refresh" size={24} color="#A855F7" />
          <Text style={styles.toolText}>Rotate</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={flipImage} style={styles.toolBtn}>
          <Ionicons name="swap-horizontal" size={24} color="#A855F7" />
          <Text style={styles.toolText}>Flip</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={saveImage} style={styles.saveBtn}>
          <Text style={styles.saveText}>SAVE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  image: {
    flex: 1,
    resizeMode: "contain",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  toolBtn: {
    alignItems: "center",
  },
  toolText: {
    fontSize: 12,
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: "#A855F7",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  saveText: {
    color: "#fff",
    fontWeight: "700",
  },
});
