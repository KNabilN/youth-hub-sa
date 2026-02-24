import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCategories } from "@/hooks/useCategories";
import { useRegions } from "@/hooks/useRegions";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const projectSchema = z.object({
  title: z.string().min(5, "العنوان يجب أن يكون 5 أحرف على الأقل").max(200),
  description: z.string().min(20, "الوصف يجب أن يكون 20 حرفاً على الأقل").max(5000),
  category_id: z.string().optional().nullable(),
  region_id: z.string().optional().nullable(),
  required_skills: z.array(z.string()).default([]),
  estimated_hours: z.coerce.number().positive("يجب أن يكون رقماً موجباً").optional().nullable(),
  budget: z.coerce.number().positive("يجب أن يكون رقماً موجباً").optional().nullable(),
  is_private: z.boolean().default(false),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  defaultValues?: Partial<ProjectFormValues>;
  onSubmit: (values: ProjectFormValues) => void;
  onSaveDraft?: (values: ProjectFormValues) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ProjectForm({ defaultValues, onSubmit, onSaveDraft, isLoading, submitLabel = "حفظ" }: ProjectFormProps) {
  const [step, setStep] = useState(0);
  const [skillInput, setSkillInput] = useState("");
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      category_id: null,
      region_id: null,
      required_skills: [],
      estimated_hours: null,
      budget: null,
      is_private: false,
      ...defaultValues,
    },
  });

  const values = form.watch();
  const steps = ["المعلومات الأساسية", "التفاصيل", "المراجعة"];

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !values.required_skills.includes(trimmed)) {
      form.setValue("required_skills", [...values.required_skills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    form.setValue("required_skills", values.required_skills.filter(s => s !== skill));
  };

  const canNext = () => {
    if (step === 0) return values.title.length >= 5 && values.description.length >= 20;
    return true;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Step indicators */}
        <div className="flex items-center gap-2 justify-center">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`w-8 h-8 rounded-full text-sm font-medium flex items-center justify-center transition-colors ${
                  i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </button>
              <span className={`text-sm hidden sm:inline ${i === step ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
              {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">المعلومات الأساسية</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان المشروع</FormLabel>
                  <FormControl><Input placeholder="أدخل عنوان المشروع" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>وصف المشروع</FormLabel>
                  <FormControl><Textarea placeholder="اكتب وصفاً تفصيلياً للمشروع" rows={5} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="category_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>التصنيف</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
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
                    <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر المنطقة" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {regions?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">التفاصيل</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <FormLabel>المهارات المطلوبة</FormLabel>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    placeholder="أضف مهارة واضغط Enter"
                  />
                  <Button type="button" variant="outline" onClick={addSkill}>إضافة</Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {values.required_skills.map(skill => (
                    <Badge key={skill} variant="secondary" className="gap-1">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="estimated_hours" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الساعات المقدرة</FormLabel>
                    <FormControl><Input type="number" placeholder="0" {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="budget" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الميزانية (ر.س)</FormLabel>
                    <FormControl><Input type="number" placeholder="0" {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="is_private" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="text-sm">مشروع خاص (لا يظهر لمقدمي الخدمات)</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">مراجعة المشروع</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">العنوان:</span><span className="font-medium">{values.title}</span>
                <span className="text-muted-foreground">الوصف:</span><span className="font-medium line-clamp-2">{values.description}</span>
                {values.budget && <><span className="text-muted-foreground">الميزانية:</span><span>{values.budget} ر.س</span></>}
                {values.estimated_hours && <><span className="text-muted-foreground">الساعات:</span><span>{values.estimated_hours} ساعة</span></>}
                <span className="text-muted-foreground">خاص:</span><span>{values.is_private ? "نعم" : "لا"}</span>
              </div>
              {values.required_skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {values.required_skills.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 justify-between">
          {step > 0 && <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>السابق</Button>}
          <div className="flex gap-2 mr-auto">
            {onSaveDraft && (
              <Button type="button" variant="outline" disabled={isLoading} onClick={() => onSaveDraft(form.getValues())}>
                حفظ كمسودة
              </Button>
            )}
            {step < 2 && (
              <Button type="button" onClick={() => setStep(step + 1)} disabled={!canNext()}>التالي</Button>
            )}
            {step === 2 && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "جارٍ الحفظ..." : submitLabel}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
