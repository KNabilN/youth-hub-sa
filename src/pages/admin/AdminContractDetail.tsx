import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useContractDocument } from "@/hooks/useContractDocument";
import { ContractDocument, PrintContractButton } from "@/components/contracts/ContractDocument";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Eye, MessageSquare, ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function AdminContractDetail() {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const { data, isLoading } = useContractDocument(id);

 const { data: versions } = useQuery({
 queryKey: ["contract-versions", id],
 enabled: !!id,
 queryFn: async () => {
 const { data } = await supabase
 .from("contract_versions")
 .select("*")
 .eq("contract_id", id!)
 .order("version_number", { ascending: false });
 return data ?? [];
 },
 });

 if (isLoading || !data) {
 return (
 <DashboardLayout>
 <Skeleton className="h-96 w-full" />
 </DashboardLayout>
 );
 }

 const projectId = data.contract.project_id;

 return (
 <DashboardLayout>
 <div className="space-y-6">
 {/* Header */}
 <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
 <div className="flex items-center gap-3">
 <Button variant="ghost" size="icon" onClick={() => navigate("/admin/contracts")}>
 <ArrowRight className="h-5 w-5" />
 </Button>
 <div className="bg-primary/10 rounded-xl p-3">
 <ScrollText className="h-6 w-6 text-primary" />
 </div>
 <div>
 <h1 className="text-xl font-bold">عرض العقد الكامل</h1>
 <p className="text-xs text-muted-foreground">رؤية إدارية شاملة لكل بنود العقد ومدخلاته</p>
 </div>
 </div>
 <div className="flex gap-2">
 <PrintContractButton />
 <Button size="sm" variant="outline" onClick={() => navigate(`/admin/projects/${projectId}`)}>
 <Eye className="h-4 w-4 me-1" /> عرض المشروع
 </Button>
 <Button size="sm" variant="outline" onClick={() => navigate(`/admin/projects/${projectId}?tab=messages`)}>
 <MessageSquare className="h-4 w-4 me-1" /> المحادثات
 </Button>
 </div>
 </div>

 <ContractDocument data={data} />

 {versions && versions.length > 0 && (
 <Card className="print:hidden">
 <CardContent className="p-4 space-y-2">
 <h3 className="font-semibold text-sm">سجل النسخ السابقة ({versions.length})</h3>
 <div className="space-y-2">
 {versions.map((v: any) => (
 <div key={v.id} className="text-xs p-2 rounded border bg-muted/30">
 <p className="font-mono">النسخة #{v.version_number} — {new Date(v.created_at).toLocaleString("ar-SA")}</p>
 {v.change_note && <p className="text-muted-foreground mt-1">{v.change_note}</p>}
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}
 </div>
 </DashboardLayout>
 );
}
