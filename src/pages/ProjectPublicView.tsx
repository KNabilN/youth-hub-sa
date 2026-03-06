import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag, Building2, MapPin, Calendar, ArrowLeft } from "lucide-react";

export default function ProjectPublicView() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project-public", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("get_public_project", { p_id: id! } as any);
      if (error) throw error;
      return data as {
        id: string;
        title: string;
        description: string;
        status: string;
        required_skills: string[] | null;
        created_at: string;
        is_name_visible: boolean;
        category: { name: string } | null;
        region: { name: string } | null;
        association: { full_name: string; organization_name: string | null; avatar_url: string | null } | null;
      } | null;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl py-16 px-4 space-y-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto max-w-3xl py-16 px-4 text-center space-y-4">
        <h1 className="text-2xl font-bold">المشروع غير موجود</h1>
        <Button asChild variant="outline">
          <Link to="/">العودة للرئيسية</Link>
        </Button>
      </div>
    );
  }

  const assocName = (project.is_name_visible !== false)
    ? (project.association?.organization_name || project.association?.full_name || "—")
    : "جمعية مجهولة";

  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {project.category && (
            <Badge variant="secondary" className="gap-1 text-sm">
              <Tag className="w-3.5 h-3.5" />
              {project.category.name}
            </Badge>
          )}
          {project.region && (
            <Badge variant="outline" className="gap-1 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {project.region.name}
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold">{project.title}</h1>
      </div>

      {/* Description */}
      <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
        {project.description}
      </div>

      {/* Details card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="w-4 h-4" />
          {assocName}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground" dir="ltr">
          <Calendar className="w-4 h-4" />
          {new Date(project.created_at).toLocaleDateString("en-CA").replace(/-/g, "/")}
        </div>

        {project.required_skills && project.required_skills.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">المهارات المطلوبة</span>
            <div className="flex flex-wrap gap-2">
              {project.required_skills.map((skill) => (
                <span
                  key={skill}
                  className="text-xs bg-muted text-muted-foreground rounded-md px-2.5 py-1 border border-border"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <Button asChild size="lg" className="gap-2 rounded-xl px-8 text-base">
          <Link to="/auth?mode=register">
            سجّل دخولك لتقديم عرض
            <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
