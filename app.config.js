// import 'dotenv/config';

// export default {
//   expo: {
//     name: "YourDigiCloset",
//     slug: "YourDigiCloset",
//     version: "1.0.0",

//     scheme: "mydgwardrobe",   // 🔥 REQUIRED for deep linking

//     extra: {
//       // apiBaseUrl: "http://65.0.122.207",
//       // apiBaseUrl: "http://localhost:5001",
//      apiBaseUrl: "https://api.digiwardrobe.com",
//       imageBaseUrl: "https://digiwardrobe-assets.s3.ap-south-1.amazonaws.com",

//       AUTH0_DOMAIN: "dev-yhb3xssuawesxfyk.us.auth0.com",
//       AUTH0_CLIENT_ID: "b6BEiuZ5bJ29sar6FfCfrr35QqnKS4YA",



//        eas: {
//     projectId: "4d2059e7-e779-4f9d-979b-b64d170fb65f",
//   },
//     },

//     android: {
//       package: "com.yourdgwardrobe.app",
//       usesCleartextTraffic: true, 
//       intentFilters: [
//         {
//           action: "VIEW",
//           data: [
//             {
//               scheme: "mydgwardrobe",
//             },
//           ],
//           category: ["BROWSABLE", "DEFAULT"],
//         },
//       ],
//     },

//     ios: {
//       bundleIdentifier: "com.yourdgwardrobe.app",
//     },
//   },
// };
export default {
  expo: {
    name: "DG Wardrobe",
    slug: "YourDigiCloset",
    version: "1.0.0",

    icon: "./assets/images/DW_logo_A855F7.png",

    android: {
      package: "com.yourdgwardrobe.app",
      usesCleartextTraffic: true,

      adaptiveIcon: {
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
        backgroundColor: "#E6F4FE"
      },

      intentFilters: [
        {
          action: "VIEW",
          data: [{ scheme: "mydgwardrobe" }],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },

    ios: {
      bundleIdentifier: "com.yourdgwardrobe.app",
    },

    scheme: "mydgwardrobe",

    extra: {
      // apiBaseUrl: "https://api.digiwardrobe.com",
      // apiBaseUrl: "https://mydgwardrobe-backend-1.onrender.com",
      // apiBaseUrl: "http://localhost:5001",
      apiBaseUrl: "http://13.233.44.232:5001",
      imageBaseUrl: "https://digiwardrobe.s3.ap-south-1.amazonaws.com",

      AUTH0_DOMAIN: "dev-yhb3xssuawesxfyk.us.auth0.com",
      AUTH0_CLIENT_ID: "b6BEiuZ5bJ29sar6FfCfrr35QqnKS4YA",

      eas: {
        projectId: "4d2059e7-e779-4f9d-979b-b64d170fb65f",
      },
    },
  },
};