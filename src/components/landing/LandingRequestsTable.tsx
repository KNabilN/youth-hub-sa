import { useRef } from "react";
import { Link } from "react-router-dom";
import { FolderKanban, Calendar, Building2, Tag, Banknote, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  created_at: string;
  required_skills: string[] | null;
  category: { name: string } | null;
  association: { full_name: string; organization_name: string | null } | null;
}

interface LandingRequestsTableProps {
  projects: Project[];
  loading: boolean;
}

export default function LandingRequestsTable({ projects, loading }: LandingRequestsTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -360 : 360, behavior: "smooth" });
  };

  if (!loading && projects.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-pattern">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-2">
            <FolderKanban className="w-4 h-4" />
            <span>طلبات مفتوحة</span>
          </div>
          <h2 className="text-3xl font-bold">طلبات الجمعيات</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            تصفّح أحدث الطلبات المفتوحة وقدّم عرضك الآن
          </p>
        </div>

        <div className="relative">
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
                <Skeleton key={i} className="h-52 min-w-[340px] w-[340px] shrink-0 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div ref={scrollRef} className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {projects.map((p) => {
                const assocName = p.association?.organization_name || p.association?.full_name || "—";
                return (
                  <Link
                    to={`/projects/public/${p.id}`}
                    key={p.id}
                    className="group relative rounded-2xl border border-border bg-card p-6 space-y-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20 min-w-[340px] w-[340px] shrink-0 snap-start block"
                  >
                    <div className="flex items-center justify-between gap-3">
                      {p.category && (
                        <Badge variant="secondary" className="gap-1 font-medium">
                          <Tag className="w-3 h-3" />
                          {p.category.name}
                        </Badge>
                      )}
                      {p.budget != null && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary bg-primary/8 rounded-full px-3 py-1">
                          <Banknote className="w-4 h-4" />
                          {p.budget.toLocaleString("ar-SA")} ر.س
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-lg leading-snug group-hover:text-primary transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                    {p.required_skills && p.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {p.required_skills.slice(0, 4).map((skill) => (
                          <span key={skill} className="text-xs bg-muted text-muted-foreground rounded-md px-2 py-0.5 border border-border">
                            {skill}
                          </span>
                        ))}
                        {p.required_skills.length > 4 && (
                          <span className="text-xs text-muted-foreground px-1">+{p.required_skills.length - 4}</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-4 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {assocName}
                      </span>
                      <span className="flex items-center gap-1.5 mr-auto" dir="ltr">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(p.created_at).toLocaleDateString("en-CA").replace(/-/g, "/")}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <Button asChild size="lg" className="gap-2 rounded-xl px-8 text-base shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20 transition-shadow">
            <Link to="/auth?mode=register">
              سجّل لتقديم عروضك
              <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
