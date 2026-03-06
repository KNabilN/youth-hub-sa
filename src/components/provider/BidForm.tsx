import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DollarSign, CalendarDays, FileText } from "lucide-react";
import { CharCounter } from "@/components/ui/char-counter";

const bidSchema = z.object({
  price: z.coerce.number().positive("يجب أن يكون رقماً موجباً"),
  timeline_days: z.coerce.number().int().positive("يجب أن يكون رقماً موجباً"),
  cover_letter: z.string().min(10, "خطاب التقديم يجب أن يكون 10 أحرف على الأقل").max(5000),
});

export type BidFormValues = z.infer<typeof bidSchema>;

interface BidFormProps {
  onSubmit: (values: BidFormValues) => void;
  isLoading?: boolean;
}

export function BidForm({ onSubmit, isLoading }: BidFormProps) {
  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: { price: 0, timeline_days: 1, cover_letter: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem>
              <FormLabel required className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-primary" />السعر المقترح (ر.س)</FormLabel>
              <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="timeline_days" render={({ field }) => (
            <FormItem>
              <FormLabel required className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-primary" />المدة (بالأيام)</FormLabel>
              <FormControl><Input type="number" placeholder="1" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="cover_letter" render={({ field }) => (
          <FormItem>
            <FormLabel required className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-primary" />خطاب التقديم</FormLabel>
            <FormControl><Textarea placeholder="اكتب خطاب التقديم الخاص بك..." rows={5} maxLength={5000} {...field} /></FormControl>
            <CharCounter current={field.value?.length ?? 0} max={5000} />
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-l from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm">
          {isLoading ? "جارٍ الإرسال..." : "تقديم العرض"}
        </Button>
      </form>
    </Form>
  );
}
