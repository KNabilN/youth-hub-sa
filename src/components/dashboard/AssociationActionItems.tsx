import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import { FileSignature, Clock, PackageCheck, HandCoins } from "lucide-react";

export function AssociationActionItems() {
  const { user } = useAuth();

  const { data: unsignedContracts } = useQuery({
    queryKey: ["assoc-unsigned-contracts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id")
        .eq("association_id", user!.id)
        .is("association_signed_at", null)
        .is("deleted_at", null);
      if (error) throw error;
      return data?.length ?? 0;
    },
  });

  const { data: pendingTimeLogs } = useQuery({
    queryKey: ["assoc-pending-timelogs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: projectIds } = await supabase
        .from("projects")
        .select("id")
        .eq("association_id", user!.id)
        .is("deleted_at", null);
      if (!projectIds?.length) return 0;
      const { count, error } = await supabase
        .from("time_logs")
        .select("id", { count: "exact", head: true })
        .eq("approval", "pending")
        .in("project_id", projectIds.map(p => p.id));
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: pendingDeliverables } = useQuery({
    queryKey: ["assoc-pending-deliverables", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: projectIds } = await supabase
        .from("projects")
        .select("id")
        .eq("association_id", user!.id)
        .is("deleted_at", null);
      if (!projectIds?.length) return 0;
      const { count, error } = await supabase
        .from("project_deliverables")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_review")
        .in("project_id", projectIds.map(p => p.id));
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: pendingGrants } = useQuery({
    queryKey: ["assoc-pending-grants", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("grant_requests")
        .select("id", { count: "exact", head: true })
        .eq("association_id", user!.id)
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const hasItems = (unsignedContracts ?? 0) > 0 || (pendingTimeLogs ?? 0) > 0 || (pendingDeliverables ?? 0) > 0 || (pendingGrants ?? 0) > 0;
  if (!hasItems) return null;

  return (
    <div className="space-y-2">
      {(unsignedContracts ?? 0) > 0 && (
        <Alert className="border-primary bg-primary/5 animate-fade-in">
          <FileSignature className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <span>لديك {unsignedContracts} عقود بحاجة إلى توقيعك</span>
            <Link to="/contracts" className="text-sm font-medium text-primary underline">عرض العقود</Link>
          </AlertDescription>
        </Alert>
      )}
      {(pendingTimeLogs ?? 0) > 0 && (
        <Alert className="border-warning bg-warning/5 animate-fade-in">
          <Clock className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center justify-between">
            <span>{pendingTimeLogs} سجل ساعات بانتظار موافقتك</span>
            <Link to="/time-logs" className="text-sm font-medium text-primary underline">مراجعة الساعات</Link>
          </AlertDescription>
        </Alert>
      )}
      {(pendingDeliverables ?? 0) > 0 && (
        <Alert className="border-info bg-info/5 animate-fade-in">
          <PackageCheck className="h-4 w-4 text-info" />
          <AlertDescription className="flex items-center justify-between">
            <span>{pendingDeliverables} تسليمات بانتظار المراجعة</span>
            <Link to="/projects" className="text-sm font-medium text-primary underline">عرض الطلبات</Link>
          </AlertDescription>
        </Alert>
      )}
      {(pendingGrants ?? 0) > 0 && (
        <Alert className="border-accent bg-accent/5 animate-fade-in">
          <HandCoins className="h-4 w-4 text-accent-foreground" />
          <AlertDescription className="flex items-center justify-between">
            <span>{pendingGrants} طلبات منح معلقة</span>
            <Link to="/my-grants" className="text-sm font-medium text-primary underline">عرض طلبات المنح</Link>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
