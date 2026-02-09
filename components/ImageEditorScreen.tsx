// import * as ImageManipulator from "expo-image-manipulator";
// import { router, useLocalSearchParams } from "expo-router";
// import { useState } from "react";
// import { Image, Slider, Text, TouchableOpacity, View } from "react-native";
// import { Brightness, Contrast } from "react-native-image-filter-kit";

// export default function ImageEditor() {
//   const { uri } = useLocalSearchParams();
//   const [brightness, setBrightness] = useState(1);
//   const [contrast, setContrast] = useState(1);

//   const applyEdits = async () => {
//     const result = await ImageManipulator.manipulateAsync(
//       uri as string,
//       [],
//       { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
//     );

//     router.back();
//     router.setParams({ editedUri: result.uri });
//   };

//   return (
//     <View style={{ flex: 1, backgroundColor: "#000" }}>
//       <Brightness amount={brightness}>
//         <Contrast amount={contrast}>
//           <Image source={{ uri }} style={{ width: "100%", height: 400 }} />
//         </Contrast>
//       </Brightness>

//       <Text>Brightness</Text>
//       <Slider minimumValue={0.5} maximumValue={1.5} value={brightness} onValueChange={setBrightness} />

//       <Text>Contrast</Text>
//       <Slider minimumValue={0.5} maximumValue={1.5} value={contrast} onValueChange={setContrast} />

//       <TouchableOpacity onPress={applyEdits}>
//         <Text style={{ color: "#fff" }}>Apply</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }
