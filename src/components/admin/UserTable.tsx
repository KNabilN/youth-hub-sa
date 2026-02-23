import { useState } from "react";
import { useAdminUsers, useToggleVerification } from "@/hooks/useAdminUsers";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

const roleLabels: Record<string, string> = {
  super_admin: "مدير النظام",
  youth_association: "جمعية شبابية",
  service_provider: "مقدم خدمة",
  donor: "مانح",
};

export function UserTable() {
  const { data: users, isLoading } = useAdminUsers();
  const toggleVerify = useToggleVerification();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");

  const filtered = (users ?? []).filter((u: any) => {
    if (search && !u.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
    const userRole = u.user_roles?.[0]?.role;
    if (roleFilter !== "all" && userRole !== roleFilter) return false;
    if (verifiedFilter === "verified" && !u.is_verified) return false;
    if (verifiedFilter === "unverified" && u.is_verified) return false;
    return true;
  });

  const handleToggle = (id: string, current: boolean) => {
    toggleVerify.mutate({ id, is_verified: !current }, {
      onSuccess: () => toast.success(current ? "تم إلغاء التوثيق" : "تم التوثيق"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input placeholder="بحث بالاسم..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="الدور" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="youth_association">جمعية شبابية</SelectItem>
            <SelectItem value="service_provider">مقدم خدمة</SelectItem>
            <SelectItem value="donor">مانح</SelectItem>
            <SelectItem value="super_admin">مدير النظام</SelectItem>
          </SelectContent>
        </Select>
        <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="التوثيق" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="verified">موثق</SelectItem>
            <SelectItem value="unverified">غير موثق</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>الدور</TableHead>
              <TableHead>التوثيق</TableHead>
              <TableHead>تاريخ الانضمام</TableHead>
              <TableHead>إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{roleLabels[u.user_roles?.[0]?.role] ?? "—"}</Badge>
                </TableCell>
                <TableCell>
                  {u.is_verified ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200"><CheckCircle className="h-3 w-3 ml-1" />موثق</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground"><XCircle className="h-3 w-3 ml-1" />غير موثق</Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(u.created_at), "yyyy/MM/dd", { locale: ar })}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant={u.is_verified ? "outline" : "default"} onClick={() => handleToggle(u.id, u.is_verified)}>
                    {u.is_verified ? "إلغاء التوثيق" : "توثيق"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">لا يوجد مستخدمين</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
