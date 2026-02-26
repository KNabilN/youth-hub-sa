import { Link } from "react-router-dom";
import { FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Database } from "@/integrations/supabase/types";

type ProjectStatus = Database["public"]["Enums"]["project_status"];

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  draft: { label: "مسودة", className: "bg-muted text-muted-foreground" },
  pending_approval: { label: "بانتظار الموافقة", className: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
  open: { label: "مفتوح", className: "bg-[hsl(var(--info))]/15 text-[hsl(var(--info))] border-[hsl(var(--info))]/30" },
  in_progress: { label: "قيد التنفيذ", className: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30" },
  completed: { label: "مكتمل", className: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30" },
  disputed: { label: "مُشتكى عليه", className: "bg-destructive/15 text-destructive border-destructive/30" },
  cancelled: { label: "ملغي", className: "bg-muted text-muted-foreground" },
  suspended: { label: "معلق", className: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
  archived: { label: "مؤرشف", className: "bg-muted text-muted-foreground" },
};

interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  created_at: string;
  category: { name: string } | null;
  association: { full_name: string; organization_name: string | null } | null;
}

interface LandingRequestsTableProps {
  projects: Project[];
  loading: boolean;
}

export default function LandingRequestsTable({ projects, loading }: LandingRequestsTableProps) {
  if (!loading && projects.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FolderKanban className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl">طلبات الجمعيات</CardTitle>
            </div>
            <CardDescription>أحدث طلبات الجمعيات على المنصة</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">العنوان</TableHead>
                        <TableHead className="text-right">الجمعية</TableHead>
                        <TableHead className="text-right">التصنيف</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((p) => {
                        const sc = statusConfig[p.status];
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.title}</TableCell>
                            <TableCell>{p.association?.organization_name || p.association?.full_name || "—"}</TableCell>
                            <TableCell>{p.category?.name || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={sc.className}>{sc.label}</Badge>
                            </TableCell>
                            <TableCell dir="ltr" className="text-right">
                              {new Date(p.created_at).toLocaleDateString("en-CA").replace(/-/g, "/")}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {projects.map((p) => {
                    const sc = statusConfig[p.status];
                    return (
                      <div key={p.id} className="border border-border rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{p.title}</span>
                          <Badge variant="outline" className={sc.className}>{sc.label}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>الجمعية: {p.association?.organization_name || p.association?.full_name || "—"}</p>
                          <p>التصنيف: {p.category?.name || "—"}</p>
                          <p dir="ltr" className="text-right">
                            {new Date(p.created_at).toLocaleDateString("en-CA").replace(/-/g, "/")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="text-center mt-6">
              <Button asChild>
                <Link to="/auth?mode=register">سجّل لتقديم عروضك</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
