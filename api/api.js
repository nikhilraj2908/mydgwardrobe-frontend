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

    if (Platform.OS !== "web") {
      token = await AsyncStorage.getItem("token");
    } else {
      token = localStorage.getItem("token");
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 🔥🔥🔥 REAL FIX (HANDLE BOTH CASES)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);


export default api;
