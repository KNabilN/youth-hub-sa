import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "admin_list_highlight";

interface HighlightData {
  id: string;
  scrollY: number;
  listKey: string;
  page: number;
}

export function useListHighlight(listKey: string) {
  const navigate = useNavigate();

  const saveAndNavigate = useCallback(
    (itemId: string, path: string, page: number = 0) => {
      const data: HighlightData = {
        id: itemId,
        scrollY: window.scrollY,
        listKey,
        page,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      navigate(path);
    },
    [navigate, listKey],
  );

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const data: HighlightData = JSON.parse(raw);
      if (data.listKey !== listKey) return;

      sessionStorage.removeItem(STORAGE_KEY);

      // Wait for DOM to render (longer delay to allow pagination data to load)
      const timer = setTimeout(() => {
        const el = document.getElementById(`row-${data.id}`);
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "smooth" });
          el.classList.add("row-highlight");
          setTimeout(() => el.classList.remove("row-highlight"), 2500);
        } else {
          window.scrollTo({ top: data.scrollY, behavior: "smooth" });
        }
      }, 300);

      return () => clearTimeout(timer);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [listKey]);

  return { saveAndNavigate };
}

/** Read saved page for a listKey without consuming the data */
export function getSavedPage(listKey: string): number {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const data: HighlightData = JSON.parse(raw);
    if (data.listKey !== listKey) return 0;
    return data.page ?? 0;
  } catch {
    return 0;
  }
}
