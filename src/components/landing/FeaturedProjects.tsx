import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban, ArrowLeft } from "lucide-react";

interface FeaturedProject {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  required_skills: string[] | null;
  association: { full_name: string; organization_name: string | null } | null;
}

interface FeaturedProjectsProps {
  projects: FeaturedProject[];
  loading: boolean;
}

export default function FeaturedProjects({ projects, loading }: FeaturedProjectsProps) {
  if (loading) {
    return (
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-48 mx-auto mb-3" />
            <Skeleton className="h-5 w-64 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!projects.length) return null;

  return (
    <section className="py-20 px-4 bg-card/50">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent-foreground text-sm font-medium px-4 py-2 rounded-full mb-4">
            <FolderKanban className="w-4 h-4" />
            طلبات مفتوحة
          </div>
          <h2 className="text-3xl font-bold mb-3">أحدث الطلبات المتاحة</h2>
          <p className="text-muted-foreground">انضم كمقدم خدمة وقدّم عروضك على الطلبات المفتوحة</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="card-hover">
              <CardHeader className="pb-2">
                <CardTitle className="text-base line-clamp-1">{project.title}</CardTitle>
                {project.association && (
                  <p className="text-xs text-muted-foreground">
                    {project.association.organization_name || project.association.full_name}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                {project.required_skills && project.required_skills.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-3">
                    {project.required_skills.slice(0, 4).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                    {project.required_skills.length > 4 && (
                      <Badge variant="outline" className="text-xs">+{project.required_skills.length - 4}</Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                {project.budget ? (
                  <span className="font-bold text-primary">{project.budget} ر.س</span>
                ) : (
                  <span className="text-sm text-muted-foreground">ميزانية مفتوحة</span>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button size="lg" asChild className="shadow-lg">
            <Link to="/auth?mode=register">
              سجّل للتقديم على الطلبات
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
