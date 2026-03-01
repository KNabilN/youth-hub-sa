import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { useUploadCover } from "@/hooks/useUploadCover";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Shield, CheckCircle, Phone, Building, Camera, DollarSign, Mail, CalendarDays, BellRing, X, Plus, Award, GraduationCap, ImageIcon } from "lucide-react";
import { PortfolioManager } from "@/components/portfolio/PortfolioManager";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const roleLabels: Record<string, string> = {
  super_admin: "مدير النظام",
  youth_association: "جمعية شبابية",
  service_provider: "مقدم خدمة",
  donor: "مانح",
};

export default function Profile() {
  const { role, user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const uploadCover = useUploadCover();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [contactOfficerName, setContactOfficerName] = useState("");
  const [contactOfficerPhone, setContactOfficerPhone] = useState("");
  const [contactOfficerEmail, setContactOfficerEmail] = useState("");
  const [contactOfficerTitle, setContactOfficerTitle] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [qualifications, setQualifications] = useState<{ title: string; description: string }[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setFullName(profile.full_name ?? "");
    setBio(profile.bio ?? "");
    setPhone(profile.phone ?? "");
    setOrganizationName(profile.organization_name ?? "");
    setLicenseNumber((profile as any).license_number ?? "");
    setContactOfficerName((profile as any).contact_officer_name ?? "");
    setContactOfficerPhone((profile as any).contact_officer_phone ?? "");
    setContactOfficerEmail((profile as any).contact_officer_email ?? "");
    setContactOfficerTitle((profile as any).contact_officer_title ?? "");
    setHourlyRate(profile.hourly_rate?.toString() ?? "");
    setEmailNotifications((profile as any).email_notifications ?? true);
    setSkills((profile as any).skills ?? []);
    setQualifications((profile as any).qualifications ?? []);
    setInitialized(true);
  }

  const handleSave = () => {
    updateProfile.mutate(
      {
        full_name: fullName,
        bio,
        phone,
        organization_name: organizationName,
        license_number: licenseNumber,
        contact_officer_name: contactOfficerName,
        contact_officer_phone: contactOfficerPhone,
        contact_officer_email: contactOfficerEmail,
        contact_officer_title: contactOfficerTitle,
        hourly_rate: hourlyRate ? Number(hourlyRate) : null,
        email_notifications: emailNotifications,
        skills,
        qualifications,
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

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadCover.mutate(file, {
      onSuccess: () => toast({ title: "تم تحديث صورة الغلاف" }),
      onError: () => toast({ title: "خطأ في رفع الصورة", variant: "destructive" }),
    });
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addQualification = () => {
    setQualifications([...qualifications, { title: "", description: "" }]);
  };

  const updateQualification = (index: number, field: "title" | "description", value: string) => {
    const updated = [...qualifications];
    updated[index] = { ...updated[index], [field]: value };
    setQualifications(updated);
  };

  const removeQualification = (index: number) => {
    setQualifications(qualifications.filter((_, i) => i !== index));
  };

  const coverUrl = (profile as any)?.cover_image_url || "";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl animate-fade-in">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : (
          <>
            {/* Cover Image */}
            <Card className="overflow-hidden">
              <div
                className="relative h-40 sm:h-52 bg-gradient-to-l from-primary/20 via-primary/10 to-accent/10 cursor-pointer group"
                onClick={() => coverInputRef.current?.click()}
              >
                {coverUrl && (
                  <img src={coverUrl} alt="غلاف" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-white text-center">
                    <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                    <p className="text-sm">تغيير صورة الغلاف</p>
                  </div>
                </div>
                {uploadCover.isPending && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <p className="text-white text-sm">جارٍ الرفع...</p>
                  </div>
                )}
                <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </div>
            </Card>

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
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                    {user?.email && (
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</span>
                    )}
                    {profile?.created_at && (
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />انضم {format(new Date(profile.created_at), "dd MMMM yyyy", { locale: ar })}</span>
                    )}
                  </div>
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
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="orgName" className="flex items-center gap-1">
                          <Building className="h-3.5 w-3.5" /> اسم المنظمة
                        </Label>
                        <Input id="orgName" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="licenseNumber">رقم الترخيص</Label>
                        <Input id="licenseNumber" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} dir="ltr" className="h-11" />
                      </div>
                    </>
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

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" /> المهارات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="أضف مهارة..."
                    className="h-10"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addSkill} className="shrink-0">
                    <Plus className="h-4 w-4 me-1" /> إضافة
                  </Button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 px-3 py-1.5">
                        {skill}
                        <button type="button" onClick={() => removeSkill(i)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Qualifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" /> المؤهلات والشهادات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {qualifications.map((q, i) => (
                  <div key={i} className="flex gap-2 items-start border rounded-lg p-3">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="عنوان المؤهل"
                        value={q.title}
                        onChange={(e) => updateQualification(i, "title", e.target.value)}
                        className="h-9"
                      />
                      <Input
                        placeholder="وصف اختياري"
                        value={q.description}
                        onChange={(e) => updateQualification(i, "description", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeQualification(i)} className="shrink-0 text-destructive hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addQualification}>
                  <Plus className="h-4 w-4 me-1" /> إضافة مؤهل
                </Button>
              </CardContent>
            </Card>

            {role === "youth_association" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" /> بيانات ضابط الاتصال
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">اسم ضابط الاتصال</Label>
                    <Input id="contactName" value={contactOfficerName} onChange={(e) => setContactOfficerName(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactTitle">الصفة</Label>
                    <Input id="contactTitle" value={contactOfficerTitle} onChange={(e) => setContactOfficerTitle(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">رقم ضابط الاتصال</Label>
                    <Input id="contactPhone" value={contactOfficerPhone} onChange={(e) => setContactOfficerPhone(e.target.value)} dir="ltr" className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">بريد ضابط الاتصال</Label>
                    <Input id="contactEmail" value={contactOfficerEmail} onChange={(e) => setContactOfficerEmail(e.target.value)} dir="ltr" className="h-11" />
                  </div>
                </CardContent>
              </Card>
            )}

            {role === "service_provider" && <PortfolioManager />}

            {/* Email Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BellRing className="h-5 w-5 text-primary" /> إعدادات الإشعارات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">إشعارات البريد الإلكتروني</p>
                    <p className="text-xs text-muted-foreground">استلام إشعارات عبر البريد عند وجود تحديثات جديدة</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
              </CardContent>
            </Card>

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
