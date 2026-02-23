import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ticketSchema = z.object({
  subject: z.string().trim().min(5, "الموضوع يجب أن يكون 5 أحرف على الأقل").max(200),
  description: z.string().trim().min(10, "الوصف يجب أن يكون 10 أحرف على الأقل").max(2000),
  priority: z.enum(["low", "medium", "high", "urgent"] as const),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

interface TicketFormProps {
  onSubmit: (values: TicketFormValues) => void;
  isLoading?: boolean;
}

export function TicketForm({ onSubmit, isLoading }: TicketFormProps) {
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { subject: "", description: "", priority: "medium" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="subject" render={({ field }) => (
          <FormItem>
            <FormLabel>الموضوع</FormLabel>
            <FormControl><Input placeholder="أدخل موضوع التذكرة" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>الوصف</FormLabel>
            <FormControl><Textarea placeholder="اشرح المشكلة بالتفصيل" rows={5} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="priority" render={({ field }) => (
          <FormItem>
            <FormLabel>الأولوية</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="low">منخفضة</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="urgent">عاجلة</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" disabled={isLoading}>{isLoading ? "جاري الإرسال..." : "إرسال التذكرة"}</Button>
      </form>
    </Form>
  );
}
