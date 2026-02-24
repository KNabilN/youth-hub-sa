import { usePortfolio } from "@/hooks/usePortfolio";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface PortfolioGridProps {
  providerId: string;
}

export function PortfolioGrid({ providerId }: PortfolioGridProps) {
  const { data: items } = usePortfolio(providerId);

  if (!items?.length) {
    return <p className="text-center py-6 text-muted-foreground">لا توجد أعمال سابقة</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Dialog key={item.id}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer group overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 space-y-0.5">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <img src={item.image_url} alt={item.title} className="w-full" />
            <div className="p-4 space-y-1">
              <h3 className="font-semibold">{item.title}</h3>
              {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
