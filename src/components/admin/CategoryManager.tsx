import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Plus, Tag, Pencil, Check, X, FolderOpen, Loader2, Download, Upload, Lightbulb } from "lucide-react";
import { CategoryImageUpload } from "./CategoryImageUpload";
import { toast } from "sonner";

function exportCSV(items: any[], filename: string) {
  const header = "name,description";
  const rows = items.map(i => `"${(i.name || "").replace(/"/g, '""')}","${(i.description || "").replace(/"/g, '""')}"`);
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function CategoryManager() {
  const qc = useQueryClient();
  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Pending suggestions
  const { data: pending } = useQuery({
    queryKey: ["pending-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_categories" as any)
        .select("*, profiles:suggested_by(full_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false }) as any;
      if (error) throw error;
      return data as any[];
    },
  });
  const pendingCount = pending?.length ?? 0;

  const approveMut = useMutation({
    mutationFn: async (item: any) => {
      const { error: catErr } = await supabase.from("categories").insert({
        name: item.name,
        description: item.description || null,
      });
      if (catErr) throw catErr;
      const { error: updErr } = await supabase
        .from("pending_categories" as any)
        .update({ status: "approved", reviewed_at: new Date().toISOString() } as any)
        .eq("id", item.id) as any;
      if (updErr) throw updErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-categories"] });
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("تمت الموافقة وإضافة التصنيف");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rejectMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pending_categories" as any)
        .update({ status: "rejected", reviewed_at: new Date().toISOString() } as any)
        .eq("id", id) as any;
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-categories"] });
      toast.success("تم رفض الاقتراح");
    },
    onError: () => toast.error("حدث خطأ"),
  });

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const addMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("الاسم مطلوب");
      const { error } = await supabase.from("categories").insert({ name: name.trim(), description: desc.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); setName(""); setDesc(""); toast.success("تمت الإضافة"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description: string }) => {
      if (!name.trim()) throw new Error("الاسم مطلوب");
      const { error } = await supabase.from("categories").update({ name: name.trim(), description: description.trim() || null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); setEditId(null); toast.success("تم التحديث"); },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); toast.success("تم الحذف"); },
    onError: () => toast.error("لا يمكن حذف التصنيف"),
  });

  const startEdit = (c: any) => { setEditId(c.id); setEditName(c.name); setEditDesc(c.description || ""); };
  const cancelEdit = () => setEditId(null);
  const saveEdit = () => { if (editId) updateMut.mutate({ id: editId, name: editName, description: editDesc }); };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") addMut.mutate(); };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">التصنيفات</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && <Badge variant="destructive">{pendingCount} مقترح</Badge>}
            <Badge variant="secondary">{categories?.length ?? 0}</Badge>
          </div>
        </div>
        <CardDescription>تصنيفات الطلبات والخدمات المتاحة على المنصة</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="اسم التصنيف" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKeyDown} />
          <Input placeholder="وصف (اختياري)" value={desc} onChange={(e) => setDesc(e.target.value)} onKeyDown={handleKeyDown} />
          <Button onClick={() => addMut.mutate()} disabled={addMut.isPending} className="min-w-[100px]">
            {addMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            اضافة
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV(categories ?? [], "categories.csv")}>
            <Download className="h-4 w-4 me-1" /> تصدير CSV
          </Button>
          <Button variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4 me-1" /> استيراد CSV
              <input type="file" accept=".csv" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                const lines = text.split("\n").filter(l => l.trim());
                const rows = lines.slice(1).map(l => {
                  const match = l.match(/"([^"]*)","?([^"]*)"?/);
                  return match ? { name: match[1], description: match[2] || null } : null;
                }).filter(Boolean) as { name: string; description: string | null }[];
                if (rows.length === 0) { toast.error("الملف فارغ"); return; }
                const { error } = await supabase.from("categories").insert(rows);
                if (error) { toast.error("خطأ في الاستيراد"); return; }
                qc.invalidateQueries({ queryKey: ["admin-categories"] });
                toast.success(`تم استيراد ${rows.length} تصنيف`);
                e.target.value = "";
              }} />
            </label>
          </Button>
        </div>

        {(categories ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FolderOpen className="h-10 w-10 mb-2" />
            <p className="text-sm">لا توجد تصنيفات بعد</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">صورة</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(categories ?? []).map((c: any) => (
                <TableRow key={c.id} className="hover:bg-muted/50">
                  {editId === c.id ? (
                    <>
                      <TableCell>
                        <CategoryImageUpload categoryId={c.id} categoryName={c.name} currentImageUrl={c.image_url} />
                      </TableCell>
                      <TableCell>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} />
                      </TableCell>
                      <TableCell>
                        <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="h-8" onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={saveEdit} disabled={updateMut.isPending}><Check className="h-4 w-4 text-emerald-600" /></Button>
                          <Button size="icon" variant="ghost" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        <CategoryImageUpload categoryId={c.id} categoryName={c.name} currentImageUrl={c.image_url} />
                      </TableCell>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.description || "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(c)}><Pencil className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف التصنيف</AlertDialogTitle>
                                <AlertDialogDescription>هل أنت متأكد من حذف "{c.name}"؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => delMut.mutate(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pending Suggestions Section */}
        {pendingCount > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold">تصنيفات مقترحة ({pendingCount})</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>مقترح من</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.entity_type === "service" ? "خدمة" : "مشروع"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.profiles?.full_name || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => approveMut.mutate(item)} disabled={approveMut.isPending} title="موافقة">
                            <Check className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => rejectMut.mutate(item.id)} disabled={rejectMut.isPending} title="رفض">
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
