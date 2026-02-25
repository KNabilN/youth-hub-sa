import { useEffect, useRef, useState } from "react";
import { Users, Store, FolderKanban, CheckCircle } from "lucide-react";

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

  return <div ref={ref} className="text-3xl md:text-4xl font-bold gradient-text">{count}+</div>;
}

const statItems = [
  { key: "providers" as const, label: "مقدم خدمة", icon: Users },
  { key: "associations" as const, label: "جمعية مسجلة", icon: FolderKanban },
  { key: "completed_projects" as const, label: "مشروع مكتمل", icon: CheckCircle },
  { key: "approved_services" as const, label: "خدمة معتمدة", icon: Store },
];

export default function LiveStats({ stats, loading }: LiveStatsProps) {
  if (loading || !stats) {
    return (
      <section className="py-12 px-4 border-y border-border bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-10 w-20 mx-auto rounded bg-muted animate-pulse" />
                <div className="h-4 w-24 mx-auto rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 border-y border-border bg-card/50">
      <div className="container mx-auto max-w-4xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {statItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.key} className="text-center space-y-2">
                <div className="mx-auto w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <AnimatedCounter target={stats[item.key]} />
                <div className="text-sm text-muted-foreground">{item.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
