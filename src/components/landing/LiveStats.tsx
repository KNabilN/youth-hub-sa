import { useEffect, useRef, useState } from "react";
import { Users, Store, FolderKanban, CheckCircle, Star, FileText, Award } from "lucide-react";

interface StatItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value?: string; // for fixed stats
  target?: number; // for animated stats
}

interface LiveStatsProps {
  stats: {
    providers: number;
    associations: number;
    completed_projects: number;
    approved_services: number;
  } | undefined;
  loading: boolean;
}

function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!target || started.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <div ref={ref} className="text-2xl md:text-3xl font-bold gradient-text">{count}+</div>;
}

const fixedStats: StatItem[] = [
  { key: "rating", label: "متوسط التقييم", icon: Star, value: "4.91/5" },
  { key: "contracts", label: "عقد منجز", icon: FileText, value: "211K+" },
  { key: "skills", label: "مهارة مدعومة", icon: Award, value: "1,665" },
];

const liveStatItems: { key: keyof LiveStatsProps["stats"] & string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "providers", label: "مقدم خدمة", icon: Users },
  { key: "associations", label: "جمعية مسجلة", icon: FolderKanban },
  { key: "completed_projects", label: "طلب مكتمل", icon: CheckCircle },
  { key: "approved_services", label: "خدمة معتمدة", icon: Store },
];

export default function LiveStats({ stats, loading }: LiveStatsProps) {
  const showLive = !loading && stats;

  return (
    <section className="py-14 px-4 border-y border-border bg-card/50">
      <div className="container mx-auto max-w-5xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-6">
          {/* Fixed stats */}
          {fixedStats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 bg-accent/15 rounded-xl flex items-center justify-center mb-1">
                  <Icon className="w-5 h-5 text-accent-foreground" />
                </div>
                <p className="text-2xl md:text-3xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            );
          })}

          {/* Live stats */}
          {liveStatItems.map((item) => (
            <div key={item.key} className="text-center space-y-2">
              <div className="mx-auto w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-1">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              {showLive ? (
                <AnimatedCounter target={stats[item.key]} />
              ) : (
                <div className="h-8 w-16 mx-auto rounded bg-muted animate-pulse" />
              )}
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
