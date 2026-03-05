import { useSiteContent } from "@/hooks/useSiteContent";
import heroBg from "@/assets/hero-bg.jpg";
import ctaBg from "@/assets/cta-bg.jpg";
import { useLandingStats } from "@/hooks/useLandingStats";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Globe, CheckCircle2, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LiveStats from "@/components/landing/LiveStats";
import LandingRequestsTable from "@/components/landing/LandingRequestsTable";
import LandingServicesGrid from "@/components/landing/LandingServicesGrid";
import Testimonials from "@/components/landing/Testimonials";
import { ContactForm } from "@/components/landing/ContactForm";
import { Users, Store, HandCoins } from "lucide-react";

const featureIcons: Record<string, React.ComponentType<{className?: string;}>> = {
  users: Users,
  store: Store,
  coins: HandCoins
};

const featureColors = [
{ color: "from-primary/20 to-primary/5", iconBg: "bg-primary/15 text-primary" },
{
  color: "from-[hsl(var(--info))]/20 to-[hsl(var(--info))]/5",
  iconBg: "bg-[hsl(var(--info))]/15 text-[hsl(var(--info))]"
},
{ color: "from-accent/20 to-accent/5", iconBg: "bg-accent/15 text-accent-foreground" }];


export default function Index() {
  const navigate = useNavigate();
  const { data: hero } = useSiteContent("hero");
  const { data: features } = useSiteContent("features");
  const { data: trust } = useSiteContent("trust");
  const { data: cta } = useSiteContent("cta");
  const { data: requestsSection } = useSiteContent("requests_section");
  const { data: servicesSection } = useSiteContent("services_section");
  const { data: contactSection } = useSiteContent("contact_section");
  const {
    stats,
    statsLoading,
    services,
    servicesLoading,
    projects: featuredProjects,
    projectsLoading
  } = useLandingStats();

  const h = hero || {
    badge: "المنصة الأولى لتمكين الجمعيات الشبابية في المملكة",
    title: "كل ماتحتاجه في مكان واحد",
    subtitle: "للجمعيات الشبابية",
    description: "ازدهر في منظومة مزوّدي الخدمة، حيث التميّز والفرص بلا حدود",
    cta_text: "ابدأ الآن"
  };
  const feat = features || { title: "", subtitle: "", items: [] };
  const tr = trust || { badge: "", title: "", items: [] };
  const ct = cta || { title: "ابدأ رحلتك الآن", description: "انضم إلى المنصة وابدأ في تحقيق أهدافك مع شبكة واسعة من الشركاء", button_text: "سجّل مجاناً" };
  const rs = requestsSection || { title: "طلبات الجمعيات", subtitle: "تصفّح أحدث الطلبات المفتوحة وقدّم عرضك الآن", button_text: "سجّل لتقديم عروضك", visible: true };
  const ss = servicesSection || { title: "الخدمات المتوفرة", subtitle: "خدمات معتمدة من مقدمي خدمات محترفين", button_text: "تصفح جميع الخدمات", visible: true };
  const cs = contactSection || { title: "نحن هنا لمساعدتك", subtitle: "فريقنا جاهز للإجابة على استفساراتك ومساعدتك في رحلتك المهنية", visible: true };

  return (
    <>
      {/* 1. Hero */}
      {h.visible !== false && (
        <section className="relative py-28 px-4 overflow-hidden min-h-[560px] flex items-center">
          <div className="absolute inset-0">
            <img src={h.bg_image || heroBg} alt="" className="w-full h-full object-cover" aria-hidden="true" />
            <div className="absolute inset-0 bg-[hsl(var(--primary))]/75" />
          </div>
          <div className="container mx-auto max-w-5xl text-center space-y-8 relative z-10">
            {h.badge &&
            <div className="inline-flex items-center gap-2 bg-white/15 text-white text-sm font-medium px-4 py-2 rounded-full animate-fade-in backdrop-blur-sm border border-white/20">
                <Zap className="w-4 h-4" />
                {h.badge}
              </div>
            }
            <h1 className="text-4xl md:text-6xl font-bold leading-tight animate-fade-in text-white drop-shadow-md">
              {h.title}
              <br />
              <span className="text-white/90">{h.subtitle}</span>
            </h1>
            {h.description &&
            <p
              className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed animate-fade-in stagger-1"
              style={{ animationFillMode: "both" }}>
              
                {h.description}
              </p>
            }
            <div className="flex gap-3 justify-center animate-fade-in stagger-2" style={{ animationFillMode: "both" }}>
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-shadow text-base px-8 font-bold"
                onClick={() => navigate("/auth")}>
                
                {h.cta_text}
                <ArrowLeft className="me-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* 2. احصائيات موحدة */}
      <LiveStats stats={stats} loading={statsLoading} />

      {/* 3. المميزات */}
      {feat.visible !== false && feat.items?.length > 0 &&
      <section className="py-20 px-4 bg-pattern">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold mb-3">{feat.title}</h2>
              <p className="text-muted-foreground">{feat.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {feat.items.map((f: any, idx: number) => {
              const Icon = featureIcons[f.icon] || Users;
              const colors = featureColors[idx % featureColors.length];
              return (
                <div
                  key={f.title}
                  className="bg-muted/40 rounded-2xl p-10 min-h-[280px] border border-border/50 space-y-5 card-hover flex flex-col items-center text-center justify-center">
                  
                    <div className={`w-20 h-20 ${colors.iconBg} rounded-full flex items-center justify-center`}>
                      <Icon className="w-9 h-9" />
                    </div>
                    <h3 className="font-bold text-xl">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px]">{f.desc}</p>
                  </div>);

            })}
            </div>
          </div>
        </section>
      }

      {/* 4. طلبات الجمعيات */}
      {rs.visible !== false && (
        <LandingRequestsTable
          projects={featuredProjects}
          loading={projectsLoading}
          title={rs.title}
          subtitle={rs.subtitle}
          buttonText={rs.button_text}
        />
      )}

      {/* 5. الخدمات المتوفرة */}
      {ss.visible !== false && (
        <LandingServicesGrid
          services={services}
          loading={servicesLoading}
          title={ss.title}
          subtitle={ss.subtitle}
          buttonText={ss.button_text}
        />
      )}

      {/* 6. الثقة والأمان */}
      {tr.visible !== false && tr.items?.length > 0 &&
      <section className="py-20 px-4 bg-card/50">
          <div className="container mx-auto max-w-6xl text-center space-y-8">
            <div>
              {tr.badge &&
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-2 rounded-full mb-4">
                  <Lock className="w-4 h-4" />
                  {tr.badge}
                </div>
            }
              <h2 className="text-3xl font-bold">{tr.title}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-start">
              {tr.items.map((item: string) =>
            <div
              key={item}
              className="flex items-start gap-3 bg-card rounded-xl p-4 border border-border card-hover">
              
                  <div className="mt-0.5 shrink-0 w-6 h-6 bg-primary/15 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm leading-relaxed">{item}</span>
                </div>
            )}
            </div>
          </div>
        </section>
      }

      {/* 7. آراء العملاء */}
      <Testimonials />

      {/* 8. CTA نهائي */}
      {ct.visible !== false && (
        <section className="py-16 px-4 bg-primary">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-right space-y-4 flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">
                  {ct.title}
                </h2>
                <p className="text-white/70 text-sm leading-relaxed max-w-xl">
                  {ct.description}
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-center gap-3">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 shadow-lg text-base px-10 py-6 text-lg font-bold"
                  onClick={() => navigate("/auth")}>
                  {ct.button_text || "سجّل مجاناً"}
                  <ArrowLeft className="me-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 9. نموذج التواصل */}
      {cs.visible !== false && (
        <>
          <section className="bg-muted/30 py-16 px-4 text-center">
            <div className="container mx-auto max-w-5xl space-y-3">
              <h2 className="text-3xl font-bold text-foreground">{cs.title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{cs.subtitle}</p>
            </div>
          </section>
          <section className="py-16 px-4 bg-muted/30">
            <div className="container mx-auto">
              <ContactForm />
            </div>
          </section>
        </>
      )}
    </>);

}
