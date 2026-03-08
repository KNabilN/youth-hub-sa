import { Link } from "react-router-dom";
import { FolderKanban, Calendar, Building2, Tag, Banknote, ArrowLeft, Eye } from "lucide-react";
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
  title?: string;
  subtitle?: string;
  buttonText?: string;
  isLoggedIn?: boolean;
  role?: string | null;
}

export default function LandingRequestsTable({ projects, loading, title, subtitle, buttonText, isLoggedIn, role }: LandingRequestsTableProps) {
  const isDisabled = role === "youth_association" || role === "super_admin";
  const isDonor = role === "donor";

  const getActionLabel = () => {
    if (!isLoggedIn) return "سجّل لتقديم عرضك";
    if (isDonor) return "قدّم منحة";
    return "قدّم عرضك";
  };

  const getActionLink = (projectId: string) => {
    if (!isLoggedIn) return "/auth?mode=register";
    if (isDonor) return `/donations`;
    return `/projects/public/${projectId}`;
  };
  if (!loading && projects.length === 0) return null;

  return (
    <section className="py-20 px-4 bg-pattern">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-2">
            <FolderKanban className="w-4 h-4" />
            <span>طلبات مفتوحة</span>
          </div>
          <h2 className="text-3xl font-bold">{title || "طلبات الجمعيات"}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {subtitle || "تصفّح أحدث الطلبات المفتوحة وقدّم عرضك الآن"}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {projects.map((p) => {
              const assocName = p.association?.organization_name || p.association?.full_name || "—";
              return (
                <div
                  key={p.id}
                  className="group relative rounded-2xl border border-border bg-card p-6 space-y-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20 flex flex-col"
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
                      {new Date(p.created_at).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 mt-auto">
                    <Button asChild variant="outline" size="sm" className="gap-1.5 rounded-lg text-sm">
                      <Link to={`/projects/public/${p.id}`}>
                        <Eye className="w-3.5 h-3.5" />
                        التفاصيل
                      </Link>
                    </Button>
                    {isDisabled ? (
                      <Button disabled size="sm" className="flex-1 gap-1.5 rounded-lg text-sm opacity-50">
                        {getActionLabel()}
                        <ArrowLeft className="w-3.5 h-3.5 rtl:-scale-x-100" />
                      </Button>
                    ) : (
                      <Button asChild size="sm" className="flex-1 gap-1.5 rounded-lg text-sm">
                        <Link to={getActionLink(p.id)}>
                          {getActionLabel()}
                          <ArrowLeft className="w-3.5 h-3.5 rtl:-scale-x-100" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center mt-12">
          {isDisabled ? (
            <Button disabled size="lg" className="gap-2 rounded-xl px-8 text-base opacity-50">
              عرض جميع الطلبات
              <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
            </Button>
          ) : (
            <Button asChild size="lg" className="gap-2 rounded-xl px-8 text-base shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20 transition-shadow">
              <Link to={isLoggedIn ? "/available-projects" : "/auth?mode=register"}>
                {isLoggedIn ? "عرض جميع الطلبات" : (buttonText || "سجّل لتقديم عروضك")}
                <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
