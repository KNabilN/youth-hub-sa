import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Building2, UserCheck, HandCoins, Shield, CheckCircle2, ArrowRight, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { z } from "zod";

type AppRole = "youth_association" | "service_provider" | "donor";

const loginSchema = z.object({
  email: z.string().trim().email("بريد إلكتروني غير صالح").max(255),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").max(128),
});

const registerSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100),
  phone: z.string().trim().length(9, "رقم الجوال يجب أن يكون 9 أرقام بدون رمز الدولة").regex(/^[0-9]+$/, "رقم جوال غير صالح"),
  pdplConsent: z.literal(true, { errorMap: () => ({ message: "يجب الموافقة على سياسة الخصوصية" }) }),
});

const roleOptions: { key: AppRole; label: string; icon: typeof Building2; desc: string }[] = [
  { key: "youth_association", label: "جمعية شبابية", icon: Building2, desc: "إنشاء طلبات وتعيين مقدمي خدمات" },
  { key: "service_provider", label: "مقدم خدمة", icon: UserCheck, desc: "تقديم خدمات وعروض للطلبات" },
  { key: "donor", label: "مانح", icon: HandCoins, desc: "تمويل المشاريع والخدمات" },
];

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("youth_association");
  const [phone, setPhone] = useState("");
  const [pdplConsent, setPdplConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const schema = isLogin ? loginSchema : registerSchema;
    const parsed = schema.safeParse(
      isLogin ? { email, password } : { email, password, fullName, phone, pdplConsent }
    );

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    if (isLogin) {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/dashboard");
      }
    } else {
      const { error } = await signUp(email.trim(), password, fullName.trim(), role, `+966${phone.trim()}`);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Decorative Side Panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/70 relative items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10 text-primary-foreground space-y-8 max-w-md">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold leading-tight">منصة الخدمات المشتركة للجمعيات الشبابية</h2>
          <p className="text-primary-foreground/80 leading-relaxed">
            منصة رقمية سعودية تربط الجمعيات الشبابية بمقدمي الخدمات المؤهلين والمانحين لتعزيز التميز المؤسسي
          </p>
          <div className="space-y-3 pt-4">
            {["ضمان مالي يحمي جميع الأطراف", "عقود رقمية ملزمة", "تقييم شامل وشفاف"].map((t) => (
              <div key={t} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary-foreground/80 shrink-0" />
                <span className="text-sm text-primary-foreground/90">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          
          {/* Logo (mobile) */}
          <div className="text-center space-y-2 lg:hidden">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">منصة الخدمات المشتركة</h1>
          </div>

          <div className="lg:space-y-1">
            <h1 className="text-2xl font-bold hidden lg:block">{isLogin ? "مرحباً بعودتك" : "إنشاء حساب جديد"}</h1>
            <p className="text-muted-foreground text-sm">
              {isLogin ? "أدخل بيانات الدخول الخاصة بك" : "أنشئ حسابك للبدء في استخدام المنصة"}
            </p>
          </div>

          <Card className="border-0 shadow-xl lg:shadow-none lg:border lg:border-border">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">الاسم الكامل</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                        required
                        className="h-11"
                      />
                    </div>

                    {/* Role as visual cards */}
                    <div className="space-y-2">
                      <Label>نوع الحساب</Label>
                      <div className="grid grid-cols-1 gap-2">
                        {roleOptions.map((r) => (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => setRole(r.key)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border-2 text-start transition-all",
                              role === r.key
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-border hover:border-primary/30 hover:bg-muted/50"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                              role === r.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                              <r.icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm">{r.label}</p>
                              <p className="text-xs text-muted-foreground">{r.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الجوال</Label>
                    <div className="relative flex gap-2">
                      <div className="flex items-center gap-1.5 h-11 px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground shrink-0 select-none">
                        <span>🇸🇦</span>
                        <span dir="ltr">+966</span>
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="5xxxxxxxx"
                        required
                        dir="ltr"
                        maxLength={9}
                        className={cn("text-left h-11", errors.phone && "border-destructive")}
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>
                )}

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
                    className={cn("text-left h-11", errors.email && "border-destructive")}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    dir="ltr"
                    className={cn("text-left h-11", errors.password && "border-destructive")}
                    minLength={6}
                  />
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="pdpl"
                        checked={pdplConsent}
                        onCheckedChange={(checked) => setPdplConsent(checked === true)}
                        className="mt-0.5"
                      />
                      <Label htmlFor="pdpl" className="text-xs leading-relaxed cursor-pointer">
                        أوافق على{" "}
                        <Link to="/privacy" target="_blank" className="text-primary underline">
                          سياسة الخصوصية وحماية البيانات الشخصية
                        </Link>{" "}
                        وفقاً لنظام PDPL السعودي
                      </Label>
                    </div>
                    {errors.pdplConsent && <p className="text-xs text-destructive">{errors.pdplConsent}</p>}
                  </div>
                )}

                {errors.fullName && !isLogin && <p className="text-xs text-destructive">{errors.fullName}</p>}

                <Button type="submit" className="w-full h-11 text-base shadow-md" disabled={loading}>
                  {loading
                    ? "جارٍ المعالجة..."
                    : isLogin
                    ? "تسجيل الدخول"
                    : "إنشاء الحساب"}
                </Button>
              </form>

              {isLogin && (
                <div className="mt-4 text-center">
                  <a href="/forgot-password" className="text-sm text-primary hover:underline">
                    نسيت كلمة المرور؟
                  </a>
                </div>
              )}

              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">
                  {isLogin ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}
                </span>{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary font-semibold hover:underline"
                >
                  {isLogin ? "إنشاء حساب" : "تسجيل الدخول"}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Back to landing */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground px-4 py-2 rounded-xl border border-border hover:border-primary/30 transition-all duration-200 shadow-sm hover:shadow-md group">
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              العودة للصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
