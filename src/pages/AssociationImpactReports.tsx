import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAssociationImpactReports, useCreateImpactReport } from "@/hooks/useAssociationImpactReports";
import { useReceivedGrants } from "@/hooks/useAssociationGrants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContentSkeleton } from "@/components/ContentSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { BarChart3, Plus, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export default function AssociationImpactReports() {
  const { data: reports, isLoading } = useAssociationImpactReports();
  const { data: grants } = useReceivedGrants();
  const createReport = useCreateImpactReport();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [donorId, setDonorId] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // Unique donors from grants
  const donors = grants
    ? Array.from(new Map(grants.map((g: any) => [g.donor_id, { id: g.donor_id, name: g.profiles?.organization_name || g.profiles?.full_name || "مانح" }])).values())
    : [];

  const handleSubmit = async () => {
    if (!title || !donorId || !file) {
      toast.error("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    try {
      await createReport.mutateAsync({ title, description, donorId, file });
      toast.success("تم رفع تقرير الأثر بنجاح");
      setOpen(false);
      setTitle("");
      setDescription("");
      setDonorId("");
      setFile(null);
    } catch {
      toast.error("حدث خطأ أثناء رفع التقرير");
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage.from("impact-reports").createSignedUrl(filePath, 300);
    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = fileName;
      a.click();
    }
  };

  if (isLoading) return <DashboardLayout><ContentSkeleton /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">تقارير الأثر</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 me-1" /> رفع تقرير</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>رفع تقرير أثر جديد</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>العنوان *</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان التقرير" />
                </div>
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="وصف مختصر" />
                </div>
                <div className="space-y-2">
                  <Label>المانح المستهدف *</Label>
                  <Select value={donorId} onValueChange={setDonorId}>
                    <SelectTrigger><SelectValue placeholder="اختر المانح" /></SelectTrigger>
                    <SelectContent>
                      {donors.map((d: any) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ملف PDF *</Label>
                  <Input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
                <Button className="w-full" disabled={createReport.isPending} onClick={handleSubmit}>
                  <Upload className="h-4 w-4 me-1" />
                  {createReport.isPending ? "جاري الرفع..." : "رفع التقرير"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!reports?.length ? (
          <EmptyState icon={BarChart3} title="لا توجد تقارير أثر" description="ارفع تقارير أثر لتوضيح للمانحين كيف تم استخدام منحهم" />
        ) : (
          <Card>
            <CardHeader><CardTitle>التقارير المرفوعة</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>المانح</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>تحميل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>{r.profiles?.organization_name || r.profiles?.full_name || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(r.created_at), "d MMM yyyy", { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(r.file_path, r.file_name)}>
                          <FileText className="h-4 w-4 me-1" /> تحميل
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
