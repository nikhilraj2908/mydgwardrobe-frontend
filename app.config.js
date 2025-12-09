import 'dotenv/config';

export default {
  expo: {
    name: "MyFirstApp",
    slug: "MyFirstApp",
    version: "1.0.0",

    extra: {
      apiBaseUrl: process.env.API_BASE_URL,
    }
  }
};
