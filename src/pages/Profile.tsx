import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Shield, CheckCircle, Phone, Building, Camera, DollarSign } from "lucide-react";

const roleLabels: Record<string, string> = {
  super_admin: "مدير النظام",
  youth_association: "جمعية شبابية",
  service_provider: "مقدم خدمة",
  donor: "مانح",
};

export default function Profile() {
  const { role } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setFullName(profile.full_name ?? "");
    setBio(profile.bio ?? "");
    setPhone(profile.phone ?? "");
    setOrganizationName(profile.organization_name ?? "");
    setHourlyRate(profile.hourly_rate?.toString() ?? "");
    setInitialized(true);
  }

  const handleSave = () => {
    updateProfile.mutate(
      {
        full_name: fullName,
        bio,
        phone,
        organization_name: organizationName,
        hourly_rate: hourlyRate ? Number(hourlyRate) : null,
      },
      {
        onSuccess: () => toast({ title: "تم تحديث الملف الشخصي" }),
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatar.mutate(file, {
      onSuccess: () => toast({ title: "تم تحديث الصورة الشخصية" }),
      onError: () => toast({ title: "خطأ في رفع الصورة", variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold">الملف الشخصي</h1>

        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" /> المعلومات الأساسية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl">{fullName?.[0] ?? "؟"}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">اضغط لتغيير الصورة</p>
                    {uploadAvatar.isPending && <p className="text-xs text-muted-foreground">جارٍ الرفع...</p>}
                  </div>
                </div>

                <div className="flex gap-3">
                  {role && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {roleLabels[role] ?? role}
                    </Badge>
                  )}
                  {profile?.is_verified && (
                    <Badge variant="default" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      موثّق
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> رقم الهاتف
                  </Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" placeholder="+966..." />
                </div>

                {role === "youth_association" && (
                  <div className="space-y-2">
                    <Label htmlFor="orgName" className="flex items-center gap-1">
                      <Building className="h-3.5 w-3.5" /> اسم المنظمة
                    </Label>
                    <Input id="orgName" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
                  </div>
                )}

                {role === "service_provider" && (
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate" className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" /> سعر الساعة (ر.س)
                    </Label>
                    <Input id="hourlyRate" type="number" min="0" step="0.5" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} dir="ltr" placeholder="0" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="bio">نبذة تعريفية</Label>
                  <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
                </div>

                <Button onClick={handleSave} disabled={updateProfile.isPending}>
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
