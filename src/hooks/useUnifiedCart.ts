import { useAuth } from "@/hooks/useAuth";
import { useCartItems, useAddToCart, useRemoveFromCart, useClearCart, useUpdateCartQuantity, useSyncGuestCart } from "@/hooks/useCart";
import { useGuestCart } from "@/hooks/useGuestCart";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export type UnifiedCartItem = {
  id: string; // cartItemId for DB, service_id for guest
  service_id: string;
  quantity: number;
  title: string;
  price: number;
  description: string;
  image_url: string | null;
  service_type: string;
  provider_id: string;
  provider_name: string | null;
};

/** Fetch service details for guest cart items */
function useGuestCartServices(serviceIds: string[]) {
  return useQuery({
    queryKey: ["guest-cart-services", serviceIds],
    enabled: serviceIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_services")
        .select("id, title, price, description, image_url, service_type, provider_id, profiles:provider_id(full_name)")
        .in("id", serviceIds);
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useUnifiedCart() {
  const { user, role } = useAuth();
  const isLoggedIn = !!user;

  // DB cart (only active when logged in)
  const { data: dbItems, isLoading: dbLoading } = useCartItems();
  const addToCartMut = useAddToCart();
  const removeFromCartMut = useRemoveFromCart();
  const clearCartMut = useClearCart();
  const updateQtyMut = useUpdateCartQuantity();
  const syncGuestMut = useSyncGuestCart();

  // Guest cart
  const guest = useGuestCart();
  const guestServiceIds = guest.items.map((i) => i.service_id);
  const { data: guestServices, isLoading: guestLoading } = useGuestCartServices(
    isLoggedIn ? [] : guestServiceIds
  );

  // Sync guest → DB on login
  const syncedRef = useRef(false);
  useEffect(() => {
    if (isLoggedIn && guest.items.length > 0 && !syncedRef.current) {
      syncedRef.current = true;
      syncGuestMut.mutate(guest.items.map((i) => i.service_id), {
        onSuccess: () => guest.clearCart(),
      });
    }
  }, [isLoggedIn, guest.items.length]);

  // Build unified items
  let items: UnifiedCartItem[] = [];
  let isLoading = false;

  if (isLoggedIn) {
    isLoading = dbLoading;
    items = (dbItems ?? []).map((item) => ({
      id: item.id,
      service_id: item.service_id,
      quantity: item.quantity,
      title: item.micro_services.title,
      price: item.micro_services.price,
      description: item.micro_services.description,
      image_url: item.micro_services.image_url,
      service_type: item.micro_services.service_type,
      provider_id: item.micro_services.provider_id,
      provider_name: item.micro_services.profiles?.full_name ?? null,
    }));
  } else {
    isLoading = guestLoading;
    items = guest.items
      .map((gi) => {
        const svc = guestServices?.find((s: any) => s.id === gi.service_id);
        if (!svc) return null;
        return {
          id: gi.service_id,
          service_id: gi.service_id,
          quantity: gi.quantity,
          title: svc.title,
          price: svc.price,
          description: svc.description,
          image_url: svc.image_url,
          service_type: svc.service_type,
          provider_id: svc.provider_id,
          provider_name: svc.profiles?.full_name ?? null,
        } as UnifiedCartItem;
      })
      .filter(Boolean) as UnifiedCartItem[];
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.length;

  const addItem = (serviceId: string) => {
    if (isLoggedIn) {
      addToCartMut.mutate(serviceId);
    } else {
      guest.addItem(serviceId);
    }
  };

  const removeItem = (id: string) => {
    if (isLoggedIn) {
      removeFromCartMut.mutate(id);
    } else {
      guest.removeItem(id);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (isLoggedIn) {
      updateQtyMut.mutate({ cartItemId: id, quantity });
    } else {
      guest.updateQuantity(id, quantity);
    }
  };

  const clearAll = () => {
    if (isLoggedIn) {
      clearCartMut.mutate();
    } else {
      guest.clearCart();
    }
  };

  const canPurchase = role === "youth_association" || role === "donor";

  return {
    items,
    isLoading,
    total,
    count,
    addItem,
    removeItem,
    updateQuantity,
    clearAll,
    isLoggedIn,
    canPurchase,
    isAdding: addToCartMut.isPending,
    isRemoving: removeFromCartMut.isPending,
    isClearing: clearCartMut.isPending,
  };
}
