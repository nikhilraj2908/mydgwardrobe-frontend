import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

interface SavedContextType {
  savedItemIds: string[];
  toggleSave: (itemId: string) => Promise<void>;
  refreshSaved: () => Promise<void>;
  resetSaved: () => void; 
   reloadUser: () => Promise<void>;  
  isReady: boolean;
}

const SavedItemsContext = createContext<SavedContextType | null>(null);
export const SavedItemsProvider = ({ children }: { children: React.ReactNode }) => {
  const [savedMap, setSavedMap] = useState<Record<string, string[]>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  /* -----------------------------------
     LOAD USER FROM BACKEND
  ----------------------------------- */
  const loadCurrentUser = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setCurrentUserId(null);
        return;
      }

      const res = await api.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCurrentUserId(res.data.user._id);
    } catch {
      setCurrentUserId(null);
    }
  };

  /* -----------------------------------
     EXPOSED RELOAD
  ----------------------------------- */
  const reloadUser = async () => {
    await loadCurrentUser();
  };

  /* -----------------------------------
     RESET ON LOGOUT
  ----------------------------------- */
  const resetSaved = () => {
    setCurrentUserId(null);
    setSavedMap({}); // ✅ optional but recommended
  };

  /* -----------------------------------
     FETCH SAVED ITEMS
  ----------------------------------- */
  const refreshSaved = async () => {
    if (!currentUserId) return;

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/api/saved/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ids = res.data.map((s: any) =>
        typeof s.item === "string" ? s.item : s.item._id
      );

      setSavedMap(prev => ({
        ...prev,
        [currentUserId]: ids,
      }));
    } catch (err) {
      console.log("Refresh saved failed", err);
    }
  };

  /* -----------------------------------
     TOGGLE SAVE
  ----------------------------------- */
  const toggleSave = async (itemId: string) => {
    if (!currentUserId) return;

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      setSavedMap(prev => {
        const userItems = prev[currentUserId] || [];
        return {
          ...prev,
          [currentUserId]: userItems.includes(itemId)
            ? userItems.filter(id => id !== itemId)
            : [...userItems, itemId],
        };
      });

      await api.post(
        `/api/saved/toggle/${itemId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.log("Toggle save failed", err);
      refreshSaved();
    }
  };

  /* -----------------------------------
     INIT
  ----------------------------------- */
  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      refreshSaved();
    }
  }, [currentUserId]);

  const savedItemIds = currentUserId ? savedMap[currentUserId] || [] : [];
  const isReady = Boolean(currentUserId);

  return (
    <SavedItemsContext.Provider
      value={{
        savedItemIds,
        toggleSave,
        refreshSaved,
        resetSaved,
        reloadUser,
        isReady,
      }}
    >
      {children}
    </SavedItemsContext.Provider>
  );
};

export const useSavedItems = () => {
  const ctx = useContext(SavedItemsContext);
  if (!ctx) throw new Error("useSavedItems must be used inside SavedItemsProvider");
  return ctx;
};
