import { useTheme } from "@/app/theme/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import ImagePicker from "react-native-image-crop-picker";

import AppBackground from "@/components/AppBackground";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../api/api";

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
    ],
    womens: [
        "Tops", "Blouses", "T-Shirts", "Shirts", "Jeans", "Trousers", "Leggings",
        "Skirts", "Dresses", "Gowns", "Jackets", "Blazers", "Sweaters", "Cardigans",
        "Hoodies", "Suits", "Formal Wear", "Casual Wear", "Sportswear", "Lingerie",
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
        tshirts: require("../../assets/categories/mens/T-Shirts.png"),
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
        tshirts: require("../../assets/categories/womens/Tshirt.png"),
        vests: require("../../assets/categories/womens/Vest.png"),
        tops: require("../../assets/categories/womens/Top.png"),
        skirts: require("../../assets/categories/womens/Skirt.png"),
    },
    unisex: {},
};

const normalizeCategoryKey = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]/g, "");

export default function AddWardrobe() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    type ImageItem = {
        uri: string;
        isRemote: boolean;
        fileName?: string | null;
        mimeType?: string;
    };
    const { theme } = useTheme();
    const colors = theme.colors;
    const SERVER = "https://api.digiwardrobe.com";
    const [images, setImages] = useState<ImageItem[]>([]);
    const [category, setCategory] = useState("");
    const [customCategory, setCustomCategory] = useState("");
    const [categoryType, setCategoryType] = useState<"mens" | "womens" | "unisex">("unisex");
    const [wardrobe, setWardrobe] = useState("");
    const [customWardrobe, setCustomWardrobe] = useState("");
    const [price, setPrice] = useState("");
    const [brand, setBrand] = useState("");
    const [visibility, setVisibility] = useState<"public" | "private">("private");
    const [accessLevel, setAccessLevel] = useState<"normal" | "premium">("normal");
    const [useBgRemoval, setUseBgRemoval] = useState(false);
    const [loading, setLoading] = useState(false);

    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showWardrobeDropdown, setShowWardrobeDropdown] = useState(false);
    const [userWardrobes, setUserWardrobes] = useState<string[]>([]);
    const [loadingWardrobes, setLoadingWardrobes] = useState(false);
    const [showOtherWardrobeInput, setShowOtherWardrobeInput] = useState(false);
    const [showOtherCategoryInput, setShowOtherCategoryInput] = useState(false);

    const [loadingCategories, setLoadingCategories] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [description, setDescription] = useState("");
    const [exploreCategories, setExploreCategories] = useState<Category[]>([]);
    const [userCategories, setUserCategories] = useState<Category[]>([]);
    const params = useLocalSearchParams();
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const mode = (params.mode as "create" | "edit") || "create";
    const itemId = params.itemId as string | undefined;
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    const isEdit = mode === "edit" && !!itemId;

    useFocusEffect(
        useCallback(() => {
            return () => {
                if (!isEdit) {
                    resetForm();
                }
            };
        }, [isEdit])
    );

    useEffect(() => {
        if (params.editedUri) {
            setImages(prev => [
                ...prev,
                {
                    uri: params.editedUri as string,
                    isRemote: false,
                    fileName: `edited_${Date.now()}.jpg`,
                    mimeType: "image/jpeg",
                },
            ]);
        }
    }, [params.editedUri]);

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

                if (item.category && typeof item.category === "object") {
                    setSelectedCategory(item.category);
                    setCategory(item.category.name);
                    setCategoryType(item.category.type);
                }

                setWardrobe(
                    typeof item.wardrobe === "string"
                        ? item.wardrobe
                        : item.wardrobe?.name || ""
                );
                setPrice(item.price ? String(item.price) : "");
                setBrand(item.brand || "");
                setVisibility(item.visibility || "public");
                setDescription(item.description || "");
                setAccessLevel(item.accessLevel || "normal");

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
        if (item.type === "mens" && CATEGORY_ICONS.mens[key]) return CATEGORY_ICONS.mens[key];
        if (item.type === "womens" && CATEGORY_ICONS.womens[key]) return CATEGORY_ICONS.womens[key];
        return null;
    };

    const CategoryCard = ({ item }: { item: Category }) => {
        const icon = getCategoryIcon(item);
        return (
            <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => handleCategorySelect(item)}
                onLongPress={() => {
                    if (userCategories.some(c => c._id === item._id)) {
                        handleDeleteCategory(item._id);
                    }
                }}
            >
                <View style={styles.categoryIconWrap}>
                    {icon ? (
                        <Image source={icon} style={styles.categoryIcon} />
                    ) : (
                        <Ionicons name="shirt-outline" size={28} color={colors.primary} />
                    )}
                </View>
                <Text style={styles.categoryCardText} numberOfLines={1}>
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    };

    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const token = await AsyncStorage.getItem("token");
            const [exploreRes, userRes] = await Promise.all([
                api.get("/api/categories"),
                api.get("/api/categories/user", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);
            setExploreCategories(exploreRes.data || []);
            setUserCategories(userRes.data || []);
            setFilteredCategories([
                ...(exploreRes.data || []),
                ...(userRes.data || []),
            ]);
        } catch (err) {
            console.error("FETCH CATEGORY ERROR:", err);
        } finally {
            setLoadingCategories(false);
        }
    };

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
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data) {
                await fetchCategories();
                return response.data.category || response.data;
            }
        } catch (error: any) {
            console.error("Error creating category:", error);
            if (error.response?.status === 409) {
                Alert.alert("Category exists", "This category already exists.");
            } else {
                Alert.alert("Error", error.response?.data?.message || "Failed to create category");
            }
            return null;
        }
    };

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
                            await api.delete(`/api/categories/${categoryId}`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            setExploreCategories(prev => prev.filter(cat => cat._id !== categoryId));
                            setUserCategories(prev => prev.filter(cat => cat._id !== categoryId));
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

    useEffect(() => {
        fetchUserWardrobes();
        fetchCategories();
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

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim() === "") {
            setFilteredCategories([...exploreCategories, ...userCategories]);
        } else {
            const allCategories = [...exploreCategories, ...userCategories];
            const filtered = allCategories.filter(cat =>
                cat.name.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredCategories(filtered);
        }
    };

    const MAX_IMAGES = 5;

    const pickFromGallery = async () => {
        try {
            if (images.length >= MAX_IMAGES) {
                Alert.alert("Limit reached", `You can upload only ${MAX_IMAGES} images.`);
                return;
            }
            const selected = await ImagePicker.openPicker({
                multiple: true,
                cropping: false,
                mediaType: "photo",
            });
            const arr = Array.isArray(selected) ? selected : [selected];
            const remaining = MAX_IMAGES - images.length;
            const limited = arr.slice(0, remaining);
            const croppedImages = [];
            for (const img of limited) {
                const cropped = await ImagePicker.openCropper({
                    path: img.path,
                    mediaType: "photo",
                    freeStyleCropEnabled: true,
                    enableRotationGesture: true,
                    compressImageQuality: 0.6,
                });
                croppedImages.push({
                    uri: cropped.path,
                    isRemote: false,
                    fileName: cropped.filename || cropped.path.split("/").pop() || `gallery_${Date.now()}.jpg`,
                    mimeType: cropped.mime || "image/jpeg",
                });
            }
            setImages(prev => [...prev, ...croppedImages]);
        } catch (err: any) {
            if (err.code !== "E_PICKER_CANCELLED") {
                console.log("Gallery error:", err);
            }
        }
    };

    const normalizeImageUrl = (path: string) => {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        return `https://digiwardrobe.s3.ap-south-1.amazonaws.com/${path}`;
    };

    const pickFromCamera = async () => {
        try {
            if (images.length >= 5) {
                Alert.alert("Limit reached", "You can upload only 5 images.");
                return;
            }
            const img = await ImagePicker.openCamera({
                cropping: true,
                freeStyleCropEnabled: true,
                enableRotationGesture: true,
                compressImageQuality: 0.6,
            });
            setImages(prev => [
                ...prev,
                {
                    uri: img.path,
                    isRemote: false,
                    fileName: img.filename || img.path.split("/").pop() || `camera_${Date.now()}.jpg`,
                    mimeType: img.mime || "image/jpeg",
                },
            ]);
        } catch (err: any) {
            if (err.code !== "E_PICKER_CANCELLED") {
                console.log("Camera error:", err);
            }
        }
    };

    const resetForm = () => {
        setImages([]);
        setCategory("");
        setCustomCategory("");
        setCategoryType("unisex");
        setWardrobe("");
        setCustomWardrobe("");
        setPrice("");
        setBrand("");
        setDescription("");
        setVisibility("private");
        setShowOtherCategoryInput(false);
        setShowOtherWardrobeInput(false);
        setSearchQuery("");
    };

    const handleCategorySelect = (item: Category | "other") => {
        if (item === "other") {
            setShowOtherCategoryInput(true);
            setCategory("");
            setSelectedCategory(null);
            setShowCategoryDropdown(false);
            return;
        }
        setSelectedCategory(item);
        setCategory(item.name);
        setCategoryType(item.type);
        setShowOtherCategoryInput(false);
        setShowCategoryDropdown(false);
    };

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

    const handleSubmit = async () => {
        let finalCategory = category;
        if (showOtherCategoryInput && customCategory) {
            const newCategory = await createNewCategory(customCategory, categoryType);
            if (!newCategory) return;
            setSelectedCategory(newCategory);
            finalCategory = newCategory._id;
        }
        const finalWardrobe = showOtherWardrobeInput && customWardrobe ? customWardrobe : wardrobe;
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

            if (isEdit) {
                const existingImages = images.filter(img => img.isRemote);
                const newImages = images.filter(img => !img.isRemote);

                if (existingImages.length > 0) {
                    const existingPaths = existingImages.map((img) => {
                        let path = img.uri;
                        if (path.includes("s3.ap-south-1.amazonaws.com")) {
                            const urlParts = path.split('.com/');
                            if (urlParts.length > 1) path = urlParts[1];
                        } else if (path.startsWith(SERVER)) {
                            path = path.replace(SERVER, "");
                            if (path.startsWith("/")) path = path.substring(1);
                        }
                        return path;
                    });
                    formData.append("existingImages", JSON.stringify(existingPaths));
                }

                newImages.forEach((img, index) => {
                    const cleanUri = Platform.OS === "ios" ? img.uri.replace("file://", "") : img.uri;
                    formData.append("images", {
                        uri: cleanUri,
                        name: img.fileName || `wardrobe_${Date.now()}_${index}.jpg`,
                        type: img.mimeType || "image/jpeg",
                    } as any);
                });
            } else {
                images.forEach((img, index) => {
                    const cleanUri = Platform.OS === "ios" ? img.uri.replace("file://", "") : img.uri;
                    formData.append("images", {
                        uri: cleanUri,
                        name: img.fileName || `wardrobe_${Date.now()}_${index}.jpg`,
                        type: img.mimeType || "image/jpeg",
                    } as any);
                });
            }

            if (!selectedCategory) {
                Alert.alert("Error", "Please select a valid category");
                return;
            }

            formData.append("category", selectedCategory._id);
            formData.append("categoryType", selectedCategory.type);
            formData.append("wardrobe", finalWardrobe);
            formData.append("price", price || "0");
            formData.append("brand", brand);
            formData.append("visibility", visibility);
            formData.append("accessLevel", accessLevel);
            formData.append("gender", selectedCategory.type);
            if (description.trim()) formData.append("description", description.trim());

            let url, method;
            if (isEdit && itemId) {
                url = `${SERVER}/api/wardrobe/item/${itemId}`;
                method = "PUT";
            } else {
                url = `${SERVER}/api/wardrobe/add`;
                method = "POST";
            }

            const response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Server error: ${response.status}`;
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.message) errorMessage = errorData.message;
                    else if (errorData.error) errorMessage = errorData.error;
                } catch (e) {}
                throw new Error(errorMessage);
            }

            const data = await response.json();
            Alert.alert(
                "Success",
                isEdit ? "Item updated successfully!" : "Item added successfully!",
                [
                    {
                        text: "OK",
                        onPress: async () => {
                            await fetchUserWardrobes();
                            resetForm();
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace("/home");
                            }
                        },
                    },
                ]
            );
        } catch (err: any) {
            console.error("❌ Upload error details:", err);
            let errorMessage = err.message || "Something went wrong. Please try again.";
            if (err.message.includes("Invalid existingImages format")) {
                errorMessage = "Image format error. Please try removing and re-adding images.";
            } else if (err.message.includes("500") || err.message.includes("Server error")) {
                errorMessage = "Server error. Please try again in a few moments.";
            }
            Alert.alert("Error", errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const renderCategoryItem = ({ item }: { item: Category }) => (
        <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => handleCategorySelect(item)}
            onLongPress={() => {
                if (userCategories.some(c => c._id === item._id)) {
                    handleDeleteCategory(item._id);
                }
            }}
        >
            <View style={styles.categoryItemContent}>
                <Text style={styles.dropdownItemText}>{item.name}</Text>
                {!item._id.startsWith('default-') && (
                    <Ionicons name="trash-outline" size={16} color={colors.danger} style={styles.deleteIcon} />
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

    const handleCreateCustomCategory = async () => {
        if (!customCategory.trim()) {
            Alert.alert("Error", "Please enter a category name");
            return;
        }
        const newCategory = await createNewCategory(customCategory, categoryType);
        if (newCategory) {
            setSelectedCategory(newCategory);
            setCategory(newCategory.name);
            setCategoryType(newCategory.type);
            Alert.alert("Success", "Category created successfully!");
            setShowOtherCategoryInput(false);
        }
    };

    return (
        <AppBackground>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => {
                        if (router.canGoBack()) router.back();
                        else router.replace("/home");
                    }}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.title}>{isEdit ? "Edit Item" : "Add to Wardrobe"}</Text>
                    <View style={{ width: 24 }} />
                </View>

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
                                        <Ionicons name="close-circle" size={22} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    ) : (
                        <>
                            <View style={styles.iconCircle}>
                                <Ionicons name="camera-outline" size={26} color="#ffffff" />
                            </View>
                            <Text style={styles.uploadTitle}>Tap to Add Photo</Text>
                            <Text style={styles.uploadSub}>Take a photo or choose from gallery</Text>
                        </>
                    )}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={pickFromCamera}>
                            <Ionicons name="camera-outline" size={16} color={colors.primary} />
                            <Text style={styles.actionText}>Camera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={pickFromGallery}>
                            <Ionicons name="image-outline" size={16} color={colors.primary} />
                            <Text style={styles.actionText}>Gallery</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Category *</Text>
                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        onPress={() => setShowCategoryDropdown(true)}
                    >
                        <Text style={category || showOtherCategoryInput ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                            {showOtherCategoryInput ? "Other (type below)" : category || "Select Category"}
                        </Text>
                        <Ionicons name="chevron-down-outline" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {showOtherCategoryInput && (
                    <View style={styles.customCategoryContainer}>
                        <Text style={styles.inputLabel}>Create New Category *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter custom category name"
                            placeholderTextColor={colors.textMuted}
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
                                            color: categoryType === type ? colors.primaryDark : colors.textPrimary,
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

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Wardrobe *</Text>
                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        onPress={() => setShowWardrobeDropdown(true)}
                    >
                        <Text style={wardrobe ? styles.dropdownTextSelected : styles.dropdownTextPlaceholder}>
                            {showOtherWardrobeInput ? "Other (type below)" : wardrobe || "Select Wardrobe"}
                        </Text>
                        <Ionicons name="chevron-down-outline" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {showOtherWardrobeInput && (
                    <TextInput
                        style={styles.input}
                        placeholder="Enter new wardrobe name"
                        placeholderTextColor={colors.textMuted}
                        value={customWardrobe}
                        onChangeText={setCustomWardrobe}
                    />
                )}

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Price (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter price"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="numeric"
                        value={price}
                        onChangeText={setPrice}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Brand (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter brand name"
                        placeholderTextColor={colors.textMuted}
                        value={brand}
                        onChangeText={setBrand}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Description (Optional)</Text>
                    <TextInput
                        style={[styles.input, { height: 100 }]}
                        placeholder="Describe this item (fit, fabric, front/back, styling tips...)"
                        placeholderTextColor={colors.textMuted}
                        multiline
                        value={description}
                        onChangeText={setDescription}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Visibility</Text>
                    <View style={styles.visibilityRow}>
                        <TouchableOpacity
                            style={[
                                styles.visibilityBtn,
                                visibility === "private" && styles.activeVisibility,
                            ]}
                            onPress={() => {
                                setVisibility("private");
                                setAccessLevel("normal");
                            }}
                        >
                            <Text
                                style={{
                                    color: visibility === "private" ? colors.textPrimary : colors.textPrimary,
                                    fontWeight: "500",
                                }}
                            >
                                PRIVATE
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.visibilityBtn,
                                visibility === "public" && accessLevel === "normal" && styles.activeVisibility,
                            ]}
                            onPress={() => {
                                setVisibility("public");
                                setAccessLevel("normal");
                            }}
                        >
                            <Text
                                style={{
                                    color: visibility === "public" && accessLevel === "normal"
                                        ? colors.textPrimary
                                        : colors.textPrimary,
                                    fontWeight: "500",
                                }}
                            >
                                PUBLIC
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.visibilityBtn,
                                visibility === "public" && accessLevel === "premium" && styles.activeVisibility,
                            ]}
                            onPress={() => {
                                setVisibility("public");
                                setAccessLevel("premium");
                            }}
                        >
                            <Text
                                style={{
                                    color: visibility === "public" && accessLevel === "premium"
                                        ? colors.textPrimary
                                        : colors.textPrimary,
                                    fontWeight: "500",
                                }}
                            >
                                PREMIUM
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.primaryDark} />
                    ) : (
                        <Text style={styles.submitText}>{isEdit ? "Update Item" : "Add to Wardrobe"}</Text>
                    )}
                </TouchableOpacity>

                <Modal
                    visible={showCategoryDropdown}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowCategoryDropdown(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { paddingBottom: insets.bottom || 16 }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Category</Text>
                                <TouchableOpacity onPress={() => setShowCategoryDropdown(false)}>
                                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.searchContainer}>
                                <Ionicons name="search-outline" size={20} color={colors.textMuted} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search categories..."
                                    placeholderTextColor={colors.textMuted}
                                    value={searchQuery}
                                    onChangeText={handleSearch}
                                    autoCapitalize="none"
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => handleSearch("")}>
                                        <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            {loadingCategories ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={styles.loadingText}>Loading categories...</Text>
                                </View>
                            ) : (
                                <ScrollView style={styles.modalScrollView}>
                                    {searchQuery.length > 0 ? (
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
                                                            if (userCategories.some(c => c._id === item._id)) {
                                                                handleDeleteCategory(item._id);
                                                            }
                                                        }}
                                                    >
                                                        <View style={styles.categoryItemContent}>
                                                            <Text style={styles.searchResultText}>{item.name}</Text>
                                                            {!item._id.startsWith('default-') && (
                                                                <Ionicons name="trash-outline" size={16} color={colors.danger} style={styles.deleteIcon} />
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
                                                    <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                                                    <Text style={styles.noResultsText}>No categories found</Text>
                                                    <Text style={styles.noResultsSubText}>Try a different search term</Text>
                                                </View>
                                            )}
                                        </View>
                                    ) : (
                                        <>
                                            {renderCategorySection("Explore – Men", exploreCategories, "mens")}
                                            {renderCategorySection("Explore – Women", exploreCategories, "womens")}
                                            {userCategories.length > 0 && (
                                                <>
                                                    {renderCategorySection("Others", userCategories, "mens")}
                                                    {renderCategorySection("Others", userCategories, "womens")}
                                                </>
                                            )}
                                            {exploreCategories.filter(cat => cat.type === 'unisex').length > 0 && (
                                                renderCategorySection("Unisex Categories", exploreCategories, 'unisex')
                                            )}
                                        </>
                                    )}
                                    <TouchableOpacity
                                        key="other-category-option"
                                        style={styles.otherOption}
                                        onPress={() => handleCategorySelect("other")}
                                    >
                                        <View style={styles.otherIconContainer}>
                                            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                                        </View>
                                        <View style={styles.otherTextContainer}>
                                            <Text style={styles.otherOptionTitle}>Other</Text>
                                            <Text style={styles.otherOptionSubtitle}>Create custom category</Text>
                                        </View>
                                        <Ionicons name="chevron-forward-outline" size={20} color={colors.textMuted} />
                                    </TouchableOpacity>
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </Modal>

                <Modal
                    visible={showWardrobeDropdown}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowWardrobeDropdown(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, { paddingBottom: insets.bottom || 16 }]}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Wardrobe</Text>
                                <TouchableOpacity onPress={() => setShowWardrobeDropdown(false)}>
                                    <Ionicons name="close" size={24} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>
                            {loadingWardrobes ? (
                                <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />
                            ) : (
                                <FlatList
                                    data={[...userWardrobes, "other"]}
                                    keyExtractor={(item) => item}
                                    contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.dropdownItem}
                                            onPress={() => handleWardrobeSelect(item)}
                                        >
                                            <Text style={styles.dropdownItemText}>
                                                {item === "other" ? "➕ Other (Create New)" : item}
                                            </Text>
                                            {item === "other" && (
                                                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
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

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      paddingTop: 0,
    },
    header: {
      flexDirection: "row",
      marginBottom: 16,
         alignItems: "center",
      justifyContent: "space-between",
    },
    removeIcon: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: colors.primaryDark,
      borderRadius: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      paddingLeft: 15,
    },
    uploadBox: {
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
      borderRadius: 20,
      padding: 20,
      alignItems: "center",
      marginBottom: 20,
      backgroundColor: colors.card,
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    uploadTitle: {
      fontWeight: "700",
      marginTop: 10,
      fontSize: 16,
      color: colors.textPrimary,
    },
    uploadSub: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: "center",
    },
    actionRow: {
      flexDirection: "row",
      marginTop: 12,
    },
    actionBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      marginHorizontal: 6,
    },
    actionText: {
      marginLeft: 6,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    preview: {
      width: 180,
      height: 180,
      borderRadius: 16,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 6,
      color: colors.textSecondary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.lightborder,
      borderRadius: 14,
      padding: 14,
      fontSize: 16,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
    },
    dropdownTrigger: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.lightborder,
      borderRadius: 14,
      padding: 14,
      backgroundColor: colors.surface,
    },
    dropdownTextSelected: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    dropdownTextPlaceholder: {
      fontSize: 16,
      color: colors.textMuted,
    },
    visibilityRow: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    visibilityBtn: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 10,
      marginBottom: 8,
      backgroundColor: colors.surface,
    },
    activeVisibility: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      color:colors.textPrimary
    },
    submitBtn: {
      backgroundColor: colors.addButton || colors.primary,
      padding: 16,
      borderRadius: 30,
      alignItems: "center",
      marginVertical: 20,
    },
    submitBtnDisabled: {
      backgroundColor: colors.middary,
      opacity: 0.7,
    },
    submitText: {
      color: colors.textPrimary,
      fontWeight: "700",
      fontSize: 16,
    },
    customCategoryContainer: {
      marginBottom: 20,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    createCategoryBtn: {
      marginVertical: 12,
      backgroundColor: colors.success,
    },
    cancelBtn: {
      alignItems: "center",
      padding: 12,
    },
    cancelBtnText: {
      color: colors.textMuted,
      fontWeight: "600",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.surface,
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
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
    },
    modalScrollView: {
      paddingBottom: 16,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      marginHorizontal: 16,
      marginVertical: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      color: colors.textPrimary,
      padding: 0,
    },
    searchResultsContainer: {
      paddingHorizontal: 16,
    },
    searchResultsTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textMuted,
      marginBottom: 12,
      marginTop: 8,
    },
    searchResultItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchResultText: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      paddingTop: 16,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sectionHeaderText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
    },
    sectionCount: {
      fontSize: 12,
      color: colors.textPrimary,
      backgroundColor: colors.card,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
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
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    categoryChipText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textPrimary,
    },
    dropdownItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryItemContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    dropdownItemText: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    categoryBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    categoryBadgeText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "bold",
    },
    deleteIcon: {
      marginLeft: 8,
    },
    chipDeleteIcon: {
      marginLeft: 4,
    },
    otherOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.textPrimary,
      marginBottom: 2,
    },
    otherOptionSubtitle: {
      fontSize: 14,
      color: colors.textMuted,
    },
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textMuted,
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
      color: colors.textMuted,
      marginTop: 12,
      fontWeight: "600",
    },
    emptyListSubText: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 4,
    },
    noResultsContainer: {
      alignItems: "center",
      padding: 40,
    },
    noResultsText: {
      fontSize: 16,
      color: colors.textMuted,
      marginTop: 12,
      fontWeight: "600",
    },
    noResultsSubText: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 4,
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
      backgroundColor: colors.card,
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
      color: colors.textSecondary,
      textAlign: "center",
    },
  });