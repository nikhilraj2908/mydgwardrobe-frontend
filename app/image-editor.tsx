// import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";
// import { useLocalSearchParams, router } from "expo-router";
// import * as ImageManipulator from "expo-image-manipulator";
// import { useState } from "react";

// export default function ImageEditorScreen() {
//   const { uri } = useLocalSearchParams<{ uri: string }>();
//   const [workingUri, setWorkingUri] = useState(uri);

//   if (!workingUri) return null;

//   /* ================= EDIT ACTIONS ================= */

//   const rotateImage = async () => {
//     const result = await ImageManipulator.manipulateAsync(
//       workingUri,
//       [{ rotate: 90 }],
//       { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
//     );
//     setWorkingUri(result.uri);
//   };

//   const flipImage = async () => {
//     const result = await ImageManipulator.manipulateAsync(
//       workingUri,
//       [{ flip: ImageManipulator.FlipType.Horizontal }],
//       { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
//     );
//     setWorkingUri(result.uri);
//   };

//   const enhanceImage = async () => {
//     const result = await ImageManipulator.manipulateAsync(
//       workingUri,
//       [{ resize: { width: 1200 } }],
//       { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
//     );
//     setWorkingUri(result.uri);
//   };

//   const softImage = async () => {
//     const result = await ImageManipulator.manipulateAsync(
//       workingUri,
//       [],
//       { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
//     );
//     setWorkingUri(result.uri);
//   };

//   const sharpImage = async () => {
//     const result = await ImageManipulator.manipulateAsync(
//       workingUri,
//       [{ resize: { width: 1600 } }],
//       { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
//     );
//     setWorkingUri(result.uri);
//   };

//   const applyAndReturn = async () => {
//     router.replace({
//       pathname: "/add-wardrobe",
//       params: { editedUri: workingUri },
//     });
//   };

//   /* ================= UI ================= */

//   return (
//     <View style={styles.container}>
//       {/* IMAGE PREVIEW */}
//       <Image source={{ uri: workingUri }} style={styles.preview} resizeMode="contain" />

//       {/* TOOLS */}
//       <View style={styles.toolsRow}>
//         <Tool label="Rotate" onPress={rotateImage} />
//         <Tool label="Flip" onPress={flipImage} />
//         <Tool label="Enhance" onPress={enhanceImage} />
//         <Tool label="Soft" onPress={softImage} />
//         <Tool label="Sharp" onPress={sharpImage} />
//       </View>

//       {/* APPLY */}
//       <TouchableOpacity style={styles.applyBtn} onPress={applyAndReturn}>
//         <Text style={styles.applyText}>Apply & Save</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// /* ================= TOOL BUTTON ================= */

// function Tool({ label, onPress }: { label: string; onPress: () => void }) {
//   return (
//     <TouchableOpacity style={styles.toolBtn} onPress={onPress}>
//       <Text style={styles.toolText}>{label}</Text>
//     </TouchableOpacity>
//   );
// }

// /* ================= STYLES ================= */

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#000",
//     paddingTop: 20,
//   },
//   preview: {
//     width: "100%",
//     height: 420,
//   },
//   toolsRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "center",
//     marginTop: 20,
//   },
//   toolBtn: {
//     backgroundColor: "#1f1f1f",
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     borderRadius: 20,
//     margin: 6,
//   },
//   toolText: {
//     color: "#fff",
//     fontWeight: "600",
//   },
//   applyBtn: {
//     marginTop: 30,
//     marginHorizontal: 20,
//     backgroundColor: "#A855F7",
//     padding: 16,
//     borderRadius: 30,
//     alignItems: "center",
//   },
//   applyText: {
//     color: "#fff",
//     fontWeight: "700",
//     fontSize: 16,
//   },
// });
