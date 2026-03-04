import { useState, useCallback, useEffect } from "react";

export type GuestCartItem = {
  service_id: string;
  quantity: number;
  added_at: string;
};

const STORAGE_KEY = "guest_cart";

function readCart(): GuestCartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items: GuestCartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useGuestCart() {
  const [items, setItems] = useState<GuestCartItem[]>(readCart);

  // sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readCart());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const addItem = useCallback((serviceId: string) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.service_id === serviceId);
      const next = exists
        ? prev
        : [...prev, { service_id: serviceId, quantity: 1, added_at: new Date().toISOString() }];
      writeCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback((serviceId: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.service_id !== serviceId);
      writeCart(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback((serviceId: string, quantity: number) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.service_id === serviceId ? { ...i, quantity } : i));
      writeCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    writeCart([]);
    setItems([]);
  }, []);

  const count = items.length;

  return { items, addItem, removeItem, updateQuantity, clearCart, count };
}

/** Get raw guest cart items (non-hook, for syncing) */
export function getGuestCartItems(): GuestCartItem[] {
  return readCart();
}

export function clearGuestCart() {
  localStorage.removeItem(STORAGE_KEY);
}
