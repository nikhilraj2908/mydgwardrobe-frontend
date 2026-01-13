import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import api from "../api/api";
import { useAuth } from "./AuthContext";
type FollowContextType = {
  followingIds: Set<string>;
  isFollowing: (userId: string) => boolean;
  toggleFollow: (userId: string) => Promise<void>;
  ready: boolean;          // 🔥 IMPORTANT
  clearFollowing: () => void;
};

const FollowContext = createContext<FollowContextType | null>(null);

export const FollowProvider = ({ children }: { children: React.ReactNode }) => {
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
const { isAuthenticated, isLoading } = useAuth();
  const loadFollowing = useCallback(async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      setFollowingIds(new Set());
      return;
    }

    const res = await api.get("/api/follow/my", {
      headers: { Authorization: `Bearer ${token}` },
    });

    setFollowingIds(new Set(res.data.following || []));
  } catch {
    setFollowingIds(new Set());
  } finally {
    setReady(true);
  }
}, []);


useEffect(() => {
  // ⛔ WAIT until auth is fully restored
  if (isLoading) return;

  // 👤 Not logged in
  if (!isAuthenticated) {
    setFollowingIds(new Set());
    setReady(true);
    return;
  }

  // 👤 Logged in → fetch follow list
  setReady(false);
  loadFollowing();

}, [isLoading, isAuthenticated, loadFollowing]);

  const isFollowing = useCallback(
    (userId: string) => followingIds.has(userId),
    [followingIds]
  );

  const toggleFollow = async (userId: string) => {
    setFollowingIds(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await api.post(
        "/api/follow/toggle",
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFollowingIds(prev => {
        const next = new Set(prev);
        res.data.following ? next.add(userId) : next.delete(userId);
        return next;
      });
    } catch {
      // rollback
      setFollowingIds(prev => {
        const next = new Set(prev);
        next.has(userId) ? next.delete(userId) : next.add(userId);
        return next;
      });
    }
  };

  const clearFollowing = () => {
    setFollowingIds(new Set());
    setReady(false);
  };

  return (
    <FollowContext.Provider
      value={{
        followingIds,
        isFollowing,
        toggleFollow,
        ready,
        clearFollowing,
      }}
    >
      {children}
    </FollowContext.Provider>
  );
};

export const useFollow = () => {
  const ctx = useContext(FollowContext);
  if (!ctx) throw new Error("useFollow must be inside FollowProvider");
  return ctx;
};
