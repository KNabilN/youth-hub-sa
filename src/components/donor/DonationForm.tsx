import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVerifiedAssociations } from "@/hooks/useVerifiedAssociations";

const donationSchema = z.object({
  amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  target_type: z.enum(["association", "project"]),
  association_id: z.string().min(1, "يرجى اختيار الجمعية"),
  project_id: z.string().optional(),
}).refine((data) => {
  if (data.target_type === "project") {
    return !!data.project_id && data.project_id.length > 0;
  }
  return true;
}, { message: "يرجى اختيار الطلب", path: ["project_id"] });

type DonationFormValues = z.infer<typeof donationSchema>;

export interface DonationFormData {
  amount: number;
  target_type: "association" | "project";
  association_id: string;
  association_name?: string;
  project_id?: string;
  project_title?: string;
  provider_id?: string;
}

interface DonationFormProps {
  onSubmit: (values: DonationFormData) => void;
  isLoading?: boolean;
}

export function DonationForm({ onSubmit, isLoading }: DonationFormProps) {
  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: { amount: 0, target_type: "association", association_id: "", project_id: "" },
  });

  const targetType = form.watch("target_type");
  const selectedAssociationId = form.watch("association_id");

  const { data: associations } = useVerifiedAssociations();

  // Load open projects for the selected association
  const { data: associationProjects } = useQuery({
    queryKey: ["association-projects-for-donation", selectedAssociationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, assigned_provider_id, budget")
        .eq("association_id", selectedAssociationId!)
        .eq("status", "open")
        .eq("is_private", false);
      if (error) throw error;
      return data;
    },
    enabled: targetType === "project" && !!selectedAssociationId,
  });

  const handleSubmit = (values: DonationFormValues) => {
    const selectedAssociation = associations?.find((a) => a.id === values.association_id);
    const associationName = selectedAssociation?.organization_name || selectedAssociation?.full_name;

    if (values.target_type === "association") {
      onSubmit({
        amount: values.amount,
        target_type: "association",
        association_id: values.association_id,
        association_name: associationName || undefined,
      });
    } else {
      const selectedProject = associationProjects?.find((p) => p.id === values.project_id);
      onSubmit({
        amount: values.amount,
        target_type: "project",
        association_id: values.association_id,
        association_name: associationName || undefined,
        project_id: values.project_id,
        project_title: selectedProject?.title || "",
        provider_id: selectedProject?.assigned_provider_id || undefined,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem>
            <FormLabel>المبلغ (ر.س)</FormLabel>
            <FormControl><Input type="number" min={1} step="0.01" placeholder="0.00" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="target_type" render={({ field }) => (
          <FormItem>
            <FormLabel>نوع المنحة</FormLabel>
            <Select onValueChange={(v) => { field.onChange(v); form.setValue("association_id", ""); form.setValue("project_id", ""); }} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="association">تحويل موجه لجمعية</SelectItem>
                <SelectItem value="project">تحويل لطلب جمعية محدد</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="association_id" render={({ field }) => (
          <FormItem>
            <FormLabel>الجمعية المستفيدة</FormLabel>
            <Select onValueChange={(v) => { field.onChange(v); form.setValue("project_id", ""); }} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="اختر الجمعية..." /></SelectTrigger></FormControl>
              <SelectContent>
                {associations?.map((assoc) => (
                  <SelectItem key={assoc.id} value={assoc.id}>
                    {assoc.organization_name || assoc.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {/* Show project selector only for "project" type */}
        {targetType === "project" && selectedAssociationId && (
          <FormField control={form.control} name="project_id" render={({ field }) => (
            <FormItem>
              <FormLabel>طلب الجمعية</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="اختر الطلب..." /></SelectTrigger></FormControl>
                <SelectContent>
                  {associationProjects?.length ? associationProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                  )) : (
                    <div className="p-3 text-sm text-muted-foreground text-center">لا توجد طلبات مفتوحة لهذه الجمعية</div>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <Button type="submit" disabled={isLoading}>{isLoading ? "جاري التحضير..." : "متابعة للدفع"}</Button>
      </form>
    </Form>
  );
}
