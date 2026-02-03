import Constants from "expo-constants";

const IMAGE_BASE_URL = Constants.expoConfig?.extra?.imageBaseUrl;

export const resolveImageUrl = (path?: string): string | undefined => {
  if (!path) return undefined;

  // Already absolute URL
  if (path.startsWith("http")) return path;

  // Guard: base URL missing
  if (!IMAGE_BASE_URL) {
    console.warn("IMAGE_BASE_URL is not defined");
    return undefined;
  }

  // Clean slashes to avoid //
  const base = IMAGE_BASE_URL.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");

  return `${base}/${cleanPath}`;
};
