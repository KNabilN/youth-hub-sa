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
      <div className="space-y-6 max-w-3xl animate-fade-in">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : (
          <>
            {/* Profile Hero */}
            <div className="relative bg-gradient-to-l from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 md:p-8 border border-border">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                  <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">{fullName?.[0] ?? "؟"}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div className="text-center sm:text-start space-y-2 flex-1">
                  <h1 className="text-2xl font-bold">{fullName || "الملف الشخصي"}</h1>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {role && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {roleLabels[role] ?? role}
                      </Badge>
                    )}
                    {profile?.is_verified && (
                      <Badge className="flex items-center gap-1 bg-success text-success-foreground">
                        <CheckCircle className="h-3 w-3" />
                        موثّق
                      </Badge>
                    )}
                  </div>
                  {uploadAvatar.isPending && <p className="text-xs text-muted-foreground">جارٍ رفع الصورة...</p>}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> المعلومات الأساسية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">الاسم الكامل</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> رقم الهاتف
                    </Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" placeholder="+966..." className="h-11" />
                  </div>

                  {role === "youth_association" && (
                    <div className="space-y-2">
                      <Label htmlFor="orgName" className="flex items-center gap-1">
                        <Building className="h-3.5 w-3.5" /> اسم المنظمة
                      </Label>
                      <Input id="orgName" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} className="h-11" />
                    </div>
                  )}

                  {role === "service_provider" && (
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate" className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" /> سعر الساعة (ر.س)
                      </Label>
                      <Input id="hourlyRate" type="number" min="0" step="0.5" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} dir="ltr" placeholder="0" className="h-11" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> نبذة تعريفية
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bio">اكتب نبذة عنك أو عن مؤسستك</Label>
                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={8} className="resize-none" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={updateProfile.isPending} className="px-8 shadow-md">
                حفظ التغييرات
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
