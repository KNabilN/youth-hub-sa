import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCategories } from "@/hooks/useCategories";
import { useRegions } from "@/hooks/useRegions";

const serviceSchema = z.object({
  title: z.string().min(5, "العنوان يجب أن يكون 5 أحرف على الأقل").max(200),
  description: z.string().min(20, "الوصف يجب أن يكون 20 حرفاً على الأقل").max(5000),
  category_id: z.string().min(1, "اختر التصنيف"),
  region_id: z.string().min(1, "اختر المنطقة"),
  service_type: z.enum(["fixed_price", "hourly"]),
  price: z.coerce.number().positive("يجب أن يكون رقماً موجباً"),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  defaultValues?: Partial<ServiceFormValues>;
  onSubmit: (values: ServiceFormValues) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ServiceForm({ defaultValues, onSubmit, isLoading, submitLabel = "حفظ" }: ServiceFormProps) {
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      description: "",
      category_id: "",
      region_id: "",
      service_type: "fixed_price",
      price: 0,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>عنوان الخدمة</FormLabel>
            <FormControl><Input placeholder="أدخل عنوان الخدمة" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>وصف الخدمة</FormLabel>
            <FormControl><Textarea placeholder="اكتب وصفاً تفصيلياً للخدمة" rows={4} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="category_id" render={({ field }) => (
            <FormItem>
              <FormLabel>التصنيف</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger></FormControl>
                <SelectContent>
                  {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="region_id" render={({ field }) => (
            <FormItem>
              <FormLabel>المنطقة</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="اختر المنطقة" /></SelectTrigger></FormControl>
                <SelectContent>
                  {regions?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="service_type" render={({ field }) => (
            <FormItem>
              <FormLabel>نوع الخدمة</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="fixed_price">سعر ثابت</SelectItem>
                  <SelectItem value="hourly">بالساعة</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem>
              <FormLabel>السعر (ر.س)</FormLabel>
              <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "جارٍ الحفظ..." : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
