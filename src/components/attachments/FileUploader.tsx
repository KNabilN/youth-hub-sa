import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUploadAttachment,
  EntityType,
  AttachmentCategory,
} from "@/hooks/useAttachments";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  entityType: EntityType;
  entityId: string;
  /** When true, shows a dropdown to classify uploads (brand_identity / content / operational) */
  showCategory?: boolean;
}

export function FileUploader({
  entityType,
  entityId,
  showCategory = false,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [category, setCategory] = useState<AttachmentCategory | "none">("none");
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadAttachment();

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const cat =
        showCategory && category !== "none"
          ? (category as AttachmentCategory)
          : undefined;
      Array.from(files).forEach((file) => {
        upload.mutate({ file, entityType, entityId, category: cat });
      });
    },
    [upload, entityType, entityId, category, showCategory],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div className="space-y-3">
      {showCategory && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            تصنيف الملف (اختياري)
          </Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as AttachmentCategory | "none")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="بدون تصنيف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون تصنيف</SelectItem>
              <SelectItem value="brand_identity">هوية بصرية</SelectItem>
              <SelectItem value="content">محتوى</SelectItem>
              <SelectItem value="operational">مرفقات تشغيلية</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
        )}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium">اسحب الملفات وأفلتها هنا</p>
        <p className="text-xs text-muted-foreground mt-1">
          أو اضغط لاختيار ملف (PDF, صور, Word, Excel, أرشيف — حتى 10 MB)
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.rar,.zip,.7z"
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
