import { Redirect, useLocalSearchParams } from "expo-router";

export default function ResetPasswordEntry() {
  const { token } = useLocalSearchParams();

  if (!token) {
    return <Redirect href="/(auth)/forgot-password" />;
  }

  // Redirect to your actual reset screen with the token
  return <Redirect href={`/(auth)/reset-password?token=${token}`} />;
}
