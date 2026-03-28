import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAvailableProject } from "@/hooks/useAvailableProjects";
import { useSubmitBid } from "@/hooks/useProviderBids";
import { BidForm, type BidFormValues } from "@/components/provider/BidForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useVerificationGuard } from "@/hooks/useVerificationGuard";
import { ArrowRight, MapPin, Clock, DollarSign, CheckCircle, Building2, ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { AttachmentList } from "@/components/attachments/AttachmentList";
import { useUploadAttachment } from "@/hooks/useAttachments";

export default function ProjectBidView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useAvailableProject(id);
  const submitBid = useSubmitBid();
  const uploadAttachment = useUploadAttachment();
  const { toast } = useToast();
  const { isVerified } = useVerificationGuard();
  const [createdBidId, setCreatedBidId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (values: BidFormValues, files: File[]) => {
    if (!id) return;
    submitBid.mutate({ project_id: id, price: values.price, timeline_days: values.timeline_days, cover_letter: values.cover_letter }, {
      onSuccess: async (data) => {
        // Upload files if any
        if (files.length > 0) {
          setUploading(true);
          try {
            for (const file of files) {
              await uploadAttachment.mutateAsync({ file, entityType: "bid", entityId: data.id });
            }
          } catch {
            toast({ title: "تم تقديم العرض لكن فشل رفع بعض المرفقات", variant: "destructive" });
          } finally {
            setUploading(false);
          }
        }
        toast({ title: "تم تقديم العرض بنجاح" });
        setCreatedBidId(data.id);
      },
      onError: (err: any) => toast({ title: err?.message?.includes("duplicate") ? "لقد قدمت عرضاً على هذا الطلب مسبقاً" : "حدث خطأ", variant: "destructive" }),
    });
  };

  if (isLoading) return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-10 w-24" />
        <div className="border rounded-lg p-6 space-y-4">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="border rounded-lg p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </DashboardLayout>
  );
  if (!project) return <DashboardLayout><p className="text-muted-foreground">الطلب غير موجود</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate("/available-projects")}>
          <ArrowRight className="h-4 w-4 me-2" />العودة
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{project.title}</CardTitle>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              {project.is_name_visible && project.profiles ? (
                <Link to={`/profile/${project.association_id}`} className="flex items-center gap-1.5 group hover:text-primary transition-colors">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={project.profiles.avatar_url ?? undefined} />
                    <AvatarFallback><Building2 className="h-3 w-3" /></AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{project.profiles.organization_name || project.profiles.full_name}</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 text-muted-foreground"><Building2 className="h-4 w-4" />جمعية مجهولة</span>
              )}
              {project.categories?.name && <Badge variant="secondary">{project.categories.name}</Badge>}
              {project.regions?.name && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{project.regions.name}</span>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm whitespace-pre-wrap">{project.description}</p>
            <div className="flex items-center gap-6 text-sm">
              {project.budget != null && <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{project.budget} ر.س</span>}
              {project.estimated_hours != null && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{project.estimated_hours} ساعة</span>}
            </div>
            {project.required_skills && project.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.required_skills.map(s => <Badge key={s} variant="outline">{s}</Badge>)}
              </div>
            )}
          </CardContent>
        </Card>

        {createdBidId ? (
          <>
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle className="h-6 w-6" />
              <h2 className="text-xl font-bold">تم تقديم العرض بنجاح</h2>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">المرفقات</CardTitle>
              </CardHeader>
              <CardContent>
                <AttachmentList entityType="bid" entityId={createdBidId} />
              </CardContent>
            </Card>
            <Button onClick={() => navigate("/my-bids")}>
              <ArrowRight className="h-4 w-4 me-2" />
              الانتقال لعروضي
            </Button>
          </>
        ) : (
          <Card>
            <CardHeader><CardTitle className="text-lg">تقديم عرض</CardTitle></CardHeader>
            <CardContent>
              {isVerified ? (
                <BidForm onSubmit={handleSubmit} isLoading={submitBid.isPending || uploading} />
              ) : (
                <div className="text-center py-8 space-y-2">
                  <p className="text-muted-foreground">يجب توثيق حسابك أولاً لتقديم عروض على طلبات الجمعيات</p>
                  <Button variant="outline" onClick={() => navigate("/profile")}>الذهاب للملف الشخصي</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}