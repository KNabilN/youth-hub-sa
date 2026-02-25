import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Lightbulb, FolderOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PendingCategoriesManager() {
  const qc = useQueryClient();

  const { data: pending, isLoading } = useQuery({
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

  const approveMut = useMutation({
    mutationFn: async (item: any) => {
      // Add to categories
      const { error: catErr } = await supabase.from("categories").insert({
        name: item.name,
        description: item.description || null,
      });
      if (catErr) throw catErr;
      // Update pending status
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

  const count = pending?.length ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">تصنيفات مقترحة</CardTitle>
          </div>
          {count > 0 && <Badge variant="destructive">{count}</Badge>}
        </div>
        <CardDescription>تصنيفات مقترحة من المستخدمين بانتظار المراجعة</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FolderOpen className="h-10 w-10 mb-2" />
            <p className="text-sm">لا توجد اقتراحات معلقة</p>
          </div>
        ) : (
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
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => approveMut.mutate(item)}
                        disabled={approveMut.isPending}
                        title="موافقة"
                      >
                        <Check className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => rejectMut.mutate(item.id)}
                        disabled={rejectMut.isPending}
                        title="رفض"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
