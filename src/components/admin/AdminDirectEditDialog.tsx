import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCategories } from "@/hooks/useCategories";
import { useRegions } from "@/hooks/useRegions";
import { useCities } from "@/hooks/useCities";
import { useAdminUploadAvatar, useAdminUploadCover } from "@/hooks/useAdminUpload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Plus, User, ImageIcon, Loader2 } from "lucide-react";

export interface DirectEditFieldConfig {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "avatar" | "cover" | "skills" | "qualifications" | "image";
  selectSource?: "categories" | "regions" | "cities";
  /** For type "image": storage bucket name */
  imageBucket?: string;
  /** For type "image": table to update (defaults handled per-type) */
  imageTable?: string;
  /** For type "image": max size in MB (default 5) */
  imageMaxMB?: number;
  /** For type "image": recommended dimensions text */
  imageDimensions?: string;
}

interface AdminDirectEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentValues: Record<string, any>;
  fields: DirectEditFieldConfig[];
  title: string;
  onSave: (updates: Record<string, any>) => Promise<void>;
  isPending?: boolean;
  userId?: string;
}

export function AdminDirectEditDialog({
  open,
  onOpenChange,
  currentValues,
  fields,
  title,
  onSave,
  isPending,
  userId,
}: AdminDirectEditDialogProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [newSkill, setNewSkill] = useState("");
  const [newQual, setNewQual] = useState("");
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();
  const selectedRegionId = values["region_id"] as string | undefined;
  const { data: cities } = useCities(selectedRegionId);

  const avatarUpload = useAdminUploadAvatar(userId ?? "");
  const coverUpload = useAdminUploadCover(userId ?? "");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const imageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [imageUploading, setImageUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      const init: Record<string, any> = {};
      fields.forEach((f) => {
        if (f.type === "skills") {
          init[f.key] = Array.isArray(currentValues[f.key]) ? [...currentValues[f.key]] : [];
        } else if (f.type === "qualifications") {
          const raw = currentValues[f.key];
          init[f.key] = Array.isArray(raw) ? [...raw] : [];
        } else {
          init[f.key] = currentValues[f.key] ?? "";
        }
      });
      setValues(init);
      setNewSkill("");
      setNewQual("");
    }
  }, [open, currentValues, fields]);

  const handleSubmit = async () => {
    try {
      // Filter out avatar/cover fields - they're handled via upload
      const updates: Record<string, any> = {};
      fields.forEach((f) => {
        if (f.type !== "avatar" && f.type !== "cover") {
          updates[f.key] = values[f.key];
        }
      });
      // Sanitize: convert empty strings to null for UUID/numeric fields
      const nullableFields = ["region_id", "city_id", "category_id"];
      for (const key of nullableFields) {
        if (key in updates && (updates[key] === "" || updates[key] === undefined)) {
          updates[key] = null;
        }
      }
      if (updates.hourly_rate !== null && updates.hourly_rate !== undefined) {
        updates.hourly_rate = Number(updates.hourly_rate);
      }
      await onSave(updates);
      toast.success("تم حفظ التعديلات بنجاح");
      onOpenChange(false);
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    }
  };

  const getSelectOptions = (source: string) => {
    if (source === "categories") return categories ?? [];
    if (source === "regions") return regions ?? [];
    if (source === "cities") return cities ?? [];
    return [];
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      await avatarUpload.mutateAsync(file);
      toast.success("تم تحديث الصورة الشخصية");
    } catch {
      toast.error("فشل رفع الصورة الشخصية");
    }
  };

  const handleCoverUpload = async (file: File) => {
    try {
      await coverUpload.mutateAsync(file);
      toast.success("تم تحديث صورة الغلاف");
    } catch {
      toast.error("فشل رفع صورة الغلاف");
    }
  };
  const handleImageUpload = async (field: DirectEditFieldConfig, file: File) => {
    const maxMB = field.imageMaxMB ?? 5;
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`الحد الأقصى لحجم الصورة ${maxMB} ميجابايت`);
      return;
    }
    const bucket = field.imageBucket ?? "service-images";
    const ext = file.name.split(".").pop();
    const path = `admin/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    setImageUploading((prev) => ({ ...prev, [field.key]: true }));
    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setValues((v) => ({ ...v, [field.key]: publicUrl }));
      toast.success("تم رفع الصورة بنجاح");
    } catch {
      toast.error("فشل رفع الصورة");
    } finally {
      setImageUploading((prev) => ({ ...prev, [field.key]: false }));
    }
  };
  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    const current = values.skills ?? [];
    if (!current.includes(trimmed)) {
      setValues((v) => ({ ...v, skills: [...current, trimmed] }));
    }
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    setValues((v) => ({ ...v, skills: (v.skills ?? []).filter((s: string) => s !== skill) }));
  };

  const addQualification = () => {
    const trimmed = newQual.trim();
    if (!trimmed) return;
    const current = values.qualifications ?? [];
    if (!current.some((q: any) => (typeof q === "string" ? q : q.title) === trimmed)) {
      setValues((v) => ({ ...v, qualifications: [...current, { title: trimmed }] }));
    }
    setNewQual("");
  };

  const removeQualification = (index: number) => {
    setValues((v) => ({
      ...v,
      qualifications: (v.qualifications ?? []).filter((_: any, i: number) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label>{field.label}</Label>

              {/* Avatar field */}
              {field.type === "avatar" && (
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-border">
                    <AvatarImage src={currentValues.avatar_url} />
                    <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
                  </Avatar>
                  <div>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarUpload.isPending}
                        className="gap-1.5"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {avatarUpload.isPending ? "جاري الرفع..." : "رفع صورة جديدة"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">الأبعاد المُوصى بها: 200×200 بكسل • الحد الأقصى: 2 MB</p>
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Cover field */}
              {field.type === "cover" && (
                <div className="space-y-2">
                  {currentValues.cover_image_url ? (
                    <img
                      src={currentValues.cover_image_url}
                      alt="صورة الغلاف"
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-24 rounded-lg border border-dashed flex items-center justify-center bg-muted/30">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={coverUpload.isPending}
                    className="gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {coverUpload.isPending ? "جاري الرفع..." : "رفع صورة غلاف جديدة"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">الأبعاد المُوصى بها: 1200×400 بكسل • الحد الأقصى: 5 MB</p>
                  <input
                    ref={coverInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverUpload(file);
                      e.target.value = "";
                    }}
                  />
                </div>
              )}

              {/* Generic Image field */}
              {field.type === "image" && (
                <div className="space-y-2">
                  {values[field.key] ? (
                    <img
                      src={values[field.key]}
                      alt={field.label}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-full h-32 rounded-lg border border-dashed flex items-center justify-center bg-muted/30">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRefs.current[field.key]?.click()}
                    disabled={imageUploading[field.key]}
                    className="gap-1.5"
                  >
                    {imageUploading[field.key] ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {imageUploading[field.key] ? "جاري الرفع..." : "رفع صورة جديدة"}
                  </Button>
                  {field.imageDimensions && (
                    <p className="text-xs text-muted-foreground">{field.imageDimensions}</p>
                  )}
                  <input
                    ref={(el) => { imageInputRefs.current[field.key] = el; }}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(field, file);
                      e.target.value = "";
                    }}
                  />
                </div>
              )}

              {/* Skills field */}
              {field.type === "skills" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(values.skills ?? []).map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="gap-1 pl-1">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="أضف مهارة..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addSkill}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Qualifications field */}
              {field.type === "qualifications" && (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(values.qualifications ?? []).map((q: any, i: number) => (
                      <Badge key={i} variant="secondary" className="gap-1 pl-1">
                        {typeof q === "string" ? q : q.title ?? q.name ?? JSON.stringify(q)}
                        <button
                          type="button"
                          onClick={() => removeQualification(i)}
                          className="hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newQual}
                      onChange={(e) => setNewQual(e.target.value)}
                      placeholder="أضف مؤهل..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addQualification();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addQualification}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Textarea */}
              {field.type === "textarea" && (
                <Textarea
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  rows={3}
                />
              )}

              {/* Select */}
              {field.type === "select" && field.selectSource && (
                <Select
                  dir="rtl"
                  value={values[field.key] ?? ""}
                  onValueChange={(val) => {
                    setValues((v) => {
                      const updated = { ...v, [field.key]: val };
                      // Clear city when region changes
                      if (field.key === "region_id") updated["city_id"] = "";
                      return updated;
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getSelectOptions(field.selectSource).map((opt: any) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Text / Number */}
              {(!field.type || field.type === "text" || field.type === "number") && (
                <Input
                  type={field.type === "number" ? "number" : "text"}
                  value={values[field.key] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value,
                    }))
                  }
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            حفظ التعديلات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
