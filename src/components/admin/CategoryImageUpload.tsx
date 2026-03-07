import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ImageIcon, Upload, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CategoryImageUploadProps {
  categoryId: string;
  categoryName: string;
  currentImageUrl: string | null;
}

export function CategoryImageUpload({ categoryId, categoryName, currentImageUrl }: CategoryImageUploadProps) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop();
      const path = `${categoryId}/image.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("category-images")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("category-images").getPublicUrl(path);
      const image_url = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error } = await supabase.from("categories").update({ image_url } as any).eq("id", categoryId);
      if (error) throw error;
      return image_url;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("تم رفع صورة التصنيف");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("categories").update({ image_url: null } as any).eq("id", categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("تم حذف صورة التصنيف");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("الحد الأقصى 5 ميجابايت");
      return;
    }
    uploadMut.mutate(file);
  };

  const isPending = uploadMut.isPending || removeMut.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" title="صورة التصنيف">
          {currentImageUrl ? (
            <img src={currentImageUrl} alt="" className="h-6 w-6 rounded object-cover" />
          ) : (
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>صورة التصنيف: {categoryName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {currentImageUrl && (
            <div className="relative rounded-lg overflow-hidden border">
              <img src={currentImageUrl} alt={categoryName} className="w-full aspect-video object-cover" />
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div className="flex gap-2">
            <Button onClick={() => fileRef.current?.click()} disabled={isPending} className="flex-1">
              {uploadMut.isPending ? <Loader2 className="h-4 w-4 animate-spin me-1" /> : <Upload className="h-4 w-4 me-1" />}
              {currentImageUrl ? "تغيير الصورة" : "رفع صورة"}
            </Button>
            {currentImageUrl && (
              <Button variant="destructive" onClick={() => removeMut.mutate()} disabled={isPending}>
                {removeMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
