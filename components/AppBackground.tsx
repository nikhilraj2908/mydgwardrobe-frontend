// components/AppBackground.tsx
import React, { ReactNode } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";

type AppBackgroundProps = {
  children: ReactNode;
};

export default function AppBackground({ children }: AppBackgroundProps) {
  return (
    <View style={styles.base}>
      <ImageBackground
        source={require("../assets/images/bgallpage.png")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        {children}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: "#FFFFFF", // ✅ prevents black bleed
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
});
