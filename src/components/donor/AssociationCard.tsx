import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface AssociationCardProps {
  full_name: string;
  organization_name?: string | null;
  bio?: string | null;
  is_verified: boolean;
}

export function AssociationCard({ full_name, organization_name, bio, is_verified }: AssociationCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{organization_name || full_name}</CardTitle>
              {organization_name && <p className="text-xs text-muted-foreground">{full_name}</p>}
            </div>
          </div>
          {is_verified && <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">موثقة</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{bio || "لا يوجد وصف"}</p>
      </CardContent>
    </Card>
  );
}
