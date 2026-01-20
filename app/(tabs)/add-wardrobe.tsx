import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ✅ Import centralized axios instance
import api from "../../api/api"; // adjust path if needed
import { checkIfConfigIsValid } from "react-native-reanimated/lib/typescript/animation/spring";
import AppBackground from "@/components/AppBackground";

// Type definition for Category
interface Category {
    _id: string;
    name: string;
    type: 'mens' | 'womens' | 'unisex';
    createdAt?: string;
    updatedAt?: string;
}

// Default categories as fallback
const DEFAULT_CATEGORIES = {
    mens: [
        "T-Shirts", "Shirts", "Jeans", "Trousers", "Shorts", "Jackets", "Blazers",
        "Sweaters", "Hoodies", "Suits", "Formal Wear", "Casual Wear", "Sportswear",
        "Underwear", "Socks", "Pajamas", "Swimwear", "Coats", "Raincoats", "Vests",
        // "Polo Shirts", "Tank Tops", "Cardigans", "Joggers", "Cargos", "Chinos",
        // "Denim Jackets", "Leather Jackets", "Track Pants", "Thermals", "Kurtas",
        // "Sherwanis", "Dhotis", "Traditional Wear", "Accessories"
    ],
    womens: [
        "Tops", "Blouses", "T-Shirts", "Shirts", "Jeans", "Trousers", "Leggings",
        "Skirts", "Dresses", "Gowns", "Jackets", "Blazers", "Sweaters", "Cardigans",
        "Hoodies", "Suits", "Formal Wear", "Casual Wear", "Sportswear", "Lingerie",
        // "Bras", "Panties", "Socks", "Stockings", "Pajamas", "Nightwear", "Swimwear",
        // "Bikinis", "Coats", "Raincoats", "Vests", "Tank Tops", "Jumpsuits", "Rompers",
        // "Palazzos", "Capris", "Shorts", "Sarees", "Lehengas", "Salwar Suits",
        // "Kurtis", "Anarkalis", "Blouse", "Traditional Wear", "Accessories"
    ]
};


const CATEGORY_ICONS = {
    mens: {
        accessories: require("../../assets/categories/mens/Accessories.png"),
        blazers: require("../../assets/categories/mens/Blazers.png"),
        cargos: require("../../assets/categories/mens/Cargo.png"),
        shirts: require("../../assets/categories/mens/Shirts.png"),
        chinos: require("../../assets/categories/mens/Chino.png"),
        coats: require("../../assets/categories/mens/Coats.png"),
        denimjackets: require("../../assets/categories/mens/DenimJackets.png"),
        dhotis: require("../../assets/categories/mens/Dhotis.png"),
        formalwear: require("../../assets/categories/mens/FormalWear.png"),
        hoodies: require("../../assets/categories/mens/Hoodies.png"),
        jackets: require("../../assets/categories/mens/Jackets.png"),
        jeans: require("../../assets/categories/mens/Jeans.png"),
        joggers: require("../../assets/categories/mens/Joggers.png"),
        kurtas: require("../../assets/categories/mens/Kurtas.png"),
        pajamas: require("../../assets/categories/mens/Pajamas.png"),
        pants: require("../../assets/categories/mens/Pants.png"),
        poloshirts: require("../../assets/categories/mens/PoloShirts.png"),
        raincoats: require("../../assets/categories/mens/Raincoats.png"),
        sherwanis: require("../../assets/categories/mens/Sherwanis.png"),
        shorts: require("../../assets/categories/mens/Shorts.png"),
        socks: require("../../assets/categories/mens/Socks.png"),
        sportswear: require("../../assets/categories/mens/Sportswear.png"),
        lifestyle: require("../../assets/categories/mens/Lifestyle.png"),
        straightfit: require("../../assets/categories/mens/Straightfit.png"),
        suits: require("../../assets/categories/mens/Suits.png"),
        tanktops: require("../../assets/categories/mens/TankTops.png"),
        thermals: require("../../assets/categories/mens/Thermals.png"),
        trackpants: require("../../assets/categories/mens/TrackPants.png"),
        traditionalwear: require("../../assets/categories/mens/TraditionalWear.png"),
        trousers: require("../../assets/categories/mens/Trousers.png"),
        underwear: require("../../assets/categories/mens/Underwear.png"),
        vests: require("../../assets/categories/mens/Vests.png"),
        sweaters: require("../../assets/categories/mens/Sweaters.png"),
        swimwear: require("../../assets/categories/mens/Swimwear.png"),
        leatherjackets: require("../../assets/categories/mens/LeatherJackets.png"),
        casualwear: require("../../assets/categories/mens/CasualWear.png"),
        "t-shirts": require("../../assets/categories/mens/T-Shirts.png"),
    },

    womens: {
        accessories: require("../../assets/categories/womens/Accessories.png"),
        anarkalis: require("../../assets/categories/womens/Anarkali.png"),
        bikinis: require("../../assets/categories/womens/Bikini.png"),
        blazers: require("../../assets/categories/womens/Blazer.png"),
        blouse: require("../../assets/categories/womens/Blouse.png"),
        bras: require("../../assets/categories/womens/Bra.png"),
        capris: require("../../assets/categories/womens/Capri.png"),
        cardigans: require("../../assets/categories/womens/Cardigan.png"),
        casualwear: require("../../assets/categories/womens/CasualWear.png"),
        coats: require("../../assets/categories/womens/Coat.png"),
        dresses: require("../../assets/categories/womens/Dress.png"),
        formalwear: require("../../assets/categories/womens/FormalWear.png"),
        gowns: require("../../assets/categories/womens/Gown.png"),
        hoodies: require("../../assets/categories/womens/Hoodie.png"),
        jackets: require("../../assets/categories/womens/Jacket.png"),
        jeans: require("../../assets/categories/womens/Jean.png"),
        jumpsuits: require("../../assets/categories/womens/Jumpsuit.png"),
        kurtis: require("../../assets/categories/womens/Kurti.png"),
        leggings: require("../../assets/categories/womens/Legging.png"),
        lehengas: require("../../assets/categories/womens/Lehnga.png"),
        lingerie: require("../../assets/categories/womens/Lingerie.png"),
        nightwear: require("../../assets/categories/womens/NightWear.png"),
        pajamas: require("../../assets/categories/womens/Pajama.png"),
        panties: require("../../assets/categories/womens/Panty.png"),
        palazzos: require("../../assets/categories/womens/Plazzo.png"),
        raincoats: require("../../assets/categories/womens/Raincoat.png"),
        rompers: require("../../assets/categories/womens/Romper.png"),
        salwarsuits: require("../../assets/categories/womens/SalwarSuit.png"),
        sarees: require("../../assets/categories/womens/Saree.png"),
        shirts: require("../../assets/categories/womens/Shirt.png"),
        socks: require("../../assets/categories/womens/Socks.png"),
        shorts: require("../../assets/categories/womens/Shorts.png"),
        sportswear: require("../../assets/categories/womens/SportsWear.png"),
        stockings: require("../../assets/categories/womens/Stocking.png"),
        suits: require("../../assets/categories/womens/Suit.png"),
        sweaters: require("../../assets/categories/womens/Sweater.png"),
        swimwear: require("../../assets/categories/womens/SwimWear.png"),
        tanktops: require("../../assets/categories/womens/TankTop.png"),
        traditionalwear: require("../../assets/categories/womens/TraditionalWear.png"),
        trousers: require("../../assets/categories/womens/Trouser.png"),
        't-shirts': require("../../assets/categories/womens/Tshirt.png"),
        vests: require("../../assets/categories/womens/Vest.png"),
        tops: require("../../assets/categories/womens/Top.png"),
        skirts: require("../../assets/categories/womens/Skirt.png"),

    },

    unisex: {},

};


const normalizeCategoryKey = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "");

export default function AddWardrobe() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    // const [image, setImage] = useState<any>(null);
    type ImageItem = {
        uri: string;
        isRemote: boolean;
        fileName?: string | null;   // ✅ allow null
        mimeType?: string;
    };

    const SERVER = "https://api.digiwardrobe.com"; // or your ENV base
    const [images, setImages] = useState<ImageItem[]>([]);
    const [category, setCategory] = useState("");
    const [customCategory, setCustomCategory] = useState("");
    const [categoryType, setCategoryType] = useState<"mens" | "womens" | "unisex">("unisex");
    const [wardrobe, setWardrobe] = useState("");
    const [customWardrobe, setCustomWardrobe] = useState("");
    const [price, setPrice] = useState("");
    const [brand, setBrand] = useState("");
    const [visibility, setVisibility] = useState<"public" | "private">("public");
    const [loading, setLoading] = useState(false);

    // State for dropdowns
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showWardrobeDropdown, setShowWardrobeDropdown] = useState(false);
    const [userWardrobes, setUserWardrobes] = useState<string[]>([]);
    const [loadingWardrobes, setLoadingWardrobes] = useState(false);
    const [showOtherWardrobeInput, setShowOtherWardrobeInput] = useState(false);
    const [showOtherCategoryInput, setShowOtherCategoryInput] = useState(false);

    // Category API states
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [description, setDescription] = useState("");

    const params = useLocalSearchParams();

    const mode = (params.mode as "create" | "edit") || "create";
    const itemId = params.itemId as string | undefined;

    const isEdit = mode === "edit" && !!itemId;


    useEffect(() => {
        if (!isEdit) return;

        const fetchItem = async () => {
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem("token");

                const res = await api.get(`/api/wardrobe/item/${itemId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const item = res.data;

                setCategory(
                    typeof item.category === "string"
                        ? item.category
                        : item.category?.name || ""
                );

                setWardrobe(
                    typeof item.wardrobe === "string"
                        ? item.wardrobe
                        : item.wardrobe?.name || ""
                );
                setPrice(item.price ? String(item.price) : "");
                setBrand(item.brand || "");
                setVisibility(item.visibility || "public");
                setDescription(item.description || "");

                // ✅ Convert DB images[] => ImageItem[]
                const dbImages: ImageItem[] = (item.images || []).map((p: string) => ({
                    uri: normalizeImageUrl(p),
                    isRemote: true,
                }));

                setImages(dbImages);
            } catch (e) {
                Alert.alert("Error", "Failed to load item");
            } finally {
                setLoading(false);
            }
        };

        fetchItem();
    }, [isEdit, itemId]);

    const getCategoryIcon = (item: Category) => {
        const key = normalizeCategoryKey(item.name);

        if (item.type === "mens" && CATEGORY_ICONS.mens[key]) {
            return CATEGORY_ICONS.mens[key];
        }

        if (item.type === "womens" && CATEGORY_ICONS.womens[key]) {
            return CATEGORY_ICONS.womens[key];
        }

        return null;
    };

    const CategoryCard = ({ item }: { item: Category }) => {
        const icon = getCategoryIcon(item);
        return (
            <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => handleCategorySelect(item)}
                onLongPress={() => {
                    if (!item._id.startsWith("default-")) {
                        handleDeleteCategory(item._id);
                    }
                }}
            >
                <View style={styles.categoryIconWrap}>
                    {icon ? (
                        <Image source={icon} style={styles.categoryIcon} />
                    ) : (
                        <Ionicons name="shirt-outline" size={28} color="#A855F7" />
                    )}
                </View>

                <Text style={styles.categoryCardText} numberOfLines={1}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    /* ================= FETCH CATEGORIES ================= */
    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await api.get("/api/categories");

            if (response.data && Array.isArray(response.data)) {
                setCategories(response.data);
                setFilteredCategories(response.data);
            } else {
                // If API returns empty or invalid data, use defaults
                console.warn("No categories returned from API, using defaults");
                const defaultCategoriesList: Category[] = [
                    ...DEFAULT_CATEGORIES.mens.map(name => ({
                        _id: `default-mens-${name.toLowerCase().replace(/\s+/g, '-')}`,
                        name,
                        type: 'mens' as const
                    })),
                    ...DEFAULT_CATEGORIES.womens.map(name => ({
                        _id: `default-womens-${name.toLowerCase().replace(/\s+/g, '-')}`,
                        name,
                        type: 'womens' as const
                    }))
                ];
                setCategories(defaultCategoriesList);
                setFilteredCategories(defaultCategoriesList);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            // Fallback to default categories if API fails
            const defaultCategoriesList: Category[] = [
                ...DEFAULT_CATEGORIES.mens.map(name => ({
                    _id: `default-mens-${name.toLowerCase().replace(/\s+/g, '-')}`,
                    name,
                    type: 'mens' as const
                })),
                ...DEFAULT_CATEGORIES.womens.map(name => ({
                    _id: `default-womens-${name.toLowerCase().replace(/\s+/g, '-')}`,
                    name,
                    type: 'womens' as const
                }))
            ];
            setCategories(defaultCategoriesList);
            setFilteredCategories(defaultCategoriesList);
        } finally {
            setLoadingCategories(false);
        }
    };

    /* ================= CREATE NEW CATEGORY ================= */
    const createNewCategory = async (categoryName: string, type: "mens" | "womens" | "unisex") => {
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) {

                Alert.alert("Error", "Please login to create categories");
                return null;
            }

            const response = await api.post(
                "/api/categories",
                { name: categoryName, type },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (response.data) {
                // Add the new category to the local state
                const newCategory = response.data.category || response.data;
                setCategories(prev => [...prev, newCategory]);
                setFilteredCategories(prev => [...prev, newCategory]);
                return newCategory;
            }
        } catch (error: any) {
            console.error("Error creating category:", error);

            // Check if it's a duplicate error (409 or similar)
            if (error.response?.status === 409) {
                Alert.alert("Category exists", "This category already exists.");
            } else {
                Alert.alert("Error", error.response?.data?.message || "Failed to create category");
            }
            return null;
        }
    };

    /* ================= DELETE CATEGORY ================= */
    const handleDeleteCategory = async (categoryId: string) => {
        Alert.alert(
            "Delete Category",
            "Are you sure you want to delete this category?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem("token");
                            if (!token) {
                                Alert.alert("Error", "Please login to delete categories");
                                return;
                            }

                            await api.delete(`/api/categories${categoryId}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });

                            // Remove from local state
                            setCategories(prev => prev.filter(cat => cat._id !== categoryId));
                            setFilteredCategories(prev => prev.filter(cat => cat._id !== categoryId));

                            Alert.alert("Success", "Category deleted successfully");
                        } catch (error: any) {
                            console.error("Error deleting category:", error);
                            Alert.alert("Error", error.response?.data?.message || "Failed to delete category");
                        }
                    },
                },
            ]
        );
    };

    /* ================= FETCH USER'S WARDROBES ================= */
    useEffect(() => {
        fetchUserWardrobes();
        fetchCategories(); // Fetch categories on component mount
    }, []);

    const fetchUserWardrobes = async () => {
        try {
            setLoadingWardrobes(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            const response = await api.get("/api/wardrobe/list", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data?.wardrobes) {
                const wardrobeNames = response.data.wardrobes.map((w: any) => w.name);
                setUserWardrobes(wardrobeNames);
            }
        } catch (error) {
            console.error("Error fetching wardrobes:", error);
        } finally {
            setLoadingWardrobes(false);
        }
    };

    /* ================= SEARCH CATEGORIES ================= */
    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim() === "") {
            setFilteredCategories(categories);
        } else {
            const filtered = categories.filter(cat =>
                cat.name.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredCategories(filtered);
        }
    };

    /* ================= IMAGE PICKERS ================= */
    const pickFromGallery = async () => {
        const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });

        if (!res.canceled) {
            setImages(prev => [
                ...prev,
                ...res.assets.map(a => ({
                    uri: a.uri,
                    isRemote: false,
                    fileName: a.fileName,
                    mimeType: a.mimeType,
                })),
            ]);
        }
    };
    const normalizeImageUrl = (path: string) => {
        if (!path) return "";
        if (path.startsWith("http")) return path;

        // ✅ ensure exactly ONE slash between domain and path
        if (!path.startsWith("/")) {
            path = "/" + path;
        }

        return `${SERVER}${path}`;
    };


    const pickFromCamera = async () => {
        const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });

        if (!res.canceled) {
            const a = res.assets[0];
            setImages(prev => [
                ...prev,
                {
                    uri: a.uri,
                    isRemote: false,
                    fileName: a.fileName,
                    mimeType: a.mimeType,
                },
            ]);
        }
    };

    /* ================= CATEGORY SELECTION ================= */
    const handleCategorySelect = async (selectedCategory: Category | "other") => {
        if (selectedCategory === "other") {
            setShowOtherCategoryInput(true);
            setCategory("");
            setShowCategoryDropdown(false);
        } else {
            setCategory(selectedCategory.name);
            setShowOtherCategoryInput(false);
            setShowCategoryDropdown(false);
        }
    };

    /* ================= WARDROBE SELECTION ================= */
    const handleWardrobeSelect = (selectedWardrobe: string) => {
        if (selectedWardrobe === "other") {
            setShowOtherWardrobeInput(true);
            setWardrobe("");
            setShowWardrobeDropdown(false);
        } else {
            setWardrobe(selectedWardrobe);
            setShowOtherWardrobeInput(false);
            setShowWardrobeDropdown(false);
        }
    };

    /* ================= SUBMIT ================= */
    const getToken = async () => {
        return await AsyncStorage.getItem("token");
    };

    const handleSubmit = async () => {
        let finalCategory = category;

        // custom category creation if needed
        if (showOtherCategoryInput && customCategory) {
            const newCategory = await createNewCategory(customCategory, categoryType);
            if (!newCategory) return;
            finalCategory = newCategory.name;
        }

        const finalWardrobe =
            showOtherWardrobeInput && customWardrobe ? customWardrobe : wardrobe;

        if (images.length === 0 || !finalCategory || !finalWardrobe) {
            Alert.alert("Error", "At least one image, category & wardrobe are required");
            return;
        }

        try {
            setLoading(true);

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                Alert.alert("Error", "Token not found. Please login again.");
                return;
            }

            const formData = new FormData();

            // ✅ 1) Upload only NEW images
            images
                .filter(img => !img.isRemote)
                .forEach((img, index) => {
                    formData.append("images", {
                        uri: img.uri,
                        name: img.fileName || `wardrobe_${Date.now()}_${index}.jpg`,
                        type: img.mimeType || "image/jpeg",
                    } as any);
                });

            // ✅ 2) Send remaining old images only in EDIT mode
            if (isEdit) {
                const existing = images
                    .filter(img => img.isRemote)
                    .map(img => {
                        let path = img.uri;

                        // normalize
                        if (path.startsWith(SERVER)) {
                            path = path.replace(SERVER, "");
                        }
                        if (path.startsWith("/")) {
                            path = path.slice(1);
                        }


                        return path;
                    }); // back to "/uploads/.."

                formData.append("existingImages", JSON.stringify(existing));
            }

            formData.append("category", finalCategory);
            formData.append("wardrobe", finalWardrobe);
            formData.append("price", price || "0");
            formData.append("brand", brand);
            formData.append("visibility", visibility);
            if (description.trim()) formData.append("description", description.trim());

            // ✅ 3) Decide API based on create/edit
            const url = isEdit
                ? `${SERVER}/api/wardrobe/item/${itemId}`
                : `${SERVER}/api/wardrobe/add`;

            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Request failed");

            Alert.alert("Success", isEdit ? "Item updated" : "Item added");
            router.back();
        } catch (err: any) {
            Alert.alert("Error", err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };


    /* ================= RENDER CATEGORY ITEM ================= */
    const renderCategoryItem = ({ item }: { item: Category }) => (
        <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => handleCategorySelect(item)}
            onLongPress={() => {
                // Only allow deletion for non-default categories
                if (!item._id.startsWith('default-')) {
                    handleDeleteCategory(item._id);
                }
            }}
        >
            <View style={styles.categoryItemContent}>
                <Text style={styles.dropdownItemText}>{item.name}</Text>
                {!item._id.startsWith('default-') && (
                    <Ionicons name="trash-outline" size={16} color="#FF3B30" style={styles.deleteIcon} />
                )}
            </View>
            <View style={[
                styles.categoryBadge,
                {
                    backgroundColor: item.type === 'mens' ? '#3B82F6' :
                        item.type === 'womens' ? '#EC4899' : '#8B5CF6'
                }
            ]}>
                <Text style={styles.categoryBadgeText}>
                    {item.type === 'mens' ? 'M' : item.type === 'womens' ? 'F' : 'U'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    /* ================= RENDER CATEGORY SECTION ================= */
    const renderCategorySection = (
        title: string,
        data: Category[],
        typeFilter: "mens" | "womens" | "unisex"
    ) => {
        const sectionData = data.filter(c => c.type === typeFilter);

        if (sectionData.length === 0) return null;

        return (
            <View style={{ marginBottom: 16 }}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>{title}</Text>
                    <Text style={styles.sectionCount}>{sectionData.length} items</Text>
                </View>

                <FlatList
                    data={sectionData}
                    keyExtractor={(item) => item._id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16 }}
                    renderItem={({ item }) => <CategoryCard item={item} />}
                />
            </View>
        );
    };


    /* ================= HANDLE CREATE CUSTOM CATEGORY ================= */
    const handleCreateCustomCategory = async () => {
        if (!customCategory.trim()) {
            Alert.alert("Error", "Please enter a category name");
            return;
        }

        const newCategory = await createNewCategory(customCategory, categoryType);
        if (newCategory) {
            setCategory(newCategory.name);
            setShowOtherCategoryInput(false);
            Alert.alert("Success", "Category created successfully!");
        }
    };

    return (
        <AppBackground>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>{isEdit ? "Edit Item" : "Add to Wardrobe"}</Text>

                <View style={{ width: 24 }} />
            </View>

            {/* Upload */}
            <View style={styles.uploadBox}>
                {images.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {images.map((img, index) => (
                            <View key={index} style={{ position: "relative", marginRight: 8 }}>
                                <Image source={{ uri: img.uri }} style={styles.preview} />

                                <TouchableOpacity
                                    style={styles.removeIcon}
                                    onPress={() => setImages(prev => prev.filter((_, i) => i !== index))}
                                >
                                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        ))}

                    </ScrollView>
                ) : (
                    <>
                        <View style={styles.iconCircle}>
                            <Ionicons name="camera-outline" size={26} color="#ffffffff" />
                        </View>
                        <Text style={styles.uploadTitle}>Tap to Add Photo</Text>
                        <Text style={styles.uploadSub}>
                            Take a photo or choose from gallery
                        </Text>
                    </>
                )}

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={pickFromCamera}>
                        <Ionicons name="camera-outline" size={16} color="#A855F7" />
                        <Text style={styles.actionText}>Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtn} onPress={pickFromGallery}>
                        <Ionicons name="image-outline" size={16} color="#A855F7" />
                        <Text style={styles.actionText}>Gallery</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Category Dropdown */}
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Category *</Text>
                <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setShowCategoryDropdown(true)}
                >
                    <Text style={category || showOtherCategoryInput ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                        {showOtherCategoryInput ? "Other (type below)" : category || "Select Category"}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={20} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Custom Category Input (when "other" is selected) */}
            {showOtherCategoryInput && (
                <View style={styles.customCategoryContainer}>
                    <Text style={styles.inputLabel}>Create New Category *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter custom category name"
                        value={customCategory}
                        onChangeText={setCustomCategory}
                    />

                    <Text style={[styles.inputLabel, { marginTop: 12 }]}>Category Type</Text>
                    <View style={styles.visibilityRow}>
                        {(["mens", "womens", "unisex"] as const).map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.visibilityBtn,
                                    categoryType === type && styles.activeVisibility,
                                ]}
                                onPress={() => setCategoryType(type)}
                            >
                                <Text
                                    style={{
                                        color: categoryType === type ? "#fff" : "#111",
                                        fontWeight: "600",
                                    }}
                                >
                                    {type.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, styles.createCategoryBtn]}
                        onPress={handleCreateCustomCategory}
                        disabled={!customCategory.trim()}
                    >
                        <Text style={styles.submitText}>Create Category</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => {
                            setShowOtherCategoryInput(false);
                            setCustomCategory("");
                        }}
                    >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Wardrobe Dropdown */}
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Wardrobe *</Text>
                <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setShowWardrobeDropdown(true)}
                >
                    <Text style={wardrobe ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                        {showOtherWardrobeInput ? "Other (type below)" : wardrobe || "Select Wardrobe"}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={20} color="#666" />
                </TouchableOpacity>
            </View>

            {/* Custom Wardrobe Input (when "other" is selected) */}
            {showOtherWardrobeInput && (
                <TextInput
                    style={styles.input}
                    placeholder="Enter new wardrobe name"
                    value={customWardrobe}
                    onChangeText={setCustomWardrobe}
                />
            )}

            {/* Price */}
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Price (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter price"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                />
            </View>

            {/* Brand */}
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Brand (Optional)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter brand name"
                    value={brand}
                    onChangeText={setBrand}
                />
            </View>
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                    style={[styles.input, { height: 100 }]}
                    placeholder="Describe this item (fit, fabric, front/back, styling tips...)"
                    multiline
                    value={description}
                    onChangeText={setDescription}
                />
            </View>


            {/* Visibility */}
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Visibility</Text>
                <View style={styles.visibilityRow}>
                    {(["public", "private"] as const).map((v) => (
                        <TouchableOpacity
                            key={v}
                            style={[
                                styles.visibilityBtn,
                                visibility === v && styles.activeVisibility,
                            ]}
                            onPress={() => setVisibility(v)}
                        >
                            <Text
                                style={{
                                    color: visibility === v ? "#fff" : "#111",
                                    fontWeight: "600",
                                }}
                            >
                                {v.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitText}>{isEdit ? "Update Item" : "Add to Wardrobe"}</Text>

                )}
            </TouchableOpacity>

            {/* Category Dropdown Modal */}
            <Modal
                visible={showCategoryDropdown}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCategoryDropdown(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalContent,
                            { paddingBottom: insets.bottom || 16 },
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Category</Text>
                            <TouchableOpacity onPress={() => setShowCategoryDropdown(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View style={styles.searchContainer}>
                            <Ionicons name="search-outline" size={20} color="#666" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search categories..."
                                value={searchQuery}
                                onChangeText={handleSearch}
                                autoCapitalize="none"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => handleSearch("")}>
                                    <Ionicons name="close-circle" size={20} color="#999" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {loadingCategories ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#A855F7" />
                                <Text style={styles.loadingText}>Loading categories...</Text>
                            </View>
                        ) : (
                            <ScrollView style={styles.modalScrollView}>
                                {searchQuery.length > 0 ? (
                                    // Show filtered results when searching
                                    <View style={styles.searchResultsContainer}>
                                        <Text style={styles.searchResultsTitle}>
                                            Search Results ({filteredCategories.length})
                                        </Text>
                                        {filteredCategories.length > 0 ? (
                                            filteredCategories.map((item) => (
                                                <TouchableOpacity
                                                    key={item._id}
                                                    style={styles.searchResultItem}
                                                    onPress={() => handleCategorySelect(item)}
                                                    onLongPress={() => {
                                                        if (!item._id.startsWith('default-')) {
                                                            handleDeleteCategory(item._id);
                                                        }
                                                    }}
                                                >
                                                    <View style={styles.categoryItemContent}>
                                                        <Text style={styles.searchResultText}>{item.name}</Text>
                                                        {!item._id.startsWith('default-') && (
                                                            <Ionicons name="trash-outline" size={16} color="#FF3B30" style={styles.deleteIcon} />
                                                        )}
                                                    </View>
                                                    <View style={[
                                                        styles.categoryBadge,
                                                        {
                                                            backgroundColor: item.type === 'mens' ? '#3B82F6' :
                                                                item.type === 'womens' ? '#EC4899' : '#8B5CF6'
                                                        }
                                                    ]}>
                                                        <Text style={styles.categoryBadgeText}>
                                                            {item.type === 'mens' ? 'M' : item.type === 'womens' ? 'F' : 'U'}
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))
                                        ) : (
                                            <View style={styles.noResultsContainer}>
                                                <Ionicons name="search-outline" size={48} color="#ccc" />
                                                <Text style={styles.noResultsText}>No categories found</Text>
                                                <Text style={styles.noResultsSubText}>
                                                    Try a different search term
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    // Show categorized view when not searching
                                    <>
                                        {renderCategorySection("Men's Categories", categories, 'mens')}
                                        {renderCategorySection("Women's Categories", categories, 'womens')}

                                        {/* Unisex Categories */}
                                        {categories.filter(cat => cat.type === 'unisex').length > 0 && (
                                            renderCategorySection("Unisex Categories", categories, 'unisex')
                                        )}
                                    </>
                                )}

                                {/* "Other" Option */}
                                <TouchableOpacity
                                    key="other-category-option"
                                    style={styles.otherOption}
                                    onPress={() => handleCategorySelect("other")}
                                >
                                    <View style={styles.otherIconContainer}>
                                        <Ionicons name="add-circle-outline" size={24} color="#A855F7" />
                                    </View>
                                    <View style={styles.otherTextContainer}>
                                        <Text style={styles.otherOptionTitle}>Other</Text>
                                        <Text style={styles.otherOptionSubtitle}>Create custom category</Text>
                                    </View>
                                    <Ionicons name="chevron-forward-outline" size={20} color="#999" />
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Wardrobe Dropdown Modal */}
            <Modal
                visible={showWardrobeDropdown}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowWardrobeDropdown(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalContent,
                            { paddingBottom: insets.bottom || 16 },
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Wardrobe</Text>
                            <TouchableOpacity onPress={() => setShowWardrobeDropdown(false)}>
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        {loadingWardrobes ? (
                            <ActivityIndicator size="large" color="#A855F7" style={styles.loadingIndicator} />
                        ) : (
                            <FlatList
                                data={[...userWardrobes, "other"]}
                                keyExtractor={(item) => item}
                                contentContainerStyle={{
                                    paddingBottom: insets.bottom + 20,
                                }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.dropdownItem}
                                        onPress={() => handleWardrobeSelect(item)}
                                    >
                                        <Text style={styles.dropdownItemText}>
                                            {item === "other" ? "➕ Other (Create New)" : item}
                                        </Text>
                                        {item === "other" && (
                                            <Ionicons
                                                name="add-circle-outline"
                                                size={20}
                                                color="#A855F7"
                                            />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />

                        )}
                    </View>
                </View>
            </Modal>
        </ScrollView>
        </AppBackground>
    );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, paddingTop: 0 },
    header: {
        flexDirection: "row",
        marginBottom: 16,
        marginTop: 15,

    },
    removeIcon: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "#fff",
        borderRadius: 12,
    },
    title: { fontSize: 18, fontWeight: "700", color: "#333", paddingLeft: 15 },
    uploadBox: {
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "#E5E7EB",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        marginBottom: 20,
         backgroundColor: "#ffffff91",
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#A855F7",
        justifyContent: "center",
        alignItems: "center",
    },
    uploadTitle: { fontWeight: "700", marginTop: 10, fontSize: 16, color: "#333" },
    uploadSub: { fontSize: 12, color: "#777", textAlign: "center" },
    actionRow: { flexDirection: "row", marginTop: 12 },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F3E8FF",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        marginHorizontal: 6,
    },
    actionText: { marginLeft: 6, fontWeight: "600", color: "#A855F7" },
    preview: { width: 180, height: 180, borderRadius: 16 },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 6,
        color: "#333",
    },
    input: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 14,
        padding: 14,
        backgroundColor: "#fff",
        fontSize: 16,
        color: "#333",
    },
    dropdownTrigger: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 14,
        padding: 14,
        backgroundColor: "#fff",
    },
    categoryCard: {
        width: 90,
        alignItems: "center",
        marginRight: 12,
    },

    categoryIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#F3E8FF",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 6,
    },

    categoryIcon: {
        width: 36,
        height: 36,
        resizeMode: "contain",
    },

    categoryCardText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#333",
        textAlign: "center",
    },

    dropdownTextSelected: {
        fontSize: 16,
        color: "#000",
    },
    dropdownTextPlaceholder: {
        fontSize: 16,
        color: "#999",
    },
    visibilityRow: { flexDirection: "row" },
    visibilityBtn: {
        paddingVertical: 12,
        paddingHorizontal: 22,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginRight: 10,
    },
    activeVisibility: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
    submitBtn: {
        backgroundColor: "#A855F7",
        padding: 16,
        borderRadius: 30,
        alignItems: "center",
        marginVertical: 20,
    },
    submitBtnDisabled: {
        backgroundColor: "#C4B5FD",
        opacity: 0.7,
    },
    submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },

    // Custom Category Styles
    customCategoryContainer: {
        marginBottom: 20,
        padding: 16,
        backgroundColor: "#FAF5FF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    createCategoryBtn: {
        marginVertical: 12,
        backgroundColor: "#10B981",
    },
    cancelBtn: {
        alignItems: "center",
        padding: 12,
    },
    cancelBtnText: {
        color: "#6B7280",
        fontWeight: "600",
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "80%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
    },
    modalScrollView: {
        paddingBottom: 16,
    },

    // Search Styles
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: "#333",
        padding: 0,
    },
    searchResultsContainer: {
        paddingHorizontal: 16,
    },
    searchResultsTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
        marginBottom: 12,
        marginTop: 8,
    },
    searchResultItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    searchResultText: {
        fontSize: 16,
        color: "#333",
    },

    // Category Section Styles
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        paddingTop: 16,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    sectionCount: {
        fontSize: 12,
        color: "#666",
        backgroundColor: "#F3E8FF",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    sectionContent: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 8,
        paddingHorizontal: 16,
    },
    categoryChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: "500",
    },

    // Dropdown Item Styles
    dropdownItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    categoryItemContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    dropdownItemText: {
        fontSize: 16,
        color: "#333",
    },
    categoryBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    categoryBadgeText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "bold",
    },

    // Delete Icon Styles
    deleteIcon: {
        marginLeft: 8,
    },
    chipDeleteIcon: {
        marginLeft: 4,
    },

    // Other Option Styles
    otherOption: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: "#FAF5FF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    otherIconContainer: {
        marginRight: 12,
    },
    otherTextContainer: {
        flex: 1,
    },
    otherOptionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
        marginBottom: 2,
    },
    otherOptionSubtitle: {
        fontSize: 14,
        color: "#666",
    },

    // Loading and Empty States
    loadingContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#666",
    },
    loadingIndicator: {
        padding: 40,
    },
    emptyList: {
        alignItems: "center",
        padding: 40,
    },
    emptyListText: {
        fontSize: 16,
        color: "#666",
        marginTop: 12,
        fontWeight: "600",
    },
    emptyListSubText: {
        fontSize: 14,
        color: "#999",
        marginTop: 4,
    },
    noResultsContainer: {
        alignItems: "center",
        padding: 40,
    },
    noResultsText: {
        fontSize: 16,
        color: "#666",
        marginTop: 12,
        fontWeight: "600",
    },
    noResultsSubText: {
        fontSize: 14,
        color: "#999",
        marginTop: 4,
    }
    ,
});