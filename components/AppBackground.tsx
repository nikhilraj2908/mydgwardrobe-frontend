// components/AppBackground.tsx
import React, { ReactNode } from "react";
import { ImageBackground, View, StyleSheet } from "react-native";

type AppBackgroundProps = {
  children: ReactNode;
};

export default function AppBackground({ children }: AppBackgroundProps) {
  return (
    <ImageBackground
      source={require("../assets/images/bgallpage.png")}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Optional overlay */}
      <View style={styles.overlay} />

      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0)", // adjust if needed
  },
});
