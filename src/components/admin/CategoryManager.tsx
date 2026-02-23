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
import { Trash2, Plus, Tag, Pencil, Check, X, FolderOpen } from "lucide-react";
import { toast } from "sonner";

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
          <Badge variant="secondary">{categories?.length ?? 0}</Badge>
        </div>
        <CardDescription>تصنيفات المشاريع والخدمات المتاحة على المنصة</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="اسم التصنيف" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleKeyDown} />
          <Input placeholder="وصف (اختياري)" value={desc} onChange={(e) => setDesc(e.target.value)} onKeyDown={handleKeyDown} />
          <Button size="icon" onClick={() => addMut.mutate()} disabled={addMut.isPending}><Plus className="h-4 w-4" /></Button>
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
      </CardContent>
    </Card>
  );
}
