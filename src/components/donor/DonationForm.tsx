import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const donationSchema = z.object({
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  target_type: z.enum(["project", "service"]),
  target_id: z.string().min(1, "يرجى اختيار المشروع أو الخدمة"),
});

type DonationFormValues = z.infer<typeof donationSchema>;

interface DonationFormProps {
  onSubmit: (values: { amount: number; project_id?: string; service_id?: string }) => void;
  isLoading?: boolean;
}

export function DonationForm({ onSubmit, isLoading }: DonationFormProps) {
  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: { amount: 0, target_type: "project", target_id: "" },
  });

  const targetType = form.watch("target_type");

  const { data: projects } = useQuery({
    queryKey: ["open-projects-for-donation"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title")
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
        .select("id, title")
        .eq("approval", "approved");
      if (error) throw error;
      return data;
    },
  });

  const items = targetType === "project" ? projects : services;

  const handleSubmit = (values: DonationFormValues) => {
    onSubmit({
      amount: values.amount,
      ...(values.target_type === "project" ? { project_id: values.target_id } : { service_id: values.target_id }),
    });
    form.reset();
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
            <FormLabel>نوع التبرع</FormLabel>
            <Select onValueChange={(v) => { field.onChange(v); form.setValue("target_id", ""); }} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="project">مشروع</SelectItem>
                <SelectItem value="service">خدمة</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="target_id" render={({ field }) => (
          <FormItem>
            <FormLabel>{targetType === "project" ? "المشروع" : "الخدمة"}</FormLabel>
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
        <Button type="submit" disabled={isLoading}>{isLoading ? "جاري التبرع..." : "تبرع الآن"}</Button>
      </form>
    </Form>
  );
}
