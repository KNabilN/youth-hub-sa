import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Card, CardContent } from "@/components/ui/card";
import {
  Clock, ShieldCheck, DollarSign, HeadphonesIcon,
  Building2, Users, Heart,
  Briefcase, Monitor, Calculator, Scale, GraduationCap, Megaphone,
  CheckCircle2, Rocket, Brain, Handshake, TrendingUp,
  UserPlus, Search, FileCheck, Star,
} from "lucide-react";

const whyIcons = [Clock, ShieldCheck, DollarSign, HeadphonesIcon];
const targetIcons = [Building2, Users, Heart];
const serviceIcons = [Briefcase, Monitor, Calculator, Scale, GraduationCap, Megaphone];
const stepIcons = [UserPlus, Search, FileCheck, Star];
const ambitionIcons = [Rocket, Brain, Handshake, TrendingUp];

export default function About() {
  const { data } = useSiteContent("about");
  const a = data || {} as any;

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      {/* Hero */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">{a.hero_title || "ما هي منصة الخدمات المشتركة؟"}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            {a.hero_description || ""}
          </p>
        </div>
      </section>

      {/* Why */}
      {a.why_items?.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-10">{a.why_title}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {a.why_items.map((item: any, i: number) => {
                const Icon = whyIcons[i % whyIcons.length];
                return (
                  <Card key={i} className="card-hover text-center">
                    <CardContent className="pt-6 space-y-3">
                      <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Targets */}
      {a.targets?.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-10">{a.target_title}</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {a.targets.map((item: any, i: number) => {
                const Icon = targetIcons[i % targetIcons.length];
                return (
                  <Card key={i} className="card-hover text-center">
                    <CardContent className="pt-6 space-y-3">
                      <div className="mx-auto w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center">
                        <Icon className="h-7 w-7 text-accent-foreground" />
                      </div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      {a.services?.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-10">{a.services_title}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {a.services.map((item: any, i: number) => {
                const Icon = serviceIcons[i % serviceIcons.length];
                return (
                  <Card key={i} className="card-hover">
                    <CardContent className="pt-6 flex gap-4">
                      <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Benefits */}
      {a.benefits?.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-10">{a.benefits_title}</h2>
            <div className="space-y-3">
              {a.benefits.map((b: string, i: number) => (
                <div key={i} className="flex items-start gap-3 bg-card rounded-xl p-4 border border-border card-hover">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Steps */}
      {a.steps?.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-10">{a.steps_title}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {a.steps.map((item: any, i: number) => {
                const Icon = stepIcons[i % stepIcons.length];
                return (
                  <div key={i} className="text-center space-y-3">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center relative">
                      <Icon className="h-7 w-7 text-primary" />
                      <span className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Quality */}
      {a.quality_items?.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold text-center mb-10">{a.quality_title}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {a.quality_items.map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-3 bg-card rounded-xl p-4 border border-border card-hover">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ambitions */}
      {a.ambitions?.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-10">{a.ambitions_title}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {a.ambitions.map((item: any, i: number) => {
                const Icon = ambitionIcons[i % ambitionIcons.length];
                return (
                  <Card key={i} className="card-hover text-center">
                    <CardContent className="pt-6 space-y-3">
                      <div className="mx-auto w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center">
                        <Icon className="h-7 w-7 text-accent-foreground" />
                      </div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <LandingFooter />
    </div>
  );
}
