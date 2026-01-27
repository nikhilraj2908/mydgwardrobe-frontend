import 'dotenv/config';

export default {
  expo: {
    name: "YourDigiCloset",
    slug: "YourDigiCloset",
    version: "1.0.0",

    scheme: "mydgwardrobe",   // 🔥 REQUIRED for deep linking

    extra: {
      // apiBaseUrl: "http://65.0.122.207",
      // apiBaseUrl: "http://localhost:5001",
     apiBaseUrl: "https://api.digiwardrobe.com",
      imageBaseUrl: "https://digiwardrobe-assets.s3.ap-south-1.amazonaws.com",
       eas: {
    projectId: "4d2059e7-e779-4f9d-979b-b64d170fb65f",
  },
    },

    android: {
      package: "com.yourdgwardrobe.app",
      usesCleartextTraffic: true, 
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "mydgwardrobe",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },

    ios: {
      bundleIdentifier: "com.yourdgwardrobe.app",
    },
  },
};
