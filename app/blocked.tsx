import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSavedItems } from '@/context/SavedItemsContext';
import { useFollow } from '@/context/FollowContext';

export default function BlockedScreen() {
  const router = useRouter();
  const { resetSaved } = useSavedItems();
  const { clearFollowing } = useFollow();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    resetSaved();
    clearFollowing();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        Your account has been blocked. Please contact support.
      </Text>
      <TouchableOpacity onPress={() => router.push('/help')}>
        <Text style={styles.link}>Help & Support</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    color: 'red',
    marginBottom: 20,
  },
  link: {
    color: 'blue',
    fontSize: 16,
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#A855F7',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});