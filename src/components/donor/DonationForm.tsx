import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVerifiedAssociations } from "@/hooks/useVerifiedAssociations";

const donationSchema = z.object({
  amount: z.coerce.number().min(1, "المبلغ يجب أن يكون أكبر من صفر"),
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
  defaultAssociationId?: string;
  defaultAmount?: number;
  defaultProjectId?: string;
  defaultTargetType?: "association" | "project";
}

export function DonationForm({ onSubmit, isLoading, defaultAssociationId, defaultAmount, defaultProjectId, defaultTargetType }: DonationFormProps) {
  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: defaultAmount || undefined,
      target_type: defaultTargetType || "association",
      association_id: defaultAssociationId || "",
      project_id: defaultProjectId || "",
    },
  });

  const [assocOpen, setAssocOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);

  const targetType = form.watch("target_type");
  const selectedAssociationId = form.watch("association_id");

  const { data: associations } = useVerifiedAssociations();

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

  const selectedAssociation = associations?.find((a) => a.id === selectedAssociationId);
  const selectedProjectId = form.watch("project_id");
  const selectedProject = associationProjects?.find((p) => p.id === selectedProjectId);

  // Query to fetch existing grants for the selected project
  const { data: projectGrants } = useQuery({
    queryKey: ["project-grants-summary", selectedProjectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("donor_contributions")
        .select("amount, donation_status")
        .eq("project_id", selectedProjectId!)
        .in("donation_status", ["available", "reserved", "pending"]);
      const totalAvailable = (data ?? []).reduce((s, c) => s + Number(c.amount), 0);
      return { totalAvailable };
    },
    enabled: !!selectedProjectId && targetType === "project",
  });

  const projectBudget = selectedProject?.budget ? Number(selectedProject.budget) : 0;
  const grantsAvailable = projectGrants?.totalAvailable ?? 0;
  const remaining = Math.max(0, projectBudget - grantsAvailable);

  const handleSubmit = (values: DonationFormValues) => {
    const assoc = associations?.find((a) => a.id === values.association_id);
    const associationName = assoc?.organization_name || assoc?.full_name;

    if (values.target_type === "association") {
      onSubmit({
        amount: values.amount,
        target_type: "association",
        association_id: values.association_id,
        association_name: associationName || undefined,
      });
    } else {
      const proj = associationProjects?.find((p) => p.id === values.project_id);
      onSubmit({
        amount: values.amount,
        target_type: "project",
        association_id: values.association_id,
        association_name: associationName || undefined,
        project_id: values.project_id,
        project_title: proj?.title || "",
        provider_id: proj?.assigned_provider_id || undefined,
      });
    }
  };

  const formatCurrency = (v: number) => v.toLocaleString("ar-SA");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField control={form.control} name="target_type" render={({ field }) => (
          <FormItem>
            <FormLabel required>نوع المنحة</FormLabel>
            <Select onValueChange={(v) => { field.onChange(v); form.setValue("association_id", defaultAssociationId || ""); form.setValue("project_id", ""); }} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="association">تحويل موجه لجمعية</SelectItem>
                <SelectItem value="project">تحويل لطلب جمعية محدد</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {/* Searchable Association Combobox */}
        <FormField control={form.control} name="association_id" render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel required>الجمعية المستفيدة</FormLabel>
            <Popover open={assocOpen} onOpenChange={setAssocOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={assocOpen}
                    className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}
                  >
                    {selectedAssociation
                      ? (selectedAssociation.organization_name || selectedAssociation.full_name)
                      : "ابحث واختر الجمعية..."}
                    <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="ابحث عن جمعية..." />
                  <CommandList>
                    <CommandEmpty>لم يتم العثور على نتائج</CommandEmpty>
                    <CommandGroup>
                      {associations?.map((assoc) => (
                        <CommandItem
                          key={assoc.id}
                          value={assoc.organization_name || assoc.full_name || assoc.id}
                          onSelect={() => {
                            field.onChange(assoc.id);
                            form.setValue("project_id", "");
                            setAssocOpen(false);
                          }}
                        >
                          <Check className={cn("me-2 h-4 w-4", field.value === assoc.id ? "opacity-100" : "opacity-0")} />
                          {assoc.organization_name || assoc.full_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )} />

        {/* Searchable Project Combobox */}
        {targetType === "project" && selectedAssociationId && (
          <FormField control={form.control} name="project_id" render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel required>طلب الجمعية</FormLabel>
              <Popover open={projectOpen} onOpenChange={setProjectOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={projectOpen}
                      className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}
                    >
                      {selectedProject ? selectedProject.title : "ابحث واختر الطلب..."}
                      <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="ابحث عن طلب..." />
                    <CommandList>
                      <CommandEmpty>لا توجد طلبات مفتوحة لهذه الجمعية</CommandEmpty>
                      <CommandGroup>
                        {associationProjects?.map((project) => (
                          <CommandItem
                            key={project.id}
                            value={project.title}
                            onSelect={() => {
                              field.onChange(project.id);
                              if (project.budget) {
                                form.setValue("amount", Number(project.budget));
                              }
                              setProjectOpen(false);
                            }}
                          >
                            <Check className={cn("me-2 h-4 w-4", field.value === project.id ? "opacity-100" : "opacity-0")} />
                            <span className="flex-1">{project.title}</span>
                            {project.budget && (
                              <span className="text-xs text-muted-foreground ms-2">
                                {Number(project.budget).toLocaleString("ar-SA")} ر.س
                              </span>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )} />
        )}

        {/* Project Grant Summary Card */}
        {targetType === "project" && selectedProjectId && selectedProject && (
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Info className="h-4 w-4 text-primary" />
              معلومات المنحة لهذا الطلب
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center p-2 rounded bg-background">
                <div className="text-muted-foreground text-xs">ميزانية الطلب</div>
                <div className="font-semibold text-foreground">{formatCurrency(projectBudget)} ر.س</div>
              </div>
              <div className="text-center p-2 rounded bg-background">
                <div className="text-muted-foreground text-xs">المنح المتاحة</div>
                <div className="font-semibold text-primary">{formatCurrency(grantsAvailable)} ر.س</div>
              </div>
              <div className="text-center p-2 rounded bg-background">
                <div className="text-muted-foreground text-xs">المتبقي المطلوب</div>
                <div className={cn("font-semibold", remaining > 0 ? "text-destructive" : "text-green-600")}>
                  {formatCurrency(remaining)} ر.س
                </div>
              </div>
            </div>
          </div>
        )}

        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem>
            <FormLabel required>المبلغ (ر.س)</FormLabel>
            <FormControl><Input type="number" min={1} step="0.01" placeholder="أدخل المبلغ" {...field} value={field.value ?? ""} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" disabled={isLoading}>{isLoading ? "جاري التحضير..." : "متابعة للدفع"}</Button>
      </form>
    </Form>
  );
}
