import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

const { AUTH0_DOMAIN, AUTH0_CLIENT_ID } = Constants.expoConfig.extra;
const API_URL = Constants.expoConfig.extra.apiBaseUrl;

const discovery = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
};

export default function Callback() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const run = async () => {
      try {
        const code = String(params.code || "");
        if (!code) {
          router.replace("/(auth)/welcome");
          return;
        }

        const codeVerifier =
          (await AsyncStorage.getItem("auth0_code_verifier")) || "";

        if (!codeVerifier) {
          console.log("❌ Missing code_verifier");
          router.replace("/(auth)/welcome");
          return;
        }

        const redirectUri =
          (await AsyncStorage.getItem("auth0_redirect_uri")) ||
          AuthSession.makeRedirectUri({
            scheme: "mydgwardrobe",
            path: "callback",
            //  useProxy: true,
          });

        // 🔥 Exchange code for token (PKCE required)
        const tokenRes = await AuthSession.exchangeCodeAsync(
          {
            clientId: AUTH0_CLIENT_ID,
            code,
            redirectUri,
            extraParams: {
              code_verifier: codeVerifier,
            },
          },
          discovery
        );

        const idToken = tokenRes.idToken;
        if (!idToken) throw new Error("No id_token received");

        const api = axios.create({
          baseURL: API_URL,
          headers: { "Content-Type": "application/json" },
        });

        const res = await api.post("/api/auth/google", { idToken });

        const profileCompleted =
          res.data.user?.profileCompleted ?? false;

        await login(res.data.token, profileCompleted);

        // Cleanup PKCE
        await AsyncStorage.removeItem("auth0_code_verifier");
        await AsyncStorage.removeItem("auth0_redirect_uri");

        if (!profileCompleted) {
          router.replace("/(auth)/complete-profile");
        } else {
          router.replace("/profile");
        }
      } catch (err: any) {
        console.log("Callback error:", err?.response?.data || err?.message || err);
        router.replace("/(auth)/welcome");
      }
    };

    run();
  }, [params.code]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
