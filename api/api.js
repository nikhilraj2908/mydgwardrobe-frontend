import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { router } from "expo-router";

const API_URL = Constants.expoConfig.extra.apiBaseUrl;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

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

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isRefreshCall =
      originalRequest?.url?.includes("/api/auth/refresh-token");

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isRefreshCall
    ) {
      originalRequest._retry = true;

      try {
        let storedRefreshToken = null;

        if (Platform.OS !== "web") {
          storedRefreshToken = await AsyncStorage.getItem("refreshToken");
        } else {
          storedRefreshToken = localStorage.getItem("refreshToken");
        }

        if (!storedRefreshToken) {
          throw new Error("No refresh token found");
        }

        const refreshResponse = await axios.post(
          `${API_URL}/api/auth/refresh-token`,
          { refreshToken: storedRefreshToken }
        );

        const newAccessToken = refreshResponse.data.token;
        const newRefreshToken = refreshResponse.data.refreshToken;

        if (Platform.OS !== "web") {
          await AsyncStorage.setItem("token", newAccessToken);
          await AsyncStorage.setItem("refreshToken", newRefreshToken);
        } else {
          localStorage.setItem("token", newAccessToken);
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        if (Platform.OS !== "web") {
          await AsyncStorage.removeItem("token");
          await AsyncStorage.removeItem("refreshToken");
          await AsyncStorage.removeItem("profileCompleted");
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("profileCompleted");
        }

        router.replace("/(auth)/welcome");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;