import { ReactNode } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";

export default function ScreenWrapper({ children }: { children: ReactNode }) {
  return (
    <ImageBackground
      source={require("../assets/images/bgallpage.png")}
      
      style={styles.bg}
      resizeMode="cover"
    >
      {/* Optional overlay for readability */}
      <View style={styles.overlay}>
        {children}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.85)", // 👈 adjust opacity if needed
  },
});
