import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, User } from "lucide-react";

interface ServiceProviderCardProps {
  provider: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
    is_verified: boolean;
  };
}

export function ServiceProviderCard({ provider }: ServiceProviderCardProps) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <p className="text-sm font-medium text-muted-foreground">مقدم الخدمة</p>
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={provider.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {provider.full_name?.[0] || "؟"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm">{provider.full_name}</span>
            {provider.is_verified && (
              <CheckCircle className="h-4 w-4 text-primary shrink-0" />
            )}
          </div>
          {provider.bio && (
            <p className="text-xs text-muted-foreground mt-0.5">{provider.bio}</p>
          )}
        </div>
      </div>
      <Button variant="outline" size="sm" className="w-full" asChild>
        <Link to={`/profile/${provider.id}`}>
          <User className="h-4 w-4 me-1" />
          عرض الملف الشخصي
        </Link>
      </Button>
    </div>
  );
}
