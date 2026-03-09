import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useMyGrants, useCreateGrantRequest, useVerifiedDonors, useAssociationProjects } from "@/hooks/useGrantRequests";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HandCoins, Plus, FileText, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { ContentSkeleton } from "@/components/ContentSkeleton";
import { PaginationControls } from "@/components/PaginationControls";
import { usePagination } from "@/hooks/usePagination";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "بانتظار المراجعة", variant: "secondary" },
  approved: { label: "تمت الموافقة", variant: "default" },
  rejected: { label: "مرفوض", variant: "destructive" },
  funded: { label: "تم التمويل", variant: "default" },
};

export default function MyGrants() {
  const { user } = useAuth();
  const { data: grants, isLoading } = useMyGrants();
  const createGrant = useCreateGrantRequest();
  const { data: donors } = useVerifiedDonors();
  const { data: myProjects } = useAssociationProjects(user?.id);

  const [open, setOpen] = useState(false);
  const [donorOpen, setDonorOpen] = useState(false);
  const [isTargeted, setIsTargeted] = useState(false);
  const [donorId, setDonorId] = useState("");
  const [grantType, setGrantType] = useState<"general" | "project">("general");
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [beneficiariesCount, setBeneficiariesCount] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    if (!grants) return [];
    if (statusFilter === "all") return grants;
    return grants.filter(g => g.status === statusFilter);
  }, [grants, statusFilter]);

  const { page, pageSize, nextPage, prevPage, resetPage } = usePagination();
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const resetForm = () => {
    setIsTargeted(false);
    setDonorId("");
    setGrantType("general");
    setProjectId("");
    setAmount("");
    setDescription("");
    setPurpose("");
    setTargetGroup("");
    setBeneficiariesCount("");
    setUrgency("normal");
  };

  const handleSubmit = () => {
    if (!user || !amount) return;
    createGrant.mutate({
      association_id: user.id,
      donor_id: isTargeted ? donorId || null : null,
      project_id: grantType === "project" ? projectId || null : null,
      amount: Number(amount),
      description,
      purpose,
      target_group: targetGroup,
      beneficiaries_count: beneficiariesCount ? Number(beneficiariesCount) : null,
      urgency,
    }, {
      onSuccess: () => {
        toast({ title: "تم إنشاء طلب المنحة بنجاح" });
        setOpen(false);
        resetForm();
      },
      onError: (err: any) => toast({ title: "حدث خطأ", description: err?.message || "تعذّر إنشاء طلب المنحة", variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-xl p-3">
              <HandCoins className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">طلبات المنح</h1>
              <p className="text-sm text-muted-foreground">طلبات المنح التي أنشأتها جمعيتكم</p>
            </div>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 me-2" /> طلب منحة جديدة</Button>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-primary/60 via-primary/20 to-transparent" />

        {/* Status Filter */}
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-3 px-4 flex items-center justify-between flex-wrap gap-3">
            <span className="text-sm font-medium text-muted-foreground">تصفية حسب الحالة</span>
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); resetPage(); }}>
              <SelectTrigger className="w-[180px] bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">بانتظار المراجعة</SelectItem>
                <SelectItem value="approved">تمت الموافقة</SelectItem>
                <SelectItem value="funded">تم التمويل</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? <ContentSkeleton /> : !filtered.length ? (
          <EmptyState icon={FileText} title={statusFilter !== "all" ? "لا توجد طلبات بهذه الحالة" : "لا توجد طلبات"} description="لم تقم بإنشاء أي طلبات منح بعد" />
        ) : (
          <>
            <div className="grid gap-4">
              {paginated.map(g => {
                const st = statusMap[g.status] || statusMap.pending;
                return (
                  <Card key={g.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={st.variant}>{st.label}</Badge>
                            {g.donor?.full_name && <Badge variant="outline">موجه لـ {g.donor.full_name}</Badge>}
                            {g.project?.title && <Badge variant="outline">مشروع: {g.project.title}</Badge>}
                          </div>
                          <p className="text-lg font-bold">{Number(g.amount).toLocaleString()} ر.س</p>
                          {g.description && <p className="text-sm text-muted-foreground line-clamp-2">{g.description}</p>}
                          {g.admin_note && g.status === "rejected" && (
                            <p className="text-sm text-destructive">سبب الرفض: {g.admin_note}</p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(g.created_at), "d MMM yyyy", { locale: ar })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {totalPages > 1 && (
              <PaginationControls page={page} pageSize={pageSize} totalFetched={paginated.length} onNext={nextPage} onPrev={prevPage} />
            )}
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={o => { if (!o) { setOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>طلب منحة جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>طلب موجه لمانح محدد</Label>
              <Switch checked={isTargeted} onCheckedChange={setIsTargeted} />
            </div>
            {isTargeted && (
              <div>
                <Label>اختر المانح</Label>
                <Popover open={donorOpen} onOpenChange={setDonorOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={donorOpen} className="w-full justify-between font-normal">
                      {donorId ? donors?.find(d => d.id === donorId)?.full_name : "اختر مانحاً"}
                      <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="ابحث عن مانح..." />
                      <CommandList>
                        <CommandEmpty>لا توجد نتائج</CommandEmpty>
                        <CommandGroup>
                          {donors?.map(d => (
                            <CommandItem key={d.id} value={d.full_name} onSelect={() => { setDonorId(d.id); setDonorOpen(false); }}>
                              <Check className={cn("me-2 h-4 w-4", donorId === d.id ? "opacity-100" : "opacity-0")} />
                              {d.full_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
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
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={!amount || createGrant.isPending}>
              {createGrant.isPending ? "جارٍ الإرسال..." : "إرسال الطلب"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
