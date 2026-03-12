import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { translateError } from "@/lib/auth-errors";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const DELIVERABLE_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/x-rar-compressed",
  "application/vnd.rar",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-7z-compressed",
  "application/x-compressed",
  "text/plain",
  "text/html",
  "text/css",
  "application/javascript",
  "application/json",
  "image/svg+xml",
];

export type EntityType = "project" | "contract" | "ticket" | "dispute" | "bid" | "service" | "deliverable";

export interface Attachment {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export function useAttachments(entityType: EntityType, entityId: string | undefined) {
  return useQuery({
    queryKey: ["attachments", entityType, entityId],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Attachment[];
    },
  });
}

export function useUploadAttachment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      file,
      entityType,
      entityId,
    }: {
      file: File;
      entityType: EntityType;
      entityId: string;
    }) => {
      if (!user) throw new Error("يجب تسجيل الدخول");
      const maxSize = entityType === "deliverable" ? DELIVERABLE_MAX_FILE_SIZE : MAX_FILE_SIZE;
      if (file.size > maxSize) throw new Error(entityType === "deliverable" ? "حجم الملف يتجاوز 50 ميجابايت" : "حجم الملف يتجاوز 10 ميجابايت");
      if (entityType !== "deliverable" && !ALLOWED_TYPES.includes(file.type)) throw new Error("نوع الملف غير مسموح");

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${user.id}/${entityType}/${entityId}/${timestamp}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("attachments").insert({
        user_id: user.id,
        entity_type: entityType,
        entity_id: entityId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      });
      if (insertError) {
        // Cleanup uploaded file on metadata failure
        await supabase.storage.from("attachments").remove([filePath]);
        throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["attachments", variables.entityType, variables.entityId],
      });
      toast.success("تم رفع الملف بنجاح");
    },
    onError: (error: Error) => {
      toast.error(translateError(error.message || "حدث خطأ أثناء رفع الملف"));
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachment: Attachment) => {
      const { error: storageError } = await supabase.storage
        .from("attachments")
        .remove([attachment.file_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("attachments")
        .delete()
        .eq("id", attachment.id);
      if (dbError) throw dbError;

      return attachment;
    },
    onSuccess: (attachment) => {
      queryClient.invalidateQueries({
        queryKey: ["attachments", attachment.entity_type, attachment.entity_id],
      });
      toast.success("تم حذف المرفق");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف المرفق");
    },
  });
}

export function useDownloadAttachment() {
  return async (attachment: Attachment) => {
    const { data, error } = await supabase.storage
      .from("attachments")
      .download(attachment.file_path);
    if (error) {
      toast.error("حدث خطأ أثناء تحميل الملف");
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = attachment.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };
}
