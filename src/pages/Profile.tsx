import { useState, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { useUploadCover } from "@/hooks/useUploadCover";
import { useUploadCompanyLogo } from "@/hooks/useUploadCompanyLogo";
import { useAuth } from "@/hooks/useAuth";
import { useProfileCompleteness } from "@/hooks/useProfileCompleteness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, Shield, CheckCircle, Phone, Building, Camera, Mail, CalendarDays, BellRing, X, Plus, Award, GraduationCap, ImageIcon, Landmark, CircleCheck, Circle, Upload } from "lucide-react";
import { PortfolioManager } from "@/components/portfolio/PortfolioManager";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { useRegions } from "@/hooks/useRegions";
import { useCities } from "@/hooks/useCities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

const roleLabels: Record<string, string> = {
  super_admin: "مدير النظام",
  youth_association: "جمعية شبابية",
  service_provider: "مقدم خدمة",
  donor: "مانح",
};

// Required field keys per role for visual marking
const requiredFieldKeys: Record<string, string[]> = {
  common: ["full_name", "phone"],
  youth_association: ["organization_name", "license_number", "contact_officer_name", "contact_officer_phone", "bank_name", "bank_account_number", "bank_iban", "bank_account_holder"],
  service_provider: ["bio", "bank_name", "bank_account_number", "bank_iban", "bank_account_holder"],
  donor: [],
  super_admin: [],
};

function isRequired(fieldKey: string, role: string | null): boolean {
  if (!role) return false;
  return requiredFieldKeys.common.includes(fieldKey) || (requiredFieldKeys[role] ?? []).includes(fieldKey);
}

function RequiredMark({ fieldKey, role }: { fieldKey: string; role: string | null }) {
  if (!isRequired(fieldKey, role)) return null;
  return <span className="text-destructive text-xs font-bold">*</span>;
}

export default function Profile() {
  const { role, user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const uploadCover = useUploadCover();
  const uploadCompanyLogo = useUploadCompanyLogo();
  const { toast } = useToast();
  const { isComplete, missingFields, completionPercentage, requiredFields } = useProfileCompleteness();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [contactOfficerName, setContactOfficerName] = useState("");
  const [contactOfficerPhone, setContactOfficerPhone] = useState("");
  const [contactOfficerEmail, setContactOfficerEmail] = useState("");
  const [contactOfficerTitle, setContactOfficerTitle] = useState("");
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notificationPreferences, setNotificationPreferences] = useState<Record<string, boolean>>({});
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [qualifications, setQualifications] = useState<{ title: string; description: string }[]>([]);
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [regionId, setRegionId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const { data: regions } = useRegions();
  const { data: cities } = useCities(regionId);

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
    
    setEmailNotifications((profile as any).email_notifications ?? true);
    setNotificationPreferences((profile as any).notification_preferences ?? {});
    setSkills((profile as any).skills ?? []);
    setQualifications((profile as any).qualifications ?? []);
    setBankName((profile as any).bank_name ?? "");
    setBankAccountNumber((profile as any).bank_account_number ?? "");
    setBankIban((profile as any).bank_iban ?? "");
    setBankAccountHolder((profile as any).bank_account_holder ?? "");
    setRegionId((profile as any).region_id ?? null);
    setCityId((profile as any).city_id ?? null);
    setInitialized(true);
  }

  const handleSave = () => {
    // IBAN validation for roles that need bank info
    if ((role === "service_provider" || role === "youth_association") && bankIban && bankIban.length > 0) {
      if (!bankIban.startsWith("SA") || bankIban.length !== 24) {
        toast({ title: "رقم IBAN غير صحيح", description: "يجب أن يبدأ بـ SA ويتكون من 24 حرف", variant: "destructive" });
        return;
      }
    }

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
        
        email_notifications: emailNotifications,
        notification_preferences: notificationPreferences,
        skills,
        qualifications,
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
        bank_iban: bankIban,
        bank_account_holder: bankAccountHolder,
        region_id: regionId || null,
        city_id: cityId || null,
      },
      {
        onSuccess: (result) => {
          if (result?.wasVerified) {
            toast({ title: "تم تحديث الملف الشخصي", description: "سيتم مراجعة التعديلات من قبل الإدارة وإعادة توثيق حسابك." });
          } else {
            toast({ title: "تم تحديث الملف الشخصي" });
          }
        },
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

  const handleLogoUpload = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "يرجى اختيار صورة", variant: "destructive" });
      return;
    }
    uploadCompanyLogo.mutate(file, {
      onSuccess: () => toast({ title: "تم تحديث شعار الجهة المانحة" }),
      onError: () => toast({ title: "خطأ في رفع الشعار", variant: "destructive" }),
    });
  }, [uploadCompanyLogo, toast]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLogoUpload(file);
  };

  const onLogoDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleLogoUpload(file);
  }, [handleLogoUpload]);

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
  const companyLogoUrl = (profile as any)?.company_logo_url || "";
  const showBankSection = role === "service_provider" || role === "youth_association";
  const showSkillsSection = role === "service_provider" || role === "youth_association";
  const showQualificationsSection = role === "service_provider" || role === "youth_association";
  const showOrgNameForDonor = role === "donor";
  const isDonor = role === "donor";

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : (
          <>
            {/* Profile Completion Progress */}
            {!isComplete && (
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">اكتمال الملف الشخصي</p>
                    <span className="text-sm font-bold text-primary">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                  <div className="flex flex-wrap gap-2">
                    {requiredFields.map((f) => {
                      const isFilled = !missingFields.includes(f.label);
                      return (
                        <span key={f.key} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isFilled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                          {isFilled ? <CircleCheck className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                          {f.label}
                        </span>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

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
                    <p className="text-xs text-white/70 mt-0.5">الأبعاد المُوصى بها: 1200×400 بكسل • الحد الأقصى: 5 MB</p>
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
                  <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                    <p className="text-[9px] text-white/70 mt-0.5">200×200 • 2 MB</p>
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
                    {isDonor ? <Building className="h-5 w-5 text-primary" /> : <User className="h-5 w-5 text-primary" />}
                    {isDonor ? "معلومات الجهة المانحة" : "المعلومات الأساسية"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-1">
                      الاسم الكامل <RequiredMark fieldKey="full_name" role={role} />
                    </Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className={`h-11 ${isRequired("full_name", role) && !fullName ? "border-warning" : ""}`} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> رقم الهاتف <RequiredMark fieldKey="phone" role={role} />
                    </Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" placeholder="+966..." className={`h-11 ${isRequired("phone", role) && !phone ? "border-warning" : ""}`} />
                  </div>

                  {(role === "youth_association" || showOrgNameForDonor) && (
                    <div className="space-y-2">
                      <Label htmlFor="orgName" className="flex items-center gap-1">
                        <Building className="h-3.5 w-3.5" /> {isDonor ? "اسم الشركة / المنظمة" : "اسم المنظمة"} {!isDonor && <RequiredMark fieldKey="organization_name" role={role} />}
                      </Label>
                      <Input id="orgName" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder={isDonor ? "اختياري" : ""} className={`h-11 ${isRequired("organization_name", role) && !organizationName ? "border-warning" : ""}`} />
                    </div>
                  )}

                  {role === "youth_association" && (
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber" className="flex items-center gap-1">
                        رقم الترخيص <RequiredMark fieldKey="license_number" role={role} />
                      </Label>
                      <Input id="licenseNumber" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} dir="ltr" className={`h-11 ${isRequired("license_number", role) && !licenseNumber ? "border-warning" : ""}`} />
                    </div>
                  )}

                  {(role === "youth_association" || role === "service_provider") && (
                    <>
                      <div className="space-y-2">
                        <Label>المنطقة</Label>
                        <Select dir="rtl" value={regionId ?? ""} onValueChange={(val) => { setRegionId(val || null); setCityId(null); }}>
                          <SelectTrigger className="h-11"><SelectValue placeholder="اختر المنطقة" /></SelectTrigger>
                          <SelectContent>
                            {regions?.map((r) => (
                              <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>المدينة</Label>
                        <Select dir="rtl" value={cityId ?? ""} onValueChange={(val) => setCityId(val || null)} disabled={!regionId}>
                          <SelectTrigger className="h-11"><SelectValue placeholder={regionId ? "اختر المدينة" : "اختر المنطقة أولاً"} /></SelectTrigger>
                          <SelectContent>
                            {cities?.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> نبذة تعريفية
                    {isRequired("bio", role) && <RequiredMark fieldKey="bio" role={role} />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bio">
                      {isDonor ? "اكتب نبذة عن جهتك المانحة وأهدافك في الدعم" : "اكتب نبذة عنك أو عن مؤسستك"}
                    </Label>
                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={8} className={`resize-none ${isRequired("bio", role) && !bio ? "border-warning" : ""}`} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Company Logo - Donor only */}
            {isDonor && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" /> شعار الجهة المانحة
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Current logo preview */}
                    {companyLogoUrl && (
                      <div className="shrink-0">
                        <img
                          src={companyLogoUrl}
                          alt="شعار الجهة"
                          className="h-24 w-24 rounded-xl object-contain border border-border bg-muted/30 p-2"
                        />
                      </div>
                    )}

                    {/* Upload area */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true); }}
                      onDragLeave={() => setIsDraggingLogo(false)}
                      onDrop={onLogoDrop}
                      onClick={() => logoInputRef.current?.click()}
                      className={cn(
                        "flex-1 w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
                        isDraggingLogo
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                    >
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">
                        {companyLogoUrl ? "تغيير الشعار" : "رفع شعار الجهة المانحة"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        اسحب الصورة وأفلتها هنا أو اضغط لاختيار ملف
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">الأبعاد المُوصى بها: 300×300 بكسل • الحد الأقصى: 2 MB</p>
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                    </div>
                  </div>
                  {uploadCompanyLogo.isPending && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      جارٍ رفع الشعار...
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Bank Details */}
            {showBankSection && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-primary" /> البيانات البنكية
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName" className="flex items-center gap-1">
                      اسم البنك <RequiredMark fieldKey="bank_name" role={role} />
                    </Label>
                    <Input id="bankName" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="مثال: البنك الأهلي" className={`h-11 ${!bankName ? "border-warning" : ""}`} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountHolder" className="flex items-center gap-1">
                      اسم صاحب الحساب <RequiredMark fieldKey="bank_account_holder" role={role} />
                    </Label>
                    <Input id="bankAccountHolder" value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} className={`h-11 ${!bankAccountHolder ? "border-warning" : ""}`} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankAccountNumber" className="flex items-center gap-1">
                      رقم الحساب البنكي <RequiredMark fieldKey="bank_account_number" role={role} />
                    </Label>
                    <Input id="bankAccountNumber" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} dir="ltr" className={`h-11 ${!bankAccountNumber ? "border-warning" : ""}`} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bankIban" className="flex items-center gap-1">
                      رقم IBAN <RequiredMark fieldKey="bank_iban" role={role} />
                    </Label>
                    <Input id="bankIban" value={bankIban} onChange={(e) => setBankIban(e.target.value.toUpperCase())} dir="ltr" placeholder="SA0000000000000000000000" maxLength={24} className={`h-11 ${!bankIban ? "border-warning" : ""}`} />
                    {bankIban && (!bankIban.startsWith("SA") || bankIban.length !== 24) && (
                      <p className="text-xs text-destructive">يجب أن يبدأ بـ SA ويتكون من 24 حرف ({bankIban.length}/24)</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Skills - hide for donor and admin */}
            {showSkillsSection && (
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
            )}

            {/* Qualifications - hide for donor and admin */}
            {showQualificationsSection && (
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
                        <Input placeholder="عنوان المؤهل" value={q.title} onChange={(e) => updateQualification(i, "title", e.target.value)} className="h-9" />
                        <Input placeholder="وصف اختياري" value={q.description} onChange={(e) => updateQualification(i, "description", e.target.value)} className="h-9" />
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
            )}

            {role === "youth_association" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" /> بيانات ضابط الاتصال
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName" className="flex items-center gap-1">
                      اسم ضابط الاتصال <RequiredMark fieldKey="contact_officer_name" role={role} />
                    </Label>
                    <Input id="contactName" value={contactOfficerName} onChange={(e) => setContactOfficerName(e.target.value)} className={`h-11 ${isRequired("contact_officer_name", role) && !contactOfficerName ? "border-warning" : ""}`} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactTitle">الصفة</Label>
                    <Input id="contactTitle" value={contactOfficerTitle} onChange={(e) => setContactOfficerTitle(e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="flex items-center gap-1">
                      رقم ضابط الاتصال <RequiredMark fieldKey="contact_officer_phone" role={role} />
                    </Label>
                    <Input id="contactPhone" value={contactOfficerPhone} onChange={(e) => setContactOfficerPhone(e.target.value)} dir="ltr" className={`h-11 ${isRequired("contact_officer_phone", role) && !contactOfficerPhone ? "border-warning" : ""}`} />
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
            <NotificationPreferences
              role={role}
              emailNotifications={emailNotifications}
              onEmailNotificationsChange={setEmailNotifications}
              preferences={notificationPreferences}
              onPreferencesChange={setNotificationPreferences}
            />

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
