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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Trash2, Plus, MapPin, Pencil, Check, X, Globe, Loader2, Download, Upload, ChevronDown, Building2 } from "lucide-react";
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

function CityManager({ regionId, regionName }: { regionId: string; regionName: string }) {
  const qc = useQueryClient();
  const { data: cities } = useQuery({
    queryKey: ["cities", regionId],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("*").eq("region_id", regionId).order("name");
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
      const { error } = await supabase.from("cities").insert({ name: name.trim(), region_id: regionId });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cities", regionId] }); qc.invalidateQueries({ queryKey: ["admin-regions-with-cities"] }); setName(""); toast.success("تمت إضافة المدينة"); },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!name.trim()) throw new Error("الاسم مطلوب");
      const { error } = await supabase.from("cities").update({ name: name.trim() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cities", regionId] }); setEditId(null); toast.success("تم التحديث"); },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cities", regionId] }); qc.invalidateQueries({ queryKey: ["admin-regions-with-cities"] }); toast.success("تم حذف المدينة"); },
    onError: () => toast.error("لا يمكن حذف المدينة"),
  });

  return (
    <div className="ps-6 pe-2 py-3 space-y-3 border-s-2 border-primary/20 ms-4">
      <div className="flex gap-2">
        <Input placeholder="اسم المدينة" value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-sm" onKeyDown={(e) => { if (e.key === "Enter") addMut.mutate(); }} />
        <Button size="sm" onClick={() => addMut.mutate()} disabled={addMut.isPending} className="h-8 text-xs">
          {addMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          إضافة
        </Button>
      </div>
      {(cities ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">لا توجد مدن بعد</p>
      ) : (
        <div className="space-y-1">
          {(cities ?? []).map((c: any) => (
            <div key={c.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50 text-sm">
              {editId === c.id ? (
                <>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-7 text-sm flex-1" onKeyDown={(e) => { if (e.key === "Enter") updateMut.mutate({ id: editId, name: editName }); if (e.key === "Escape") setEditId(null); }} />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateMut.mutate({ id: editId, name: editName })}><Check className="h-3 w-3 text-emerald-600" /></Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditId(null)}><X className="h-3 w-3" /></Button>
                </>
              ) : (
                <>
                  <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="flex-1">{c.name}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditId(c.id); setEditName(c.name); }}><Pencil className="h-3 w-3" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-6 w-6"><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف المدينة</AlertDialogTitle>
                        <AlertDialogDescription>هل أنت متأكد من حذف "{c.name}"؟</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => delMut.mutate(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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

  // Fetch city counts per region
  const { data: cityCounts } = useQuery({
    queryKey: ["admin-regions-with-cities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("region_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(c => { counts[c.region_id] = (counts[c.region_id] || 0) + 1; });
      return counts;
    },
  });

  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [openRegions, setOpenRegions] = useState<Set<string>>(new Set());

  const toggleRegion = (id: string) => {
    setOpenRegions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

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
            <CardTitle className="text-lg">المناطق والمدن</CardTitle>
          </div>
          <Badge variant="secondary">{regions?.length ?? 0}</Badge>
        </div>
        <CardDescription>المناطق الجغرافية والمدن التابعة لها</CardDescription>
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
          <div className="space-y-1">
            {(regions ?? []).map((r: any) => {
              const cityCount = cityCounts?.[r.id] ?? 0;
              const isOpen = openRegions.has(r.id);
              return (
                <Collapsible key={r.id} open={isOpen} onOpenChange={() => toggleRegion(r.id)}>
                  <div className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-muted/50 border">
                    {editId === r.id ? (
                      <>
                        <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 flex-1" onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }} />
                        <Button size="icon" variant="ghost" onClick={saveEdit} disabled={updateMut.isPending}><Check className="h-4 w-4 text-emerald-600" /></Button>
                        <Button size="icon" variant="ghost" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
                      </>
                    ) : (
                      <>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </Button>
                        </CollapsibleTrigger>
                        <span className="font-medium flex-1">{r.name}</span>
                        <Badge variant="outline" className="text-xs">{cityCount} مدينة</Badge>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(r)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>حذف المنطقة</AlertDialogTitle>
                              <AlertDialogDescription>هل أنت متأكد من حذف "{r.name}"؟ سيتم حذف جميع المدن التابعة لها.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => delMut.mutate(r.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">حذف</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                  <CollapsibleContent>
                    <CityManager regionId={r.id} regionName={r.name} />
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
