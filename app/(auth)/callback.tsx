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
    const { login, setAuthInProgress } = useAuth();

    useEffect(() => {
        const run = async () => {
            try {
                setAuthInProgress(true); // Start loading
                console.log("🔐 Loading... Checking user authentication");

                const code = String(params.code || "");
                if (!code) {
                    console.log("❌ No code received, redirecting to welcome");
                    setAuthInProgress(false);
                    router.replace("/(auth)/welcome");
                    return;
                }

                const codeVerifier = (await AsyncStorage.getItem("auth0_code_verifier")) || "";
                if (!codeVerifier) {
                    console.log("❌ Missing code_verifier, redirecting to welcome");
                    setAuthInProgress(false);
                    router.replace("/(auth)/welcome");
                    return;
                }

                const redirectUri = (await AsyncStorage.getItem("auth0_redirect_uri")) ||
                    AuthSession.makeRedirectUri({ scheme: "mydgwardrobe", path: "callback" });

                console.log("🔐 Exchange code for token");
                const tokenRes = await AuthSession.exchangeCodeAsync(
                    { clientId: AUTH0_CLIENT_ID, code, redirectUri, extraParams: { code_verifier: codeVerifier } },
                    discovery
                );

                const idToken = tokenRes.idToken;
                if (!idToken) throw new Error("No id_token received");

                console.log("🔐 Token received, sending to backend");
                const res = await axios.post(`${API_URL}/api/auth/google`, { idToken });

                // Debugging: Check if user profile data is correct
                console.log("🔐 Backend response:", res.data);

                const profileCompleted = res.data.user.profileCompleted; // Check profile status
                console.log("🔐 Profile Completed Status:", profileCompleted);

                // Update frontend state and login the user
                await login(res.data.token, profileCompleted);

                // Clean up AsyncStorage
                await AsyncStorage.removeItem("auth0_code_verifier");
                await AsyncStorage.removeItem("auth0_redirect_uri");

                setAuthInProgress(false);

                // Debugging: Check redirection based on profile completion
                if (profileCompleted) {
                    console.log("🔐 Redirecting to profile page");
                    router.replace("/(tabs)/profile"); // Redirect to profile page
                } else {
                    console.log("🔐 Redirecting to complete profile page");
                    router.replace("/(auth)/complete-profile"); // Redirect to complete profile page
                }

            } catch (err) {
                console.log("❌ Callback error:", err);
                setAuthInProgress(false);
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
