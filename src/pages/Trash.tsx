import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useTrashItems, useRestoreItem, usePermanentDelete, useEmptyTrash, type TrashTableName } from "@/hooks/useTrash";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, RotateCcw, Clock, Layers, FolderKanban, MessageSquare, Images, Gavel } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const tabConfig: { value: TrashTableName | "all"; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "الكل", icon: Trash2 },
  { value: "micro_services", label: "خدمات", icon: Layers },
  { value: "projects", label: "طلبات", icon: FolderKanban },
  { value: "support_tickets", label: "تذاكر", icon: MessageSquare },
  { value: "portfolio_items", label: "أعمال", icon: Images },
  { value: "disputes", label: "شكاوى", icon: Gavel },
];

export default function Trash() {
  const { data: items, isLoading } = useTrashItems();
  const restore = useRestoreItem();
  const permanentDelete = usePermanentDelete();
  const emptyTrash = useEmptyTrash();
  const { toast } = useToast();

  const [tab, setTab] = useState<string>("all");
  const [deletingItem, setDeletingItem] = useState<{ table: TrashTableName; id: string } | null>(null);
  const [emptyConfirm, setEmptyConfirm] = useState(false);

  const filtered = tab === "all" ? items : items?.filter(i => i.table === tab);

  const handleRestore = (table: TrashTableName, id: string) => {
    restore.mutate({ table, id }, {
      onSuccess: () => toast({ title: "تم استرجاع العنصر بنجاح" }),
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const handlePermanentDelete = () => {
    if (!deletingItem) return;
    permanentDelete.mutate(deletingItem, {
      onSuccess: () => { toast({ title: "تم الحذف نهائياً" }); setDeletingItem(null); },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  const handleEmptyTrash = () => {
    emptyTrash.mutate(undefined, {
      onSuccess: () => { toast({ title: "تم تفريغ سلة المحذوفات" }); setEmptyConfirm(false); },
      onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-destructive/10">
              <Trash2 className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">سلة المحذوفات</h1>
              <p className="text-sm text-muted-foreground">العناصر المحذوفة تبقى 30 يوماً قبل الحذف النهائي</p>
            </div>
          </div>
          {(items?.length ?? 0) > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setEmptyConfirm(true)}>
              <Trash2 className="h-4 w-4 me-2" />تفريغ السلة
            </Button>
          )}
        </div>
        <div className="h-1 rounded-full bg-gradient-to-l from-destructive/60 via-destructive/20 to-transparent" />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            {tabConfig.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs">
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
                {t.value === "all"
                  ? items?.length ? <Badge variant="secondary" className="text-[10px] px-1.5">{items.length}</Badge> : null
                  : items?.filter(i => i.table === t.value).length
                    ? <Badge variant="secondary" className="text-[10px] px-1.5">{items.filter(i => i.table === t.value).length}</Badge>
                    : null}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : !filtered?.length ? (
              <EmptyState icon={Trash2} title="السلة فارغة" description="لا توجد عناصر محذوفة" />
            ) : (
              <div className="space-y-3">
                {filtered.map(item => (
                  <Card key={`${item.table}-${item.id}`} className="hover:shadow-sm transition-shadow">
                    <CardContent className="flex items-center justify-between py-4 px-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">{item.tableLabel}</Badge>
                          <p className="font-medium text-sm truncate">{item.title}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            حُذف {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true, locale: ar })}
                          </span>
                          <span className={item.daysRemaining <= 5 ? "text-destructive font-medium" : ""}>
                            متبقي {item.daysRemaining} يوم
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => handleRestore(item.table, item.id)} disabled={restore.isPending}>
                          <RotateCcw className="h-3.5 w-3.5 me-1" />استرجاع
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeletingItem({ table: item.table, id: item.id })} disabled={permanentDelete.isPending}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Permanent delete confirmation */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف نهائي</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف هذا العنصر نهائياً ولا يمكن استرجاعه. هل تريد المتابعة؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete}>حذف نهائياً</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty trash confirmation */}
      <AlertDialog open={emptyConfirm} onOpenChange={setEmptyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تفريغ سلة المحذوفات</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف جميع العناصر نهائياً. لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleEmptyTrash} className="bg-destructive hover:bg-destructive/90">تفريغ السلة</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
