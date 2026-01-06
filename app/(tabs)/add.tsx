import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function AddTabRedirect() {
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => {
      router.push("/add-wardrobe");
    }, 0);

    return () => clearTimeout(id);
  }, []);

  return null;
}
