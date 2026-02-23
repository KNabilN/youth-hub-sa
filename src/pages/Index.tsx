import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Users, Store, HandCoins, ArrowLeft, CheckCircle2, Zap, Globe, Lock } from "lucide-react";

const stats = [
  { value: "100+", label: "جمعية شبابية" },
  { value: "500+", label: "مقدم خدمة" },
  { value: "1,200+", label: "مشروع منجز" },
  { value: "5M+", label: "ريال سعودي" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">الخدمات المشتركة</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">تسجيل الدخول</Link>
            </Button>
            <Button asChild className="shadow-md">
              <Link to="/auth">إنشاء حساب</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-pattern" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-4xl text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-2 rounded-full animate-fade-in">
            <Zap className="w-4 h-4" />
            منصة رقمية متوافقة مع رؤية 2030
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight animate-fade-in">
            منصة الخدمات المشتركة
            <br />
            <span className="gradient-text">للجمعيات الشبابية</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in stagger-1" style={{ animationFillMode: 'both' }}>
            منصة رقمية سعودية تربط الجمعيات الشبابية بمقدمي الخدمات المؤهلين والمانحين
            لتعزيز التميز المؤسسي والشفافية
          </p>
          <div className="flex gap-3 justify-center animate-fade-in stagger-2" style={{ animationFillMode: 'both' }}>
            <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow text-base px-8">
              <Link to="/auth">
                ابدأ الآن
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 border-y border-border bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={s.label} className={`text-center animate-fade-in stagger-${i + 1}`} style={{ animationFillMode: 'both' }}>
                <div className="text-3xl md:text-4xl font-bold gradient-text">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-pattern">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">كيف تعمل المنصة</h2>
            <p className="text-muted-foreground">ثلاثة أدوار رئيسية تعمل معاً لتحقيق أهداف مشتركة</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "الجمعيات الشبابية",
                desc: "أنشئ مشاريعك وابحث عن أفضل مقدمي الخدمات المؤهلين لتنفيذها",
                color: "from-primary/20 to-primary/5",
                iconBg: "bg-primary/15 text-primary",
              },
              {
                icon: Store,
                title: "مقدمو الخدمات",
                desc: "اعرض خدماتك وقدم عروضك على المشاريع المتاحة وتتبع أرباحك",
                color: "from-info/20 to-info/5",
                iconBg: "bg-info/15 text-info",
              },
              {
                icon: HandCoins,
                title: "المانحون",
                desc: "ادعم الجمعيات بتمويل المشاريع وتابع أثر تبرعاتك بشفافية",
                color: "from-accent/20 to-accent/5",
                iconBg: "bg-accent/15 text-accent-foreground",
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`bg-gradient-to-b ${f.color} rounded-2xl p-6 border border-border space-y-4 card-hover`}
              >
                <div className={`w-14 h-14 ${f.iconBg} rounded-2xl flex items-center justify-center`}>
                  <f.icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-lg">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-3xl text-center space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-success/10 text-success text-sm font-medium px-4 py-2 rounded-full mb-4">
              <Lock className="w-4 h-4" />
              أمان وشفافية كاملة
            </div>
            <h2 className="text-3xl font-bold">لماذا الخدمات المشتركة؟</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 text-start">
            {[
              "نظام ضمان مالي (Escrow) يحمي جميع الأطراف",
              "عقود رقمية ملزمة بين الجمعيات ومقدمي الخدمات",
              "تقييم ثلاثي الأبعاد: الجودة والوقت والتواصل",
              "فواتير إلكترونية متوافقة مع هيئة الزكاة والضريبة",
              "سجل تدقيق كامل لجميع العمليات",
              "لوحات تحكم مخصصة لكل دور",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 bg-card rounded-xl p-4 border border-border card-hover">
                <div className="mt-0.5 shrink-0 w-6 h-6 bg-success/15 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                </div>
                <span className="text-sm leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto max-w-2xl text-center relative z-10 space-y-6">
          <h2 className="text-3xl font-bold">ابدأ رحلتك الآن</h2>
          <p className="text-muted-foreground">انضم إلى المنصة وابدأ في تحقيق أهدافك مع شبكة واسعة من الشركاء</p>
          <Button size="lg" asChild className="shadow-lg text-base px-10">
            <Link to="/auth">
              <Globe className="ml-2 h-5 w-5" />
              سجّل مجاناً
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-4 bg-card">
        <div className="container mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm">منصة الخدمات المشتركة</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">عن المنصة</a>
              <a href="#" className="hover:text-foreground transition-colors">الشروط والأحكام</a>
              <a href="#" className="hover:text-foreground transition-colors">سياسة الخصوصية</a>
              <a href="#" className="hover:text-foreground transition-colors">تواصل معنا</a>
            </div>
          </div>
          <div className="border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} جميع الحقوق محفوظة — رؤية 2030
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
