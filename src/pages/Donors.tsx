import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useVerifiedDonors, useCreateGrantRequest, useAssociationProjects } from "@/hooks/useGrantRequests";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { HandCoins, Users, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { ContentSkeleton } from "@/components/ContentSkeleton";

export default function Donors() {
  const { user } = useAuth();
  const { data: donors, isLoading } = useVerifiedDonors();
  const createGrant = useCreateGrantRequest();
  const [search, setSearch] = useState("");
  const [selectedDonor, setSelectedDonor] = useState<any>(null);
  const [grantType, setGrantType] = useState<"general" | "project">("general");
  const [projectId, setProjectId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const { data: myProjects } = useAssociationProjects(user?.id);

  const filtered = donors?.filter(d =>
    d.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.organization_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    if (!user || !selectedDonor || !amount) return;
    createGrant.mutate({
      association_id: user.id,
      donor_id: selectedDonor.id,
      project_id: grantType === "project" ? projectId || null : null,
      amount: Number(amount),
      description,
    }, {
      onSuccess: () => {
        toast({ title: "تم إرسال طلب المنحة بنجاح" });
        setSelectedDonor(null);
        setAmount("");
        setDescription("");
        setProjectId("");
        setGrantType("general");
      },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> المانحون</h1>
            <p className="text-sm text-muted-foreground mt-1">تصفح المانحين الموثقين وأرسل طلبات المنح</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ابحث عن مانح..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
        </div>

        {isLoading ? <ContentSkeleton /> : !filtered?.length ? (
          <EmptyState icon={Users} title="لا يوجد مانحون" description="لم يتم العثور على مانحين موثقين حالياً" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(donor => (
              <Card key={donor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={donor.avatar_url || undefined} />
                      <AvatarFallback>{donor.full_name?.[0] || "؟"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{donor.full_name}</p>
                      {donor.organization_name && <p className="text-xs text-muted-foreground truncate">{donor.organization_name}</p>}
                    </div>
                    <Badge variant="outline" className="shrink-0">مانح موثق</Badge>
                  </div>
                  <Button className="w-full" variant="default" onClick={() => setSelectedDonor(donor)}>
                    <HandCoins className="h-4 w-4 me-2" /> طلب منحة
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedDonor} onOpenChange={open => !open && setSelectedDonor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>طلب منحة من {selectedDonor?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>نوع المنحة</Label>
              <Select value={grantType} onValueChange={(v: any) => setGrantType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">منحة عامة</SelectItem>
                  <SelectItem value="project">منحة لمشروع محدد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {grantType === "project" && (
              <div>
                <Label>اختر المشروع</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger><SelectValue placeholder="اختر مشروعاً" /></SelectTrigger>
                  <SelectContent>
                    {myProjects?.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>المبلغ المطلوب (ر.س)</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>وصف الطلب</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="اشرح سبب طلب المنحة..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDonor(null)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={!amount || createGrant.isPending}>
              {createGrant.isPending ? "جارٍ الإرسال..." : "إرسال الطلب"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
