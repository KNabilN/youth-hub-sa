import { Link } from "react-router-dom";
import { Store, User, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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

const approvalLabel: Record<string, { label: string; className: string }> = {
  approved: { label: "مقبول", className: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30" },
  pending: { label: "قيد المراجعة", className: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
};

export default function LandingServicesGrid({ services, loading }: LandingServicesGridProps) {
  if (!loading && services.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-8 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Store className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">الخدمات المتوفرة</h2>
          </div>
          <p className="text-muted-foreground">خدمات معتمدة من مقدمي خدمات محترفين</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {services.map((s) => {
              const status = approvalLabel[s.approval] || approvalLabel.approved;
              return (
                <Card key={s.id} className="card-hover">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={status.className}>{status.label}</Badge>
                      <span className="font-bold text-primary">{s.price} ر.س</span>
                    </div>
                    <h3 className="font-bold text-lg">{s.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {s.provider && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {s.provider.full_name}
                        </span>
                      )}
                      {s.category && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          {s.category.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <Button asChild>
            <Link to="/auth?mode=register">تصفح جميع الخدمات</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
