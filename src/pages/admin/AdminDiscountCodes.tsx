import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useDiscountCodes, useDiscountCodeUsages, useCreateDiscountCode, useUpdateDiscountCode, useDeleteDiscountCode, DiscountCode } from "@/hooks/useDiscountCodes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ContentSkeleton } from "@/components/ContentSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { Plus, Trash2, Pencil, Eye, Tags, Users, Calendar, Banknote } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function AdminDiscountCodes() {
  const { data: codes, isLoading } = useDiscountCodes();
  const createCode = useCreateDiscountCode();
  const updateCode = useUpdateDiscountCode();
  const deleteCode = useDeleteDiscountCode();

  const [createOpen, setCreateOpen] = useState(false);
  const [editCode, setEditCode] = useState<DiscountCode | null>(null);
  const [detailCode, setDetailCode] = useState<DiscountCode | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formCode, setFormCode] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formMaxUses, setFormMaxUses] = useState("");

  const resetForm = () => {
    setFormCode(""); setFormAmount(""); setFormStart(""); setFormEnd(""); setFormMaxUses("");
  };

  const openCreate = () => { resetForm(); setCreateOpen(true); };
  const openEdit = (c: DiscountCode) => {
    setFormCode(c.code);
    setFormAmount(String(c.amount));
    setFormStart(c.start_date);
    setFormEnd(c.end_date);
    setFormMaxUses(c.max_uses ? String(c.max_uses) : "");
    setEditCode(c);
  };

  const handleCreate = () => {
    if (!formCode || !formAmount || !formStart || !formEnd) return;
    createCode.mutate({
      code: formCode,
      amount: Number(formAmount),
      start_date: formStart,
      end_date: formEnd,
      max_uses: formMaxUses ? Number(formMaxUses) : null,
    }, { onSuccess: () => { setCreateOpen(false); resetForm(); } });
  };

  const handleEdit = () => {
    if (!editCode) return;
    updateCode.mutate({
      id: editCode.id,
      code: formCode,
      amount: Number(formAmount),
      start_date: formStart,
      end_date: formEnd,
      max_uses: formMaxUses ? Number(formMaxUses) : null,
    }, { onSuccess: () => { setEditCode(null); resetForm(); } });
  };

  const isActive = (c: DiscountCode) => {
    const today = new Date().toISOString().split("T")[0];
    return c.is_active && c.start_date <= today && c.end_date >= today;
  };

  if (isLoading) return <DashboardLayout><ContentSkeleton /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Tags className="h-6 w-6 text-primary" />
              أكواد الخصم
            </h1>
            <p className="text-sm text-muted-foreground">إنشاء وإدارة أكواد الخصم للجمعيات</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 me-2" />
            إنشاء كود جديد
          </Button>
        </div>

        {!codes?.length ? (
          <EmptyState title="لا توجد أكواد خصم" description="أنشئ أول كود خصم بالضغط على الزر أعلاه" />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكود</TableHead>
                    <TableHead>القيمة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الاستخدامات</TableHead>
                    <TableHead>البداية</TableHead>
                    <TableHead>النهاية</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((c) => (
                    <TableRow key={c.id} className="cursor-pointer" onClick={() => setDetailCode(c)}>
                      <TableCell className="font-mono font-bold">{c.code}</TableCell>
                      <TableCell>{c.amount.toLocaleString()} ر.س</TableCell>
                      <TableCell>
                        {isActive(c) ? (
                          <Badge className="bg-green-100 text-green-800">نشط</Badge>
                        ) : !c.is_active ? (
                          <Badge variant="secondary">معطل</Badge>
                        ) : (
                          <Badge variant="outline">منتهي</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {c.usage_count}{c.max_uses ? ` / ${c.max_uses}` : ""}
                      </TableCell>
                      <TableCell className="text-sm">{c.start_date}</TableCell>
                      <TableCell className="text-sm">{c.end_date}</TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => setDetailCode(c)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() =>
                            updateCode.mutate({ id: c.id, is_active: !c.is_active })
                          }>
                            <Switch checked={c.is_active} className="pointer-events-none" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(c.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <CodeFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          title="إنشاء كود خصم جديد"
          formCode={formCode} setFormCode={setFormCode}
          formAmount={formAmount} setFormAmount={setFormAmount}
          formStart={formStart} setFormStart={setFormStart}
          formEnd={formEnd} setFormEnd={setFormEnd}
          formMaxUses={formMaxUses} setFormMaxUses={setFormMaxUses}
          onSubmit={handleCreate}
          loading={createCode.isPending}
          submitLabel="إنشاء"
        />

        {/* Edit Dialog */}
        <CodeFormDialog
          open={!!editCode}
          onOpenChange={(v) => { if (!v) setEditCode(null); }}
          title="تعديل كود الخصم"
          formCode={formCode} setFormCode={setFormCode}
          formAmount={formAmount} setFormAmount={setFormAmount}
          formStart={formStart} setFormStart={setFormStart}
          formEnd={formEnd} setFormEnd={setFormEnd}
          formMaxUses={formMaxUses} setFormMaxUses={setFormMaxUses}
          onSubmit={handleEdit}
          loading={updateCode.isPending}
          submitLabel="حفظ التعديلات"
        />

        {/* Detail Sheet */}
        <CodeDetailSheet code={detailCode} onClose={() => setDetailCode(null)} />

        {/* Delete Confirm */}
        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(v) => { if (!v) setDeleteId(null); }}
          title="حذف كود الخصم"
          description="هل أنت متأكد من حذف هذا الكود؟ سيتم حذف جميع سجلات الاستخدام المرتبطة."
          confirmLabel="حذف"
          cancelLabel="إلغاء"
          loading={deleteCode.isPending}
          onConfirm={() => deleteId && deleteCode.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
        />
      </div>
    </DashboardLayout>
  );
}

function CodeFormDialog({ open, onOpenChange, title, formCode, setFormCode, formAmount, setFormAmount, formStart, setFormStart, formEnd, setFormEnd, formMaxUses, setFormMaxUses, onSubmit, loading, submitLabel }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string;
  formCode: string; setFormCode: (v: string) => void;
  formAmount: string; setFormAmount: (v: string) => void;
  formStart: string; setFormStart: (v: string) => void;
  formEnd: string; setFormEnd: (v: string) => void;
  formMaxUses: string; setFormMaxUses: (v: string) => void;
  onSubmit: () => void; loading: boolean; submitLabel: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>اسم الكود</Label>
            <Input value={formCode} onChange={(e) => setFormCode(e.target.value.toUpperCase())} placeholder="مثال: SAVE100" className="font-mono" dir="ltr" />
          </div>
          <div>
            <Label>قيمة الخصم (ر.س)</Label>
            <Input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="100" min="1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>تاريخ البداية</Label>
              <Input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)} />
            </div>
            <div>
              <Label>تاريخ النهاية</Label>
              <Input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>الحد الأقصى للاستخدام (اتركه فارغاً = بلا حد)</Label>
            <Input type="number" value={formMaxUses} onChange={(e) => setFormMaxUses(e.target.value)} placeholder="بلا حد" min="1" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSubmit} disabled={loading || !formCode || !formAmount || !formStart || !formEnd}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CodeDetailSheet({ code, onClose }: { code: DiscountCode | null; onClose: () => void }) {
  const { data: usages, isLoading } = useDiscountCodeUsages(code?.id ?? null);

  return (
    <Sheet open={!!code} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        {code && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-primary" />
                تفاصيل كود {code.code}
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">القيمة:</span>
                  <span className="font-bold">{code.amount.toLocaleString()} ر.س</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">الاستخدامات:</span>
                  <span className="font-bold">{code.usage_count}{code.max_uses ? ` / ${code.max_uses}` : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">من:</span>
                  <span>{code.start_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">إلى:</span>
                  <span>{code.end_date}</span>
                </div>
              </div>

              <Separator />

              <h3 className="font-semibold text-sm">سجل الاستخدامات</h3>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>
              ) : !usages?.length ? (
                <p className="text-sm text-muted-foreground">لم يتم استخدام هذا الكود بعد</p>
              ) : (
                <div className="space-y-2">
                  {usages.map((u) => (
                    <div key={u.id} className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{u.profiles?.organization_name || u.profiles?.full_name || "—"}</span>
                        <span className="font-bold text-primary">−{u.discount_amount.toLocaleString()} ر.س</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {u.projects?.title ? `مشروع: ${u.projects.title}` : ""}
                          {u.micro_services?.title ? `خدمة: ${u.micro_services.title}` : ""}
                          {!u.projects?.title && !u.micro_services?.title ? "—" : ""}
                        </span>
                        <span>{format(new Date(u.created_at), "d MMM yyyy", { locale: ar })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
