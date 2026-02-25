import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";

const roleLabels: Record<string, string> = {
  youth_association: "جمعية شبابية",
  service_provider: "مقدم خدمة",
  donor: "مانح",
};

interface AdminCreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminCreateUserDialog({ open, onOpenChange }: AdminCreateUserDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("youth_association");
  const [phone, setPhone] = useState("");
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const handleSubmit = async () => {
    if (!email || !password || !fullName) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }
    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      });

      if (error) throw error;

      // Update profile with additional info
      if (data.user) {
        await supabase.from("profiles").update({
          phone: phone || null,
          organization_name: orgName || null,
        }).eq("id", data.user.id);
      }

      toast.success("تم إنشاء الحساب بنجاح");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onOpenChange(false);
      setEmail(""); setPassword(""); setFullName(""); setPhone(""); setOrgName(""); setRole("youth_association");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            تسجيل مستخدم جديد
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>البريد الإلكتروني *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" dir="ltr" />
          </div>
          <div>
            <Label>كلمة المرور *</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="6 أحرف على الأقل" dir="ltr" />
          </div>
          <div>
            <Label>الاسم الكامل *</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>الدور</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>رقم الهاتف</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
          </div>
          <div>
            <Label>اسم المنظمة</Label>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
