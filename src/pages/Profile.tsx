import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { User, Shield, CheckCircle } from "lucide-react";

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
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setFullName(profile.full_name ?? "");
    setBio(profile.bio ?? "");
    setInitialized(true);
  }

  const handleSave = () => {
    updateProfile.mutate(
      { full_name: fullName, bio },
      {
        onSuccess: () => toast({ title: "تم تحديث الملف الشخصي" }),
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
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
