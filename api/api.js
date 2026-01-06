import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";

const API_URL = Constants.expoConfig.extra.apiBaseUrl;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
 
});

// ✅ Attach token automatically
api.interceptors.request.use(
  async (config) => {
    let token = null;

    // Mobile
    token = await AsyncStorage.getItem("token");

    // Web fallback
    if (!token && Platform.OS === "web") {
      token = localStorage.getItem("token");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
