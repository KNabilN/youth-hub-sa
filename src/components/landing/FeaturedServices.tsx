import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, ArrowLeft } from "lucide-react";

interface FeaturedService {
  id: string;
  title: string;
  description: string;
  price: number;
  service_type: string;
  image_url: string | null;
  category: { name: string } | null;
  region: { name: string } | null;
  provider: { full_name: string } | null;
}

interface FeaturedServicesProps {
  services: FeaturedService[];
  loading: boolean;
}

export default function FeaturedServices({ services, loading }: FeaturedServicesProps) {
  if (loading) {
    return (
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-48 mx-auto mb-3" />
            <Skeleton className="h-5 w-64 mx-auto" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!services.length) return null;

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-2 rounded-full mb-4">
            <Store className="w-4 h-4" />
            سوق الخدمات
          </div>
          <h2 className="text-3xl font-bold mb-3">أحدث الخدمات المتاحة</h2>
          <p className="text-muted-foreground">تصفح آخر الخدمات المعتمدة من مقدمي الخدمات المحترفين</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="card-hover overflow-hidden">
              {service.image_url && (
                <div className="h-40 overflow-hidden">
                  <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {service.category && <Badge variant="secondary" className="text-xs">{service.category.name}</Badge>}
                  {service.region && <Badge variant="outline" className="text-xs">{service.region.name}</Badge>}
                </div>
                <CardTitle className="text-base line-clamp-1">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                {service.provider && (
                  <p className="text-xs text-muted-foreground mt-2">بواسطة: {service.provider.full_name}</p>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between">
                <span className="font-bold text-primary">{service.price} ر.س</span>
                <Badge variant="outline" className="text-xs">
                  {service.service_type === "fixed_price" ? "سعر ثابت" : "بالساعة"}
                </Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button variant="outline" size="lg" asChild>
            <Link to="/auth">
              تصفح جميع الخدمات
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
