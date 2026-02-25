import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Users, Store, HandCoins, ArrowLeft, CheckCircle2, Zap, Globe, Lock } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useLandingStats } from "@/hooks/useLandingStats";
import LiveStats from "@/components/landing/LiveStats";
import FeaturedServices from "@/components/landing/FeaturedServices";
import FeaturedProjects from "@/components/landing/FeaturedProjects";

const featureIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  store: Store,
  coins: HandCoins,
};

const featureColors = [
  { color: "from-primary/20 to-primary/5", iconBg: "bg-primary/15 text-primary" },
  { color: "from-[hsl(var(--info))]/20 to-[hsl(var(--info))]/5", iconBg: "bg-[hsl(var(--info))]/15 text-[hsl(var(--info))]" },
  { color: "from-accent/20 to-accent/5", iconBg: "bg-accent/15 text-accent-foreground" },
];

export default function Index() {
  const { data: hero } = useSiteContent("hero");
  const { data: cmsStats } = useSiteContent("stats");
  const { data: features } = useSiteContent("features");
  const { data: trust } = useSiteContent("trust");
  const { stats, statsLoading, services, servicesLoading, projects: featuredProjects, projectsLoading } = useLandingStats();
  const { data: cta } = useSiteContent("cta");
  const { data: header } = useSiteContent("header");
  const { data: footer } = useSiteContent("footer");

  // Fallback defaults
  const h = hero || { badge: "", title: "منصة الخدمات المشتركة", subtitle: "للجمعيات الشبابية", description: "", cta_text: "ابدأ الآن" };
  const st = cmsStats?.items || [];
  const feat = features || { title: "", subtitle: "", items: [] };
  const tr = trust || { badge: "", title: "", items: [] };
  const ct = cta || { title: "", description: "", button_text: "سجّل مجاناً" };
  const hd = header || { site_name: "الخدمات المشتركة", login_text: "تسجيل الدخول", register_text: "إنشاء حساب" };
  const ft = footer || { site_name: "منصة الخدمات المشتركة", copyright: "", links: [] };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">{hd.site_name}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">{hd.login_text}</Link>
            </Button>
            <Button asChild className="shadow-md">
              <Link to="/auth?mode=register">{hd.register_text}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-pattern" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="container mx-auto max-w-4xl text-center space-y-8 relative z-10">
          {h.badge && (
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-2 rounded-full animate-fade-in">
              <Zap className="w-4 h-4" />
              {h.badge}
            </div>
          )}
          <h1 className="text-4xl md:text-6xl font-bold leading-tight animate-fade-in">
            {h.title}
            <br />
            <span className="gradient-text">{h.subtitle}</span>
          </h1>
          {h.description && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in stagger-1" style={{ animationFillMode: "both" }}>
              {h.description}
            </p>
          )}
          <div className="flex gap-3 justify-center animate-fade-in stagger-2" style={{ animationFillMode: "both" }}>
            <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow text-base px-8">
              <Link to="/auth">
                {h.cta_text}
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Live Stats (DB) - replaces CMS stats */}
      <LiveStats stats={stats} loading={statsLoading} />

      {/* Features */}
      {feat.items?.length > 0 && (
        <section className="py-20 px-4 bg-pattern">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-3">{feat.title}</h2>
              <p className="text-muted-foreground">{feat.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {feat.items.map((f: any, idx: number) => {
                const Icon = featureIcons[f.icon] || Users;
                const colors = featureColors[idx % featureColors.length];
                return (
                  <div key={f.title} className={`bg-gradient-to-b ${colors.color} rounded-2xl p-6 border border-border space-y-4 card-hover`}>
                    <div className={`w-14 h-14 ${colors.iconBg} rounded-2xl flex items-center justify-center`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-lg">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Services (DB) */}
      <FeaturedServices services={services} loading={servicesLoading} />

      {/* Trust */}
      {tr.items?.length > 0 && (
        <section className="py-20 px-4 bg-card/50">
          <div className="container mx-auto max-w-3xl text-center space-y-8">
            <div>
              {tr.badge && (
                <div className="inline-flex items-center gap-2 bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] text-sm font-medium px-4 py-2 rounded-full mb-4">
                  <Lock className="w-4 h-4" />
                  {tr.badge}
                </div>
              )}
              <h2 className="text-3xl font-bold">{tr.title}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-start">
              {tr.items.map((item: string) => (
                <div key={item} className="flex items-start gap-3 bg-card rounded-xl p-4 border border-border card-hover">
                  <div className="mt-0.5 shrink-0 w-6 h-6 bg-[hsl(var(--success))]/15 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--success))]" />
                  </div>
                  <span className="text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Projects (DB) */}
      <FeaturedProjects projects={featuredProjects} loading={projectsLoading} />

      {/* CTA */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto max-w-2xl text-center relative z-10 space-y-6">
          <h2 className="text-3xl font-bold">{ct.title}</h2>
          <p className="text-muted-foreground">{ct.description}</p>
          <Button size="lg" asChild className="shadow-lg text-base px-10">
            <Link to="/auth">
              <Globe className="ml-2 h-5 w-5" />
              {ct.button_text}
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
              <span className="font-bold text-sm">{ft.site_name}</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              {(ft.links || []).map((link: any) => (
                <a key={link.label} href={link.url} className="hover:text-foreground transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {ft.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
