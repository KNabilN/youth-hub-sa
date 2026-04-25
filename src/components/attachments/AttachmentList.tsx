import { FileText, Image, FileSpreadsheet, Download, Trash2, File, Palette, FileBox, Wrench, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useAttachments,
  useDeleteAttachment,
  useDownloadAttachment,
  EntityType,
  Attachment,
} from "@/hooks/useAttachments";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface AttachmentListProps {
  entityType: EntityType;
  entityId: string | undefined;
  /** When true, group items by category (brand_identity / content / operational / other). */
  groupByCategory?: boolean;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("pdf") || mimeType.includes("word")) return FileText;
  return File;
}

const CATEGORY_META: Record<string, { label: string; icon: typeof Palette }> = {
  brand_identity: { label: "الهوية البصرية", icon: Palette },
  content: { label: "المحتوى", icon: FileBox },
  operational: { label: "مرفقات تشغيلية", icon: Wrench },
  other: { label: "ملفات أخرى", icon: FolderOpen },
};

const CATEGORY_ORDER = ["brand_identity", "content", "operational", "other"];

export function AttachmentList({ entityType, entityId, groupByCategory = false }: AttachmentListProps) {
  const { data: attachments, isLoading } = useAttachments(entityType, entityId);
  const deleteAttachment = useDeleteAttachment();
  const download = useDownloadAttachment();
  const { user, role } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!attachments?.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        لا توجد مرفقات
      </p>
    );
  }

  const renderRow = (att: Attachment) => {
    const Icon = getFileIcon(att.mime_type);
    const canDelete = user?.id === att.user_id || role === "super_admin";
    return (
      <div
        key={att.id}
        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
      >
        <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{att.file_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground">{formatSize(att.file_size)}</p>
            {!groupByCategory && att.category && CATEGORY_META[att.category] && (
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                {CATEGORY_META[att.category].label}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => download(att)} title="تحميل">
            <Download className="h-4 w-4" />
          </Button>
          {canDelete && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => deleteAttachment.mutate(att)}
              disabled={deleteAttachment.isPending}
              title="حذف"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (!groupByCategory) {
    return <div className="space-y-2">{attachments.map(renderRow)}</div>;
  }

  // Group by category
  const groups: Record<string, Attachment[]> = {};
  attachments.forEach((att) => {
    const key = att.category && CATEGORY_META[att.category] ? att.category : "other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(att);
  });

  return (
    <div className="space-y-5">
      {CATEGORY_ORDER.filter((k) => groups[k]?.length).map((key) => {
        const meta = CATEGORY_META[key];
        const Icon = meta.icon;
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Icon className="h-4 w-4" />
              <span>{meta.label}</span>
              <Badge variant="outline" className="text-[10px] h-4">{groups[key].length}</Badge>
            </div>
            <div className="space-y-2">{groups[key].map(renderRow)}</div>
          </div>
        );
      })}
    </div>
  );
}

