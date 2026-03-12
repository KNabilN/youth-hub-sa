import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [licenseNumber, setLicenseNumber] = useState("");
  const [contactOfficerName, setContactOfficerName] = useState("");
  const [contactOfficerPhone, setContactOfficerPhone] = useState("");
  const [contactOfficerEmail, setContactOfficerEmail] = useState("");
  const [contactOfficerTitle, setContactOfficerTitle] = useState("");
  const [bio, setBio] = useState("");
  
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setOrgName("");
    setRole("youth_association");
    setLicenseNumber("");
    setContactOfficerName("");
    setContactOfficerPhone("");
    setContactOfficerEmail("");
    setContactOfficerTitle("");
    setBio("");
    
  };

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
      const fullPhone = phone ? `+966${phone}` : "";
      const fullContactPhone = contactOfficerPhone ? `+966${contactOfficerPhone}` : "";

      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email,
          password,
          full_name: fullName,
          role,
          phone: fullPhone,
          organization_name: orgName || null,
          license_number: licenseNumber || null,
          contact_officer_name: contactOfficerName || null,
          contact_officer_phone: fullContactPhone || null,
          contact_officer_email: contactOfficerEmail || null,
          contact_officer_title: contactOfficerTitle || null,
          bio: bio || null,
          hourly_rate: hourlyRate ? Number(hourlyRate) : null,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("تم إنشاء الحساب بنجاح");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            تسجيل مستخدم جديد
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pe-4">
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
              <div className="flex gap-2" dir="ltr">
                <span className="flex items-center px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground">+966</span>
                <Input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="5XXXXXXXX" dir="ltr" className="flex-1" />
              </div>
            </div>
            <div>
              <Label>اسم المنظمة</Label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div>
              <Label>رقم الترخيص</Label>
              <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} dir="ltr" />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">بيانات ضابط الاتصال</p>
              <div className="space-y-4">
                <div>
                  <Label>اسم ضابط الاتصال</Label>
                  <Input value={contactOfficerName} onChange={(e) => setContactOfficerName(e.target.value)} />
                </div>
                <div>
                  <Label>رقم ضابط الاتصال</Label>
                  <div className="flex gap-2" dir="ltr">
                    <span className="flex items-center px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground">+966</span>
                    <Input value={contactOfficerPhone} onChange={(e) => setContactOfficerPhone(e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="5XXXXXXXX" dir="ltr" className="flex-1" />
                  </div>
                </div>
                <div>
                  <Label>بريد ضابط الاتصال</Label>
                  <Input type="email" value={contactOfficerEmail} onChange={(e) => setContactOfficerEmail(e.target.value)} placeholder="officer@example.com" dir="ltr" />
                </div>
                <div>
                  <Label>صفة ضابط الاتصال</Label>
                  <Input value={contactOfficerTitle} onChange={(e) => setContactOfficerTitle(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-4">
                <div>
                  <Label>نبذة</Label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
                </div>
                <div>
                  <Label>السعر بالساعة (ر.س)</Label>
                  <Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="0" dir="ltr" min="0" />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
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
