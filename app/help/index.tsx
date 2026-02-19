import { useTheme } from '@/app/theme/ThemeContext';
import AppBackground from '@/components/AppBackground';
import WardrobeHeader from '@/components/WardrobeHeader';
import { router } from "expo-router";
import React, { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HelpSupportPage = () => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleBackNavigation = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top", "bottom"]}>
      <AppBackground>
        <WardrobeHeader onBack={handleBackNavigation} />
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.heading}>Help & Support</Text>
          <Text style={styles.introText}>
            Welcome to the Help & Support page! Below, you will find a guide to help you get the most out of the app, and answers to common questions.
          </Text>

          <Text style={styles.sectionTitle}>1. Edit Your Profile</Text>
          <Text style={styles.text}>
            You can easily update your profile by tapping the Edit button on the profile page. From there, you can:
          </Text>
          <Text style={styles.text}>- Change your username and bio</Text>
          <Text style={styles.text}>- Upload a new profile picture to personalize your account</Text>

          <Text style={styles.sectionTitle}>2. Adding Items</Text>
          <Text style={styles.text}>
            To add new items to your collection:
          </Text>
          <Text style={styles.text}>- Tap the + icon located in the center of the screen on any tab.</Text>
          <Text style={styles.text}>- Choose from your gallery or take a photo to add a new item to your wardrobe.</Text>
          <Text style={styles.text}>- Crop, rotate, or mirror your image to fit your desired look.</Text>

          <Text style={styles.sectionTitle}>3. Image Editing & Uploading</Text>
          <Text style={styles.text}>
            Once you’ve selected an image:
          </Text>
          <Text style={styles.text}>- You can crop, rotate, or mirror the image as per your preference.</Text>
          <Text style={styles.text}>- If you’d like to edit further, the app allows you to pick images directly from your gallery.</Text>
          <Text style={styles.text}>- When you upload an image, you can choose to post it as private, public, or premium.</Text>
          <Text style={styles.text}>  - **Private**: Visible only to you.</Text>
          <Text style={styles.text}>  - **Public**: Visible to all users.</Text>
          <Text style={styles.text}>  - **Premium**: Visible to premium members only.</Text>

          <Text style={styles.sectionTitle}>4. Requesting Premium Collection Access</Text>
          <Text style={styles.text}>
            If you see an item marked as Premium from another user:
          </Text>
          <Text style={styles.text}>- You can send a request to view their premium collection.</Text>
          <Text style={styles.text}>- If the user approves your request, you will gain access to their Premium Items.</Text>

          <Text style={styles.sectionTitle}>5. Interacting with Posts</Text>
          <Text style={styles.text}>
            You can engage with posts in the following ways:
          </Text>
          <Text style={styles.text}>- Save posts that you like to revisit later.</Text>
          <Text style={styles.text}>- Like and comment on posts to interact with other users.</Text>
          <Text style={styles.text}>- Share your own items, and interact with the community through these features.</Text>

          <Text style={styles.sectionTitle}>6. Explore Section</Text>
          <Text style={styles.text}>
            In the Explore section:
          </Text>
          <Text style={styles.text}>- Browse items based on categories (e.g., shirts, pants, accessories, etc.).</Text>
          <Text style={styles.text}>- Find new items that fit your style by simply exploring each category.</Text>

          <Text style={styles.sectionTitle}>7. Wardrobe</Text>
          <Text style={styles.text}>
            In the Wardrobe section:
          </Text>
          <Text style={styles.text}>- You can see other users' wardrobe collections, explore their items, and get inspiration from their style.</Text>
          <Text style={styles.text}>- This section gives you an idea of what others are collecting and sharing.</Text>

          <Text style={styles.sectionTitle}>8. Reporting Issues</Text>
          <Text style={styles.text}>
            If you encounter any issues or need to report something, please reach out to us at:
          </Text>
          <Text
            style={styles.emailLink}
            onPress={() => Linking.openURL('mailto:support@digiwardrobe.com')}
          >
            support@digiwardrobe.com
          </Text>
          <Text style={styles.text}>We’re always here to assist and resolve any problems you may face!</Text>

          <TouchableOpacity style={styles.button} onPress={() => { router.push("/profile") }}>
            <Text style={styles.buttonText}>Back to Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      padding: 20,
      paddingBottom: 20,
    },
    heading: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: 10,
    },
    introText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginTop: 20,
    },
    text: {
      fontSize: 16,
      color: colors.textSecondary,
      marginVertical: 5,
    },
    emailLink: {
      fontSize: 16,
      color: colors.primary,
      marginVertical: 10,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 10,
      borderRadius: 5,
      marginTop: 20,
    },
    buttonText: {
      color: colors.textLight,
      textAlign: 'center',
      fontSize: 18,
    },
  });

export default HelpSupportPage;