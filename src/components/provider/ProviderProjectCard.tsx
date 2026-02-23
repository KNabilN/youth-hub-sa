import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign } from "lucide-react";

interface ProviderProjectCardProps {
  project: {
    id: string;
    title: string;
    description: string;
    budget: number | null;
    estimated_hours: number | null;
    required_skills: string[] | null;
    categories?: { name: string } | null;
    regions?: { name: string } | null;
  };
  onViewDetails: (id: string) => void;
}

export function ProviderProjectCard({ project, onViewDetails }: ProviderProjectCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{project.title}</CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {project.categories?.name && <Badge variant="secondary" className="text-xs">{project.categories.name}</Badge>}
          {project.regions?.name && (
            <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{project.regions.name}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        <div className="flex items-center gap-4 text-sm">
          {project.budget != null && (
            <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />{project.budget} ر.س</span>
          )}
          {project.estimated_hours != null && (
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{project.estimated_hours} ساعة</span>
          )}
        </div>
        {project.required_skills && project.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.required_skills.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full" onClick={() => onViewDetails(project.id)}>
          عرض التفاصيل وتقديم عرض
        </Button>
      </CardContent>
    </Card>
  );
}
