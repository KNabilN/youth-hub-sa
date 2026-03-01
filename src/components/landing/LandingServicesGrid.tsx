import { useRef } from "react";
import { Link } from "react-router-dom";
import { Store, User, Tag, Banknote, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  service_type: string;
  image_url: string | null;
  approval: string;
  category: { name: string } | null;
  region: { name: string } | null;
  provider: { full_name: string } | null;
}

interface LandingServicesGridProps {
  services: Service[];
  loading: boolean;
}

export default function LandingServicesGrid({ services, loading }: LandingServicesGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 340;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  if (!loading && services.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-2">
            <Store className="w-4 h-4" />
            <span>خدمات معتمدة</span>
          </div>
          <h2 className="text-3xl font-bold">الخدمات المتوفرة</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            خدمات معتمدة من مقدمي خدمات محترفين
          </p>
        </div>

        <div className="relative group/scroll">
          {/* Scroll buttons */}
          <button
            onClick={() => scroll("right")}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-accent transition-colors"
            aria-label="التمرير لليمين"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => scroll("left")}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-accent transition-colors"
            aria-label="التمرير لليسار"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          {loading ? (
            <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-52 min-w-[320px] w-[320px] shrink-0 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {services.map((s) => (
                <Link
                  to={`/services/${s.id}`}
                  key={s.id}
                  className="group relative rounded-2xl border border-border bg-card p-6 space-y-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20 min-w-[320px] w-[320px] shrink-0 snap-start block"
                >
                  <div className="flex items-center justify-between gap-3">
                    {s.category && (
                      <Badge variant="secondary" className="gap-1 font-medium">
                        <Tag className="w-3 h-3" />
                        {s.category.name}
                      </Badge>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary bg-primary/8 rounded-full px-3 py-1">
                      <Banknote className="w-4 h-4" />
                      {s.price.toLocaleString("ar-SA")} ر.س
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors">
                      {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                    {s.provider && (
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {s.provider.full_name}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <Button asChild size="lg" className="gap-2 rounded-xl px-8 text-base shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20 transition-shadow">
            <Link to="/auth?mode=register">
              تصفح جميع الخدمات
              <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
