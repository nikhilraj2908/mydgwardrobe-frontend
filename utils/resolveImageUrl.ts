import Constants from "expo-constants";

const IMAGE_BASE_URL = Constants.expoConfig?.extra?.imageBaseUrl;

export const resolveImageUrl = (path?: string) => {
  if (!path) return undefined;

  // Already full URL (legacy safety)
  if (path.startsWith("http")) return path;

  // S3 image
  return `${IMAGE_BASE_URL}/${path}`;
};
