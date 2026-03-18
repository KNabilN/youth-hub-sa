import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type CartItemWithService = {
  id: string;
  user_id: string;
  service_id: string;
  quantity: number;
  created_at: string;
  micro_services: {
    id: string;
    title: string;
    price: number;
    description: string;
    image_url: string | null;
    service_type: string;
    provider_id: string;
    profiles: { full_name: string } | null;
  };
};

export function useCartItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cart", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, micro_services(id, title, price, description, image_url, service_type, provider_id, profiles:provider_id(full_name))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Filter out items where the service is not accessible (e.g. suspended/deleted)
      return ((data ?? []) as unknown as any[]).filter(
        (item) => item.micro_services !== null
      ) as CartItemWithService[];
    },
  });
}

export function useCartCount() {
  const { data } = useCartItems();
  return data?.length ?? 0;
}

export function useAddToCart() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (serviceId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("cart_items")
        .upsert({ user_id: user.id, service_id: serviceId, quantity: 1 }, { onConflict: "user_id,service_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cartItemId: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useUpdateCartQuantity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", cartItemId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

/** Sync guest cart service IDs into the DB cart */
export function useSyncGuestCart() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (serviceIds: string[]) => {
      if (!user || serviceIds.length === 0) return;
      const rows = serviceIds.map((sid) => ({
        user_id: user.id,
        service_id: sid,
        quantity: 1,
      }));
      const { error } = await supabase
        .from("cart_items")
        .upsert(rows, { onConflict: "user_id,service_id" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}
