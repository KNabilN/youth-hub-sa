import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Users, Store, HandCoins, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">الخدمات المشتركة</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">تسجيل الدخول</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">إنشاء حساب</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            منصة الخدمات المشتركة
            <br />
            <span className="text-primary">للجمعيات الشبابية</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            منصة رقمية سعودية تربط الجمعيات الشبابية بمقدمي الخدمات المؤهلين والمانحين
            لتعزيز التميز المؤسسي والشفافية وفقاً لرؤية 2030
          </p>
          <div className="flex gap-3 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth">
                ابدأ الآن
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold text-center mb-10">كيف تعمل المنصة</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "الجمعيات الشبابية",
                desc: "أنشئ مشاريعك وابحث عن أفضل مقدمي الخدمات المؤهلين لتنفيذها",
              },
              {
                icon: Store,
                title: "مقدمو الخدمات",
                desc: "اعرض خدماتك وقدم عروضك على المشاريع المتاحة وتتبع أرباحك",
              },
              {
                icon: HandCoins,
                title: "المانحون",
                desc: "ادعم الجمعيات بتمويل المشاريع وتابع أثر تبرعاتك بشفافية",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-card rounded-xl p-6 border border-border space-y-3"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl text-center space-y-6">
          <h2 className="text-2xl font-bold">لماذا الخدمات المشتركة؟</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-start">
            {[
              "نظام ضمان مالي (Escrow) يحمي جميع الأطراف",
              "عقود رقمية ملزمة بين الجمعيات ومقدمي الخدمات",
              "تقييم ثلاثي الأبعاد: الجودة والوقت والتواصل",
              "فواتير إلكترونية متوافقة مع هيئة الزكاة والضريبة",
              "سجل تدقيق كامل لجميع العمليات",
              "لوحات تحكم مخصصة لكل دور",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 bg-card">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm">منصة الخدمات المشتركة</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} جميع الحقوق محفوظة — رؤية 2030
          </p>
        </div>
      </footer>
    </div>
  );
}
