import { useSiteContent } from "@/hooks/useSiteContent";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

export default function Testimonials() {
  const { data } = useSiteContent("testimonials");
  const t = data || { title: "آراء العملاء", subtitle: "", items: [] };

  if (!t.items?.length) return null;

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">{t.title}</h2>
          {t.subtitle && <p className="text-muted-foreground">{t.subtitle}</p>}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.items.map((item: any, idx: number) => (
            <Card key={idx} className="card-hover border-border">
              <CardContent className="pt-8 pb-8 px-8 space-y-4 text-center flex flex-col items-center">
                <Quote className="h-8 w-8 text-primary/30" />
                <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: item.rating || 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="border-t border-border pt-3">
                  <p className="font-semibold text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.org}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
