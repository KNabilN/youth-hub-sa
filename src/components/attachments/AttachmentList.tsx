import { FileText, Image, FileSpreadsheet, Download, Trash2, File } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function AttachmentList({ entityType, entityId }: AttachmentListProps) {
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

  return (
    <div className="space-y-2">
      {attachments.map((att) => {
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
              <p className="text-xs text-muted-foreground">{formatSize(att.file_size)}</p>
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
      })}
    </div>
  );
}
