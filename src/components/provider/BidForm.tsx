import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DollarSign, CalendarDays, FileText, Paperclip, X, FileIcon } from "lucide-react";
import { CharCounter } from "@/components/ui/char-counter";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";

const bidSchema = z.object({
  price: z.coerce.number().positive("يجب أن يكون رقماً موجباً"),
  timeline_days: z.coerce.number().int().positive("يجب أن يكون رقماً موجباً"),
  cover_letter: z.string().min(10, "خطاب التقديم يجب أن يكون 10 أحرف على الأقل").max(5000),
});

export type BidFormValues = z.infer<typeof bidSchema>;

interface BidFormProps {
  onSubmit: (values: BidFormValues, files: File[]) => void;
  isLoading?: boolean;
}

export function BidForm({ onSubmit, isLoading }: BidFormProps) {
  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidSchema),
    defaultValues: { price: 0, timeline_days: 1, cover_letter: "" },
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(values, selectedFiles))} className="space-y-4">
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

        {/* Attachments section */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Paperclip className="h-3.5 w-3.5 text-primary" />
            المرفقات
            <span className="text-muted-foreground font-normal">(اختياري)</span>
          </div>
          {selectedFiles.length > 0 && (
            <div className="space-y-1.5">
              {selectedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1">{file.name}</span>
                  <Badge variant="outline" className="text-xs shrink-0">{formatSize(file.size)}</Badge>
                  <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-3.5 w-3.5" />
            إرفاق ملفات
          </Button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFilesChange} />
          <p className="text-xs text-muted-foreground">يمكنك إرفاق ملفات داعمة لعرضك (الحد الأقصى 10 ميجابايت للملف)</p>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-l from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm">
          {isLoading ? "جارٍ الإرسال..." : "تقديم العرض"}
        </Button>
      </form>
    </Form>
  );
}
