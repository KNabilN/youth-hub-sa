import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

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

  const addMut = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("الاسم مطلوب");
      const { error } = await supabase.from("regions").insert({ name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-regions"] }); setName(""); toast.success("تمت الإضافة"); },
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

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">المناطق</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="اسم المنطقة" value={name} onChange={(e) => setName(e.target.value)} />
          <Button size="icon" onClick={() => addMut.mutate()} disabled={addMut.isPending}><Plus className="h-4 w-4" /></Button>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>الاسم</TableHead><TableHead className="w-16"></TableHead></TableRow></TableHeader>
          <TableBody>
            {(regions ?? []).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>{r.name}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => delMut.mutate(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
