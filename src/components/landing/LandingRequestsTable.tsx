import { Link } from "react-router-dom";
import { FolderKanban, Calendar, Building2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

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
  if (!loading && projects.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-8 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <FolderKanban className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">طلبات الجمعيات</h2>
          </div>
          <p className="text-muted-foreground">أحدث طلبات الجمعيات على المنصة</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
          {projects.map((p) => {
              const assocName = p.association?.organization_name || p.association?.full_name || "—";
              return (
                <Card key={p.id} className="card-hover">
                  <CardContent className="p-5 space-y-3">
                    {p.budget != null && (
                      <div className="flex items-center justify-end">
                        <span className="font-bold text-primary">{p.budget} ر.س</span>
                      </div>
                    )}
                    <h3 className="font-bold text-lg">{p.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {assocName}
                      </span>
                      {p.category && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          {p.category.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(p.created_at).toLocaleDateString("en-CA").replace(/-/g, "/")}
                      </span>
                    </div>
                    {p.required_skills && p.required_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {p.required_skills.slice(0, 4).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <Button asChild>
            <Link to="/auth?mode=register">سجّل لتقديم عروضك</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
