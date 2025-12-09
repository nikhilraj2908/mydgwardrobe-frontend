import axios from "axios";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig.extra.apiBaseUrl;

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
