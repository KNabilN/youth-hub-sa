import { useParams } from "react-router-dom";
import { useServiceDetail } from "@/hooks/useServiceDetail";
import { ServiceGallery } from "@/components/services/ServiceGallery";
import { ServicePackages } from "@/components/services/ServicePackages";
import { ServiceProviderCard } from "@/components/services/ServiceProviderCard";
import { ServiceFAQ } from "@/components/services/ServiceFAQ";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, ShoppingBag, Star, Paperclip } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAddToCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AttachmentList } from "@/components/attachments/AttachmentList";

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { service, isLoading, ratings, ratingsLoading } = useServiceDetail(id);
  const { user, role } = useAuth();
  const addToCart = useAddToCart();

  const canPurchase = role === "youth_association" || role === "donor";

  const handleAddToCart = () => {
    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً");
      return;
    }
    addToCart.mutate(service!.id, {
      onSuccess: () => toast.success("تمت إضافة الخدمة إلى السلة"),
      onError: () => toast.error("حدث خطأ أثناء الإضافة"),
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <Skeleton className="h-10 w-2/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2 rounded-xl" />
          <Skeleton className="h-60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto py-16 text-center">
        <p className="text-muted-foreground">الخدمة غير موجودة</p>
      </div>
    );
  }

  const gallery = (service.gallery as string[] | null) ?? [];
  const faq = (service.faq as Array<{ question: string; answer: string }> | null) ?? [];
  const packages = (service.packages as Array<{ name: string; description: string; price: number; old_price?: number }> | null) ?? [];
  const longDesc = (service.long_description as string | null) ?? "";
  const provider = service.profiles as any;

  // Compute average rating
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + (r.quality_score + r.communication_score + r.timing_score) / 3, 0) / ratings.length).toFixed(1)
    : null;

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">{service.title}</h1>
        {(service as any).service_number && (
          <span className="text-sm font-semibold font-mono text-primary">{(service as any).service_number}</span>
        )}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {service.categories && <Badge variant="secondary">{(service.categories as any).name}</Badge>}
          {service.regions && <Badge variant="outline">{(service.regions as any).name}</Badge>}
          {(service as any).cities && <Badge variant="outline">{(service as any).cities.name}</Badge>}
          {avgRating && (
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              {avgRating} ({ratings.length})
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            {service.service_views ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <ShoppingBag className="h-4 w-4" />
            {service.sales_count ?? 0} مبيعات
          </span>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gallery */}
        <div className="lg:col-span-2">
          <ServiceGallery mainImage={service.image_url || (service.categories as any)?.image_url} gallery={gallery} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <ServicePackages
            packages={packages}
            basePrice={service.price}
            baseDescription={service.description}
            serviceType={service.service_type}
            onAddToCart={handleAddToCart}
            canPurchase={canPurchase}
            isAdding={addToCart.isPending}
          />
          {provider && (
            <ServiceProviderCard provider={provider} />
          )}
        </div>
      </div>

      {/* Long description */}
      {(longDesc || service.description) && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">وصف الخدمة</h2>
          <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
            {longDesc || service.description}
          </div>
        </div>
      )}

      {/* FAQ */}
      <ServiceFAQ items={faq} />

      {/* Attachments */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          المرفقات
        </h2>
        <AttachmentList entityType="service" entityId={id} />
      </div>

      {/* Ratings */}
      {ratings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold">التقييمات ({ratings.length})</h2>
          <div className="grid gap-3">
            {ratings.map((r: any) => {
              const avg = ((r.quality_score + r.communication_score + r.timing_score) / 3).toFixed(1);
              return (
                <div key={r.id} className="rounded-xl border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={r.profiles?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {r.profiles?.full_name?.[0] || "؟"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{r.profiles?.full_name}</span>
                    <span className="flex items-center gap-1 text-sm text-yellow-600">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {avg}
                    </span>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
