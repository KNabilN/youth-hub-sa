import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Building2, UserCheck, HandCoins, Phone, X, Eye, EyeOff, ArrowLeft, ArrowRight } from "lucide-react";
import { translateError } from "@/lib/auth-errors";
import logoImg from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { z } from "zod";
import { StepProgress } from "@/components/ui/step-progress";
import { PasswordStrength } from "@/components/ui/password-strength";
import {
  Dialog,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type AppRole = "youth_association" | "service_provider" | "donor";

const loginSchema = z.object({
  email: z.string().trim().email("بريد إلكتروني غير صالح").max(255),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").max(128),
});

const step1Schema = z.object({
  fullName: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100),
  phone: z.string().trim().length(9, "رقم الجوال يجب أن يكون 9 أرقام بدون رمز الدولة").regex(/^[0-9]+$/, "رقم جوال غير صالح"),
});

const step2Schema = z.object({
  email: z.string().trim().email("بريد إلكتروني غير صالح").max(255),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").max(128),
  pdplConsent: z.literal(true, { errorMap: () => ({ message: "يجب الموافقة على سياسة الخصوصية" }) }),
});

const roleOptions: { key: AppRole; label: string; icon: typeof Building2; desc: string }[] = [
  { key: "youth_association", label: "جمعية شبابية", icon: Building2, desc: "إنشاء طلبات وتعيين مقدمي خدمات" },
  { key: "service_provider", label: "مقدم خدمة", icon: UserCheck, desc: "تقديم خدمات وعروض للطلبات" },
  { key: "donor", label: "مانح", icon: HandCoins, desc: "تمويل المشاريع والخدمات" },
];

const registerSteps = [
  { label: "البيانات الأساسية" },
  { label: "الحساب والأمان" },
];

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "login" | "register";
}

export default function AuthModal({ open, onOpenChange, defaultMode = "login" }: AuthModalProps) {
  const isMobile = useIsMobile();
  const [isLogin, setIsLogin] = useState(defaultMode === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("youth_association");
  const [phone, setPhone] = useState("");
  const [pdplConsent, setPdplConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [regStep, setRegStep] = useState(0);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setIsLogin(defaultMode === "login");
      setErrors({});
      setRegStep(0);
      setShowPassword(false);
      setShowResend(false);
    }
  }, [open, defaultMode]);

  const handleNextStep = () => {
    setErrors({});
    const parsed = step1Schema.safeParse({ fullName, phone });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setRegStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (isLogin) {
      const parsed = loginSchema.safeParse({ email, password });
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
      const { error } = await signIn(email.trim(), password);
      if (error) {
        toast.error(translateError(error.message));
      } else {
        toast.success("مرحباً بعودتك! 👋");
        onOpenChange(false);
        navigate("/dashboard");
      }
      setLoading(false);
    } else {
      const parsed = step2Schema.safeParse({ email, password, pdplConsent });
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
      const { error } = await signUp(email.trim(), password, fullName.trim(), role, `+966${phone.trim()}`);
      if (error) {
        toast.error(translateError(error.message));
      } else {
        toast.success("تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني.");
        onOpenChange(false);
      }
      setLoading(false);
    }
  };


  const formContent = (
    <div className="space-y-5 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <img src={logoImg} alt="منصة الخدمات المشتركة" className="mx-auto h-20 w-auto object-contain" />
        <h2 className="text-xl font-bold">{isLogin ? "مرحباً بعودتك" : "إنشاء حساب جديد"}</h2>
        <p className="text-muted-foreground text-sm">
          {isLogin ? "أدخل بيانات الدخول الخاصة بك" : "أنشئ حسابك للبدء في استخدام المنصة"}
        </p>
      </div>

      {/* Step Progress for Registration */}
      {!isLogin && (
        <StepProgress steps={registerSteps} currentStep={regStep} className="mb-2" />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isLogin ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="modal-email">البريد الإلكتروني <span className="text-destructive">*</span></Label>
              <Input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@domain.com"
                required
                dir="ltr"
                className={cn("text-start h-11", errors.email && "border-destructive")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-login-password">كلمة المرور <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Input
                  id="modal-login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  dir="ltr"
                  className={cn("text-start h-11 flex-1", errors.password && "border-destructive")}
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-11 w-11 shrink-0"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full h-11 text-base shadow-md" disabled={loading}>
              {loading ? "جارٍ المعالجة..." : "تسجيل الدخول"}
            </Button>
          </>
        ) : regStep === 0 ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="modal-fullName">الاسم الكامل <span className="text-destructive">*</span></Label>
              <Input
                id="modal-fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك الكامل"
                required
                className="h-11"
              />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label>نوع الحساب <span className="text-destructive">*</span></Label>
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

            <div className="space-y-2">
              <Label htmlFor="modal-phone">رقم الجوال <span className="text-destructive">*</span></Label>
              <div className="relative flex gap-2">
                <div className="flex items-center gap-1.5 h-11 px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground shrink-0 select-none">
                  <span>🇸🇦</span>
                  <span dir="ltr">+966</span>
                </div>
                <Input
                  id="modal-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="5xxxxxxxx"
                  required
                  dir="ltr"
                  maxLength={9}
                  className={cn("text-start h-11", errors.phone && "border-destructive")}
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            <Button type="button" className="w-full h-11 text-base shadow-md gap-2" onClick={handleNextStep}>
              التالي
              <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="modal-email">البريد الإلكتروني <span className="text-destructive">*</span></Label>
              <Input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@domain.com"
                required
                dir="ltr"
                className={cn("text-start h-11", errors.email && "border-destructive")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-reg-password">كلمة المرور <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Input
                  id="modal-reg-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  dir="ltr"
                  className={cn("text-start h-11 flex-1", errors.password && "border-destructive")}
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                  className="h-11 w-11 shrink-0"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <PasswordStrength password={password} />

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="modal-pdpl"
                  checked={pdplConsent}
                  onCheckedChange={(checked) => setPdplConsent(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="modal-pdpl" className="text-xs leading-relaxed cursor-pointer">
                  أوافق على{" "}
                  <Link to="/privacy" target="_blank" className="text-primary underline">
                    سياسة الخصوصية وحماية البيانات الشخصية
                  </Link>{" "}
                  وفقاً لنظام PDPL السعودي
                </Label>
              </div>
              {errors.pdplConsent && <p className="text-xs text-destructive">{errors.pdplConsent}</p>}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="h-11 gap-2" onClick={() => setRegStep(0)}>
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                رجوع
              </Button>
              <Button type="submit" className="flex-1 h-11 text-base shadow-md" disabled={loading}>
                {loading ? "جارٍ المعالجة..." : "إنشاء الحساب"}
              </Button>
            </div>
          </>
        )}
      </form>

      {isLogin && (
        <div className="text-center">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline" onClick={() => onOpenChange(false)}>
            نسيت كلمة المرور؟
          </Link>
        </div>
      )}

      <div className="text-center text-sm">
        <span className="text-muted-foreground">
          {isLogin ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}
        </span>{" "}
        <button
          type="button"
          onClick={() => { setIsLogin(!isLogin); setErrors({}); setRegStep(0); setShowPassword(false); }}
          className="text-primary font-semibold hover:underline"
        >
          {isLogin ? "إنشاء حساب" : "تسجيل الدخول"}
        </button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <VisuallyHidden>
            <DrawerTitle>{isLogin ? "تسجيل الدخول" : "إنشاء حساب"}</DrawerTitle>
          </VisuallyHidden>
          <ScrollArea className="overflow-y-auto max-h-[85vh]">
            {formContent}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-md" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border border-border/50 bg-background shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <VisuallyHidden>
            <DialogTitle>{isLogin ? "تسجيل الدخول" : "إنشاء حساب"}</DialogTitle>
          </VisuallyHidden>
          <DialogPrimitive.Close className="absolute end-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
          {formContent}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
