import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useCategories } from "@/hooks/useCategories";
import { useRegions } from "@/hooks/useRegions";
import { useCities } from "@/hooks/useCities";
import { CategorySelectWithOther } from "@/components/ui/category-select-with-other";
import { CharCounter } from "@/components/ui/char-counter";
import { cn } from "@/lib/utils";

const countWords = (text: string) =>
  (text ?? "").trim().split(/\s+/).filter(Boolean).length;

const serviceSchema = z.object({
  title: z
    .string()
    .min(5, "العنوان يجب أن يكون 5 أحرف على الأقل")
    .max(80, "العنوان يجب ألا يتجاوز 80 حرفاً"),
  description: z
    .string()
    .max(5000)
    .refine((v) => countWords(v) >= 50, {
      message: "يجب ألا يقل الوصف عن 50 كلمة",
    }),
  long_description: z
    .string()
    .min(10, "يرجى كتابة المخرجات والتسليمات")
    .max(10000),
  category_id: z.string().min(1, "اختر التصنيف"),
  region_id: z.string().min(1, "اختر المنطقة"),
  city_id: z.string().optional().nullable(),
  price: z.coerce.number().positive("يجب أن يكون رقماً موجباً"),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormSubmitValues extends ServiceFormValues {
  image_url?: string | null;
  gallery?: string[];
  service_type?: "fixed_price" | "hourly";
  packages?: any[];
  faq?: any[];
}

interface ServiceFormProps {
  defaultValues?: Partial<ServiceFormValues>;
  defaultImageUrl?: string | null;
  defaultGallery?: string[];
  onSubmit: (values: ServiceFormSubmitValues) => void;
  onSaveDraft?: (values: ServiceFormSubmitValues) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ServiceForm({
  defaultValues,
  onSubmit,
  onSaveDraft,
  isLoading,
  submitLabel = "حفظ",
}: ServiceFormProps) {
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      description: "",
      long_description: "",
      category_id: "",
      region_id: "",
      city_id: null,
      price: 0,
      ...defaultValues,
    },
  });

  const selectedRegionId = form.watch("region_id");
  const { data: cities } = useCities(selectedRegionId);

  useEffect(() => {
    const currentCity = form.getValues("city_id");
    if (
      currentCity &&
      cities &&
      !cities.find((c: any) => c.id === currentCity)
    ) {
      form.setValue("city_id", null);
    }
  }, [selectedRegionId, cities]);

  const descriptionValue = form.watch("description") ?? "";
  const wordCount = countWords(descriptionValue);
  const remainingWords = Math.max(0, 50 - wordCount);
  const wordsOk = wordCount >= 50;

  const buildPayload = (
    values: ServiceFormValues,
  ): ServiceFormSubmitValues => ({
    ...values,
    image_url: null,
    gallery: [],
    service_type: "fixed_price",
    packages: [],
    faq: [],
  });

  const handleSubmit = (values: ServiceFormValues) => {
    onSubmit(buildPayload(values));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* 1. Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>عنوان الخدمة</FormLabel>
              <FormControl>
                <Input
                  placeholder="أدخل عنوان الخدمة"
                  maxLength={80}
                  {...field}
                />
              </FormControl>
              <CharCounter current={field.value?.length ?? 0} max={80} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 2. Description (>= 50 words) */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>وصف الخدمة</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="وصف مختصر لا يقل عن 50 كلمة يظهر في بطاقة الخدمة"
                  rows={5}
                  maxLength={5000}
                  {...field}
                />
              </FormControl>
              <p
                className={cn(
                  "text-xs",
                  wordsOk
                    ? "text-success dark:text-success"
                    : "text-destructive",
                )}
              >
                {wordCount} كلمة من 50
                {!wordsOk && ` (تبقّى ${remainingWords} كلمة)`}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 3. Deliverables (long_description) */}
        <FormField
          control={form.control}
          name="long_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>المخرجات والتسليمات</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="الرجاء كتابة قائمة المخرجات التي سيتم تسليمها للجمعية"
                  rows={6}
                  maxLength={10000}
                  {...field}
                />
              </FormControl>
              <CharCounter current={field.value?.length ?? 0} max={10000} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 4. Price */}
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>سعر الخدمة (غير شامل الضريبة)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                السعر غير شامل ضريبة القيمة المضافة
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 5. Category & 6. Region */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>التصنيف</FormLabel>
                <FormControl>
                  <CategorySelectWithOther
                    categories={categories ?? []}
                    value={field.value}
                    onChange={field.onChange}
                    entityType="service"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="region_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel required>المنطقة</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المنطقة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {regions?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {selectedRegionId && (
          <FormField
            control={form.control}
            name="city_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>المدينة</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cities?.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex gap-2 pt-2">
          {onSaveDraft && (
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={() => onSaveDraft(buildPayload(form.getValues()))}
              className="flex-1"
            >
              حفظ كمسودة
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? "جارٍ الحفظ..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
