import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";

interface SavedContextType {
  savedItemIds: string[];
  toggleSave: (itemId: string) => Promise<void>;
  refreshSaved: () => Promise<void>;
}

const SavedItemsContext = createContext<SavedContextType | null>(null);

export const SavedItemsProvider = ({ children }: { children: React.ReactNode }) => {
  const [savedItemIds, setSavedItemIds] = useState<string[]>([]);

  const refreshSaved = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await api.get("/api/saved/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ids = res.data.map((s: any) =>
        typeof s.item === "string" ? s.item : s.item._id
      );

      setSavedItemIds(ids);
    } catch (err) {
      console.log("Refresh saved failed", err);
    }
  };

  const toggleSave = async (itemId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      // Optimistic update
      setSavedItemIds(prev =>
        prev.includes(itemId)
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );

      await api.post(
        `/api/saved/toggle/${itemId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.log("Toggle save failed", err);
      refreshSaved(); // rollback safety
    }
  };

  useEffect(() => {
    refreshSaved();
  }, []);

  return (
    <SavedItemsContext.Provider value={{ savedItemIds, toggleSave, refreshSaved }}>
      {children}
    </SavedItemsContext.Provider>
  );
};

export const useSavedItems = () => {
  const ctx = useContext(SavedItemsContext);
  if (!ctx) throw new Error("useSavedItems must be used inside SavedItemsProvider");
  return ctx;
};
