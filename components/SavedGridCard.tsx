import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSavedItems } from '../context/SavedItemsContext';

interface SavedGridCardProps {
  item: {
    _id: string;
    name: string;
    brand?: string;
    price: number;
    likes?: number;
    imageUrl: string;
    user?: {
      username: string;
    };
  };
  onPress?: () => void;
}

export default function SavedGridCard({ item, onPress }: SavedGridCardProps) {
  const { toggleSave, savedItemIds } = useSavedItems();
  const isSaved = savedItemIds.includes(item._id);

  const formatPrice = (price: number) => {
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    } else if (price >= 1000) {
      return `₹${(price / 1000).toFixed(1)}K`;
    }
    return `₹${price}`;
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's a relative path
    if (imagePath.startsWith('/')) {
      return `https://api.digiwardrobe.com${imagePath}`;
    }
    
    return `https://api.digiwardrobe.com/${imagePath}`;
  };

  const imageUrl = getImageUrl(item.imageUrl);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl || 'https://via.placeholder.com/150' }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Bookmark Button */}
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={() => toggleSave(item._id)}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={20}
            color={isSaved ? "#A855F7" : "#666"}
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.name || 'Item Name'}
        </Text>
        
        <Text style={styles.brand} numberOfLines={1}>
          {item.brand || 'Brand'}
        </Text>
        
        <View style={styles.statsRow}>
          <Text style={styles.price}>
            {formatPrice(item.price)}
          </Text>
          
          <View style={styles.likesContainer}>
            <Ionicons name="heart" size={12} color="#666" />
            <Text style={styles.likesCount}>
              {item.likes || 0}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bookmarkButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  brand: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesCount: {
    fontSize: 12,
    color: '#666',
  },
});