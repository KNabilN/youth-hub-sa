import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAvailableProject } from "@/hooks/useAvailableProjects";
import { useSubmitBid } from "@/hooks/useProviderBids";
import { BidForm, type BidFormValues } from "@/components/provider/BidForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, MapPin, Clock, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectBidView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: project, isLoading } = useAvailableProject(id);
  const submitBid = useSubmitBid();
  const { toast } = useToast();

  const handleSubmit = (values: BidFormValues) => {
    if (!id) return;
    submitBid.mutate({ project_id: id, price: values.price, timeline_days: values.timeline_days, cover_letter: values.cover_letter }, {
      onSuccess: () => { toast({ title: "تم تقديم العرض بنجاح" }); navigate("/my-bids"); },
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

        <Card>
          <CardHeader><CardTitle className="text-lg">تقديم عرض</CardTitle></CardHeader>
          <CardContent>
            <BidForm onSubmit={handleSubmit} isLoading={submitBid.isPending} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
