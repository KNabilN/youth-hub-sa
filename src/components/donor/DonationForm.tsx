import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVerifiedAssociations } from "@/hooks/useVerifiedAssociations";

const donationSchema = z.object({
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  target_type: z.enum(["project", "service"]),
  target_id: z.string().min(1, "يرجى اختيار المشروع أو الخدمة"),
  association_id: z.string().optional(),
});

type DonationFormValues = z.infer<typeof donationSchema>;

export interface DonationFormData {
  amount: number;
  target_type: "project" | "service";
  target_id: string;
  target_title: string;
  provider_id?: string;
  association_id?: string;
  association_name?: string;
}

interface DonationFormProps {
  onSubmit: (values: DonationFormData) => void;
  isLoading?: boolean;
}

export function DonationForm({ onSubmit, isLoading }: DonationFormProps) {
  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: { amount: 0, target_type: "project", target_id: "", association_id: "" },
  });

  const targetType = form.watch("target_type");

  const { data: projects } = useQuery({
    queryKey: ["open-projects-for-donation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, association_id")
        .eq("status", "open")
        .eq("is_private", false);
      if (error) throw error;
      return data;
    },
  });

  const { data: services } = useQuery({
    queryKey: ["approved-services-for-donation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("micro_services")
        .select("id, title, provider_id, price")
        .eq("approval", "approved");
      if (error) throw error;
      return data;
    },
  });

  const { data: associations } = useVerifiedAssociations();

  const items = targetType === "project" ? projects : services;

  const handleSubmit = (values: DonationFormValues) => {
    const selectedItem = items?.find((i) => i.id === values.target_id);
    const selectedAssociation = associations?.find((a) => a.id === values.association_id);

    // For projects, get association_id from the project itself
    const associationId = targetType === "project"
      ? (selectedItem as any)?.association_id
      : values.association_id;

    const associationName = targetType === "project"
      ? associations?.find((a) => a.id === (selectedItem as any)?.association_id)?.organization_name || associations?.find((a) => a.id === (selectedItem as any)?.association_id)?.full_name
      : selectedAssociation?.organization_name || selectedAssociation?.full_name;

    onSubmit({
      amount: values.amount,
      target_type: values.target_type,
      target_id: values.target_id,
      target_title: selectedItem?.title || "",
      provider_id: values.target_type === "service" ? (selectedItem as any)?.provider_id : undefined,
      association_id: associationId || undefined,
      association_name: associationName || undefined,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem>
            <FormLabel>المبلغ (ر.س)</FormLabel>
            <FormControl><Input type="number" min={1} step="0.01" placeholder="0.00" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="target_type" render={({ field }) => (
          <FormItem>
            <FormLabel>نوع المنحة</FormLabel>
            <Select onValueChange={(v) => { field.onChange(v); form.setValue("target_id", ""); form.setValue("association_id", ""); }} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="project">طلب جمعية</SelectItem>
                <SelectItem value="service">خدمة</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="target_id" render={({ field }) => (
          <FormItem>
            <FormLabel>{targetType === "project" ? "الطلب" : "الخدمة"}</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="اختر..." /></SelectTrigger></FormControl>
              <SelectContent>
                {items?.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {/* Show association selector only for services */}
        {targetType === "service" && (
          <FormField control={form.control} name="association_id" render={({ field }) => (
            <FormItem>
              <FormLabel>الجمعية المستفيدة (اختياري)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="اختر جمعية مستفيدة..." /></SelectTrigger></FormControl>
                <SelectContent>
                  {associations?.map((assoc) => (
                    <SelectItem key={assoc.id} value={assoc.id}>
                      {assoc.organization_name || assoc.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <Button type="submit" disabled={isLoading}>{isLoading ? "جاري التحضير..." : "متابعة للدفع"}</Button>
      </form>
    </Form>
  );
}
