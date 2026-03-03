import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, ArrowLeft } from "lucide-react";

interface AssociationCardProps {
  full_name: string;
  organization_name?: string | null;
  bio?: string | null;
  is_verified: boolean;
  avatar_url?: string | null;
}

export function AssociationCard({ full_name, organization_name, bio, is_verified, avatar_url }: AssociationCardProps) {
  const displayName = organization_name || full_name;
  const initials = displayName?.[0] ?? "؟";

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60 hover:border-primary/30 h-full">
      {/* Decorative top bar */}
      <div className="h-1.5 bg-gradient-to-l from-primary/60 via-primary/30 to-transparent" />

      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-primary/10 shrink-0">
            {avatar_url ? (
              <img src={avatar_url} alt={displayName} className="w-full h-full object-cover rounded-full" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm truncate">{displayName}</h3>
              {is_verified && (
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
              )}
            </div>
            {organization_name && (
              <p className="text-xs text-muted-foreground truncate">{full_name}</p>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed min-h-[2.5rem]">
          {bio || "لا يوجد وصف"}
        </p>

        <div className="flex items-center justify-between pt-1">
          {is_verified && (
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              موثقة
            </Badge>
          )}
          <span className="text-xs text-muted-foreground flex items-center gap-1 mr-auto group-hover:text-primary transition-colors">
            عرض الملف <ArrowLeft className="h-3 w-3 group-hover:-translate-x-1 transition-transform" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
