import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Plus, MapPin, Pencil, Check, X, Globe, Loader2, Download, Upload } from "lucide-react";
import { toast } from "sonner";

function exportCSV(items: any[], filename: string) {
  const header = "name";
  const rows = items.map(i => `"${(i.name || "").replace(/"/g, '""')}"`);
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function RegionManager() {
  const qc = useQueryClient();
  const { data: regions } = useQuery({
    queryKey: ["admin-regions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("regions").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const addMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("الاسم مطلوب");
      const { error } = await supabase.from("regions").insert({ name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-regions"] }); setName(""); toast.success("تمت الإضافة"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!name.trim()) throw new Error("الاسم مطلوب");
      const { error } = await supabase.from("regions").update({ name: name.trim() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-regions"] }); setEditId(null); toast.success("تم التحديث"); },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("regions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-regions"] }); toast.success("تم الحذف"); },
    onError: () => toast.error("لا يمكن حذف المنطقة"),
  });

  const startEdit = (r: any) => { setEditId(r.id); setEditName(r.name); };
  const cancelEdit = () => setEditId(null);
  const saveEdit = () => { if (editId) updateMut.mutate({ id: editId, name: editName }); };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter") addMut.mutate(); };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">المناطق</CardTitle>
          </div>
          <Badge variant="secondary">{regions?.length ?? 0}</Badge>
        </div>
        <CardDescription>المناطق الجغرافية المتاحة لتصنيف المشاريع والخدمات</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="اسم المنطقة" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKeyDown} />
          <Button onClick={() => addMut.mutate()} disabled={addMut.isPending} className="min-w-[100px]">
            {addMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            اضافة
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV(regions ?? [], "regions.csv")}>
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
                  const name = l.replace(/^"/, "").replace(/"$/, "").trim();
                  return name ? { name } : null;
                }).filter(Boolean) as { name: string }[];
                if (rows.length === 0) { toast.error("الملف فارغ"); return; }
                const { error } = await supabase.from("regions").insert(rows);
                if (error) { toast.error("خطأ في الاستيراد"); return; }
                qc.invalidateQueries({ queryKey: ["admin-regions"] });
                toast.success(`تم استيراد ${rows.length} منطقة`);
                e.target.value = "";
              }} />
            </label>
          </Button>
        </div>

        {(regions ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Globe className="h-10 w-10 mb-2" />
            <p className="text-sm">لا توجد مناطق بعد</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(regions ?? []).map((r: any) => (
                <TableRow key={r.id} className="hover:bg-muted/50">
                  {editId === r.id ? (
                    <>
                      <TableCell>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8" onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} />
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
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(r)}><Pencil className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف المنطقة</AlertDialogTitle>
                                <AlertDialogDescription>هل أنت متأكد من حذف "{r.name}"؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => delMut.mutate(r.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction>
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
      </CardContent>
    </Card>
  );
}
