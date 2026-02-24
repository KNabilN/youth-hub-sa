import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useUploadAttachment, EntityType } from "@/hooks/useAttachments";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  entityType: EntityType;
  entityId: string;
}

export function FileUploader({ entityType, entityId }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAttachment();

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach((file) => {
        upload.mutate({ file, entityType, entityId });
      });
    },
    [upload, entityType, entityId]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium">اسحب الملفات وأفلتها هنا</p>
        <p className="text-xs text-muted-foreground mt-1">
          أو اضغط لاختيار ملف (PDF, صور, Word, Excel — حتى 10 MB)
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {upload.isPending && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">جاري الرفع...</p>
          <Progress value={undefined} className="h-2" />
        </div>
      )}
    </div>
  );
}
