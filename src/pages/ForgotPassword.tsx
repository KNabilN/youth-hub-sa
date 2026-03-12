import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";
import { translateError } from "@/lib/auth-errors";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(translateError(error.message));
    } else {
      setSent(true);
      toast.success("تم إرسال رابط إعادة تعيين كلمة المرور");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6" dir="rtl">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">استعادة كلمة المرور</h1>
          <p className="text-muted-foreground text-sm">
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
          </p>
        </div>

        <Card className="border shadow-xl">
          <CardContent className="pt-6">
            {sent ? (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  تم إرسال رابط إعادة تعيين كلمة المرور إلى <strong>{email}</strong>. يرجى التحقق من بريدك الإلكتروني.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@domain.com"
                    required
                    dir="ltr"
                    className="text-start h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link to="/auth" className="text-sm text-primary font-semibold hover:underline inline-flex items-center gap-1">
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                العودة لتسجيل الدخول
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
