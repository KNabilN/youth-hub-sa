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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
  defaultAssociationId?: string;
  defaultAmount?: number;
  defaultProjectId?: string;
  defaultTargetType?: "association" | "project";
}

export function DonationForm({ onSubmit, isLoading, defaultAssociationId, defaultAmount, defaultProjectId, defaultTargetType }: DonationFormProps) {
  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: defaultAmount || (undefined as any),
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem>
            <FormLabel>المبلغ (ر.س)</FormLabel>
            <FormControl><Input type="number" min={1} step="0.01" placeholder="أدخل المبلغ" {...field} value={field.value || ""} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="target_type" render={({ field }) => (
          <FormItem>
            <FormLabel>نوع المنحة</FormLabel>
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
            <FormLabel>الجمعية المستفيدة</FormLabel>
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
              <FormLabel>طلب الجمعية</FormLabel>
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
                              setProjectOpen(false);
                            }}
                          >
                            <Check className={cn("me-2 h-4 w-4", field.value === project.id ? "opacity-100" : "opacity-0")} />
                            {project.title}
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

        <Button type="submit" disabled={isLoading}>{isLoading ? "جاري التحضير..." : "متابعة للدفع"}</Button>
      </form>
    </Form>
  );
}
