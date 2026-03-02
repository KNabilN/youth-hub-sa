import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCategories } from "@/hooks/useCategories";
import { useRegions } from "@/hooks/useRegions";
import { useCities } from "@/hooks/useCities";
import { CategorySelectWithOther } from "@/components/ui/category-select-with-other";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ImagePlus, X, Plus, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const serviceSchema = z.object({
  title: z.string().min(5, "العنوان يجب أن يكون 5 أحرف على الأقل").max(200),
  description: z.string().min(20, "الوصف يجب أن يكون 20 حرفاً على الأقل").max(5000),
  long_description: z.string().max(10000).optional(),
  category_id: z.string().min(1, "اختر التصنيف"),
  region_id: z.string().min(1, "اختر المنطقة"),
  city_id: z.string().optional().nullable(),
  service_type: z.enum(["fixed_price", "hourly"]),
  price: z.coerce.number().positive("يجب أن يكون رقماً موجباً"),
  faq: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })).optional(),
  packages: z.array(z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    price: z.coerce.number().positive(),
    old_price: z.coerce.number().optional(),
  })).optional(),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  defaultValues?: Partial<ServiceFormValues>;
  defaultImageUrl?: string | null;
  defaultGallery?: string[];
  onSubmit: (values: ServiceFormValues & { image_url?: string | null; gallery?: string[] }) => void;
  onSaveDraft?: (values: ServiceFormValues & { image_url?: string | null; gallery?: string[] }) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ServiceForm({ defaultValues, defaultImageUrl, defaultGallery, onSubmit, onSaveDraft, isLoading, submitLabel = "حفظ" }: ServiceFormProps) {
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState<string | null>(defaultImageUrl ?? null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>(defaultGallery ?? []);
  const [uploading, setUploading] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      description: "",
      long_description: "",
      category_id: "",
      region_id: "",
      city_id: null,
      service_type: "fixed_price",
      price: 0,
      faq: [],
      packages: [],
      ...defaultValues,
    },
  });

  const selectedRegionId = form.watch("region_id");
  const { data: cities } = useCities(selectedRegionId);

  // Reset city when region changes
  useEffect(() => {
    const currentCity = form.getValues("city_id");
    if (currentCity && cities && !cities.find((c: any) => c.id === currentCity)) {
      form.setValue("city_id", null);
    }
  }, [selectedRegionId, cities]);

  const { fields: faqFields, append: appendFaq, remove: removeFaq } = useFieldArray({ control: form.control, name: "faq" });
  const { fields: pkgFields, append: appendPkg, remove: removePkg } = useFieldArray({ control: form.control, name: "packages" });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isGallery = false) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("service-images").upload(path, file);
    if (error) { setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("service-images").getPublicUrl(path);
    if (isGallery) {
      setGalleryUrls(prev => [...prev, urlData.publicUrl]);
    } else {
      setImageUrl(urlData.publicUrl);
    }
    setUploading(false);
  };

  const handleSubmit = (values: ServiceFormValues) => {
    onSubmit({ ...values, image_url: imageUrl, gallery: galleryUrls });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Main image */}
        <div>
          <label className="text-sm font-medium mb-2 block">صورة الخدمة الرئيسية</label>
          {imageUrl ? (
            <div className="relative w-full h-40 rounded-lg overflow-hidden border">
              <img src={imageUrl} alt="صورة الخدمة" className="w-full h-full object-cover" />
              <Button type="button" variant="destructive" size="icon" className="absolute top-2 left-2 h-7 w-7" onClick={() => setImageUrl(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
              <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">{uploading ? "جارٍ الرفع..." : "اضغط لرفع صورة"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, false)} disabled={uploading} />
            </label>
          )}
        </div>

        {/* Gallery */}
        <div>
          <label className="text-sm font-medium mb-2 block">معرض الصور (حتى 5 صور إضافية)</label>
          <div className="flex gap-2 flex-wrap">
            {galleryUrls.map((url, i) => (
              <div key={i} className="relative w-24 h-20 rounded-md overflow-hidden border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <Button type="button" variant="destructive" size="icon" className="absolute top-1 left-1 h-5 w-5" onClick={() => setGalleryUrls(prev => prev.filter((_, idx) => idx !== i))}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {galleryUrls.length < 5 && (
              <label className="flex flex-col items-center justify-center w-24 h-20 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                <Plus className="h-5 w-5 text-muted-foreground" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, true)} disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>عنوان الخدمة</FormLabel>
            <FormControl><Input placeholder="أدخل عنوان الخدمة" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>وصف مختصر</FormLabel>
            <FormControl><Textarea placeholder="وصف مختصر يظهر في بطاقة الخدمة" rows={3} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="long_description" render={({ field }) => (
          <FormItem>
            <FormLabel>وصف تفصيلي</FormLabel>
            <FormControl><Textarea placeholder="وصف تفصيلي يظهر في صفحة الخدمة الكاملة" rows={6} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="category_id" render={({ field }) => (
            <FormItem>
              <FormLabel>التصنيف</FormLabel>
              <FormControl>
                <CategorySelectWithOther categories={categories ?? []} value={field.value} onChange={field.onChange} entityType="service" />
              </FormControl>
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
        {selectedRegionId && (
          <FormField control={form.control} name="city_id" render={({ field }) => (
            <FormItem>
              <FormLabel>المدينة</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                <FormControl><SelectTrigger><SelectValue placeholder="اختر المدينة" /></SelectTrigger></FormControl>
                <SelectContent>
                  {cities?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        )}
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
              <FormLabel>السعر الأساسي (ر.س)</FormLabel>
              <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Packages */}
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">باقات الأسعار (اختياري)</label>
            <Button type="button" variant="outline" size="sm" onClick={() => appendPkg({ name: "", description: "", price: 0 })}>
              <Plus className="h-4 w-4 me-1" /> إضافة باقة
            </Button>
          </div>
          {pkgFields.map((field, i) => (
            <div key={field.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">باقة {i + 1}</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removePkg(i)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="اسم الباقة" {...form.register(`packages.${i}.name`)} />
                <Input type="number" placeholder="السعر" {...form.register(`packages.${i}.price`, { valueAsNumber: true })} />
              </div>
              <Input placeholder="وصف الباقة" {...form.register(`packages.${i}.description`)} />
              <Input type="number" placeholder="السعر القديم (اختياري)" {...form.register(`packages.${i}.old_price`, { valueAsNumber: true })} />
            </div>
          ))}
        </div>

        {/* FAQ */}
        <Separator />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">الأسئلة المتكررة (اختياري)</label>
            <Button type="button" variant="outline" size="sm" onClick={() => appendFaq({ question: "", answer: "" })}>
              <Plus className="h-4 w-4 me-1" /> إضافة سؤال
            </Button>
          </div>
          {faqFields.map((field, i) => (
            <div key={field.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">سؤال {i + 1}</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFaq(i)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              <Input placeholder="السؤال" {...form.register(`faq.${i}.question`)} />
              <Textarea placeholder="الإجابة" rows={2} {...form.register(`faq.${i}.answer`)} />
            </div>
          ))}
        </div>

        <Separator />
        <div className="flex gap-2">
          {onSaveDraft && (
            <Button type="button" variant="outline" disabled={isLoading || uploading} onClick={() => onSaveDraft({ ...form.getValues(), image_url: imageUrl, gallery: galleryUrls })} className="flex-1">
              حفظ كمسودة
            </Button>
          )}
          <Button type="submit" disabled={isLoading || uploading} className="flex-1">
            {isLoading ? "جارٍ الحفظ..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
