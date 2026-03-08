import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, Building2, ExternalLink, CheckCircle2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProviderProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    budget: number | null;
    estimated_hours: number | null;
    required_skills: string[] | null;
    created_at?: string;
    is_name_visible?: boolean;
    association_id?: string;
    categories?: { name: string } | null;
    regions?: { name: string } | null;
    cities?: { name: string } | null;
    profiles?: { full_name: string; avatar_url: string | null; organization_name: string | null } | null;
  };
  hasBid?: boolean;
  onViewDetails: (id: string) => void;
}

export function ProviderProjectCard({ project, hasBid, onViewDetails }: ProviderProjectCardProps) {
  const assocName = project.profiles?.organization_name || project.profiles?.full_name || "جمعية";

  // Check if project is less than 24 hours old
  const isNew = project.created_at
    ? (Date.now() - new Date(project.created_at).getTime()) < 24 * 60 * 60 * 1000
    : false;

  return (
    <Card className="card-hover border-t-4 border-primary/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{project.title}</CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            {isNew && (
              <Badge className="gap-1 bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5">
                <Sparkles className="h-2.5 w-2.5" />
                جديد
              </Badge>
            )}
            {hasBid && (
              <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                تم التقديم
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          {project.is_name_visible && project.profiles ? (
            <Link to={`/profile/${project.association_id}`} className="flex items-center gap-1 group hover:text-primary transition-colors">
              <Avatar className="h-4 w-4">
                <AvatarImage src={project.profiles.avatar_url ?? undefined} />
                <AvatarFallback><Building2 className="h-2.5 w-2.5" /></AvatarFallback>
              </Avatar>
              <span>{assocName}</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-muted-foreground"><Building2 className="h-3 w-3" />جمعية مجهولة</span>
          )}
          {project.categories?.name && <Badge variant="secondary" className="text-xs">{project.categories.name}</Badge>}
          {project.regions?.name && (
            <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{project.regions.name}{project.cities?.name ? ` - ${project.cities.name}` : ""}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        <div className="flex items-center gap-3 text-sm">
          {project.budget != null && (
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-md text-xs">
              <DollarSign className="h-3.5 w-3.5" />{project.budget} ر.س
            </span>
          )}
          {project.estimated_hours != null && (
            <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md text-xs">
              <Clock className="h-3.5 w-3.5" />{project.estimated_hours} ساعة
            </span>
          )}
        </div>
        {project.required_skills && project.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.required_skills.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
          </div>
        )}
        <Button
          size="sm"
          variant={hasBid ? "outline" : "default"}
          className={hasBid ? "w-full" : "w-full bg-gradient-to-l from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-sm"}
          onClick={() => onViewDetails(project.id)}
        >
          {hasBid ? "عرض التفاصيل (تم التقديم)" : "عرض التفاصيل وتقديم عرض"}
        </Button>
      </CardContent>
    </Card>
  );
}
