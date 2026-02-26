import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "الاسم مطلوب").max(100),
  email: z.string().trim().email("بريد إلكتروني غير صالح").max(255),
  message: z.string().trim().min(10, "الرسالة يجب أن تكون 10 أحرف على الأقل").max(1000),
});

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse({ name, email, message });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from("contact_messages" as any).insert({
        name: result.data.name,
        email: result.data.email,
        message: result.data.message,
      } as any);
      if (error) throw error;
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
      toast.success("تم إرسال رسالتك بنجاح");
    } catch {
      toast.error("حدث خطأ أثناء الإرسال");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <Card className="max-w-lg mx-auto text-center">
        <CardContent className="py-12 space-y-4">
          <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
          <h3 className="text-xl font-bold">شكراً لتواصلك!</h3>
          <p className="text-muted-foreground">سنرد عليك في أقرب وقت ممكن.</p>
          <Button variant="outline" onClick={() => setSent(false)}>إرسال رسالة أخرى</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-xl text-center">تواصل معنا</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contact-name">الاسم</Label>
            <Input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك الكامل" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>
          <div>
            <Label htmlFor="contact-email">البريد الإلكتروني</Label>
            <Input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" dir="ltr" />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label htmlFor="contact-message">الرسالة</Label>
            <Textarea id="contact-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="اكتب رسالتك هنا..." rows={4} />
            {errors.message && <p className="text-xs text-destructive mt-1">{errors.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={sending}>
            <Send className="h-4 w-4 me-2" />
            {sending ? "جارٍ الإرسال..." : "إرسال"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
