import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, FileText, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface ContractCardProps {
  contract: any;
  canSign: boolean;
  onSign: (id: string) => void;
  isSignPending: boolean;
}

function getStatus(c: any) {
  if (c.association_signed_at && c.provider_signed_at) return { label: "موقّع بالكامل", variant: "default" as const };
  if (c.association_signed_at || c.provider_signed_at) return { label: "موقّع جزئياً", variant: "secondary" as const };
  return { label: "غير موقّع", variant: "outline" as const };
}

export function ContractCard({ contract, canSign, onSign, isSignPending }: ContractCardProps) {
  const status = getStatus(contract);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">
            <Link to={`/projects/${contract.project_id}`} className="hover:underline">
              {contract.projects?.title ?? "—"}
            </Link>
          </CardTitle>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {contract.terms && <p className="text-muted-foreground">{contract.terms}</p>}
        <div className="grid grid-cols-2 gap-2">
          <span className="text-muted-foreground">مقدم الخدمة:</span>
          <span>{contract.profiles?.full_name ?? "—"}</span>
          <span className="text-muted-foreground">توقيع الجمعية:</span>
          <span className="flex items-center gap-1">
            {contract.association_signed_at ? (
              <><Check className="h-3.5 w-3.5 text-green-600" /> {new Date(contract.association_signed_at).toLocaleDateString("ar-SA")}</>
            ) : (
              <><Clock className="h-3.5 w-3.5 text-muted-foreground" /> لم يوقّع بعد</>
            )}
          </span>
          <span className="text-muted-foreground">توقيع مقدم الخدمة:</span>
          <span className="flex items-center gap-1">
            {contract.provider_signed_at ? (
              <><Check className="h-3.5 w-3.5 text-green-600" /> {new Date(contract.provider_signed_at).toLocaleDateString("ar-SA")}</>
            ) : (
              <><Clock className="h-3.5 w-3.5 text-muted-foreground" /> لم يوقّع بعد</>
            )}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {new Date(contract.created_at).toLocaleDateString("ar-SA")}
        </p>
        {canSign && (
          <Button size="sm" onClick={() => onSign(contract.id)} disabled={isSignPending}>
            <Check className="h-4 w-4 me-1" />
            توقيع العقد
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
