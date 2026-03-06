import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FolderKanban, CalendarDays, Clock, FileText } from "lucide-react";

const timeEntrySchema = z.object({
  project_id: z.string().min(1, "اختر المشروع"),
  log_date: z.string().min(1, "اختر التاريخ"),
  hours: z.coerce.number().positive("يجب أن يكون رقماً موجباً").max(24, "الحد الأقصى 24 ساعة"),
  description: z.string().min(1, "أدخل وصف العمل").max(1000),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
});

export type TimeEntryFormValues = z.infer<typeof timeEntrySchema>;

interface TimeEntryFormProps {
  projects: { id: string; title: string }[];
  onSubmit: (values: TimeEntryFormValues) => void;
  isLoading?: boolean;
  defaultValues?: Partial<TimeEntryFormValues>;
}

export function TimeEntryForm({ projects, onSubmit, isLoading, defaultValues }: TimeEntryFormProps) {
  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      project_id: defaultValues?.project_id ?? "",
      log_date: defaultValues?.log_date ?? new Date().toISOString().split("T")[0],
      hours: defaultValues?.hours ?? 0,
      description: defaultValues?.description ?? "",
      start_time: defaultValues?.start_time ?? "",
      end_time: defaultValues?.end_time ?? "",
    },
  });

  // Update form when defaultValues change (e.g. from timer)
  const prevDefRef = defaultValues;
  if (prevDefRef?.hours && prevDefRef.hours !== form.getValues("hours")) {
    form.setValue("hours", prevDefRef.hours);
  }
  if (prevDefRef?.start_time && prevDefRef.start_time !== form.getValues("start_time")) {
    form.setValue("start_time", prevDefRef.start_time);
  }
  if (prevDefRef?.end_time && prevDefRef.end_time !== form.getValues("end_time")) {
    form.setValue("end_time", prevDefRef.end_time);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="project_id" render={({ field }) => (
          <FormItem>
            <FormLabel required className="flex items-center gap-1.5"><FolderKanban className="h-3.5 w-3.5 text-primary" />المشروع</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger></FormControl>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="log_date" render={({ field }) => (
            <FormItem>
              <FormLabel required className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-primary" />التاريخ</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="hours" render={({ field }) => (
            <FormItem>
              <FormLabel required className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" />عدد الساعات</FormLabel>
              <FormControl><Input type="number" step="0.25" placeholder="0" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="start_time" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-muted-foreground" />وقت البداية (اختياري)</FormLabel>
              <FormControl><Input type="time" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="end_time" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-muted-foreground" />وقت النهاية (اختياري)</FormLabel>
              <FormControl><Input type="time" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel required className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" />وصف العمل</FormLabel>
            <FormControl><Textarea placeholder="اكتب وصفاً للعمل المنجز" rows={3} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-l from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm">
          {isLoading ? "جارٍ الحفظ..." : "تسجيل الساعات"}
        </Button>
      </form>
    </Form>
  );
}
