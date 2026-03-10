import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolio, useAddPortfolioItem, useDeletePortfolioItem } from "@/hooks/usePortfolio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Trash2, Images } from "lucide-react";

export function PortfolioManager() {
  const { user } = useAuth();
  const { data: items } = usePortfolio(user?.id);
  const addItem = useAddPortfolioItem();
  const deleteItem = useDeletePortfolioItem();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleAdd = () => {
    if (!title || !file) {
      toast({ title: "يرجى إدخال العنوان واختيار صورة", variant: "destructive" });
      return;
    }
    addItem.mutate(
      { title, description, file },
      {
        onSuccess: () => {
          toast({ title: "تمت إضافة العمل بنجاح" });
          setTitle("");
          setDescription("");
          setFile(null);
          setPreview(null);
          if (fileRef.current) fileRef.current.value = "";
        },
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: string, image_url: string) => {
    deleteItem.mutate(
      { id, image_url },
      {
        onSuccess: () => toast({ title: "تم نقل العمل إلى سلة المحذوفات" }),
        onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Images className="h-5 w-5 text-primary" /> معرض الأعمال
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add form */}
        <div className="border border-dashed border-border rounded-lg p-4 space-y-3">
          <div className="space-y-2">
            <Label>عنوان العمل</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: تصميم هوية بصرية" className="h-10" />
          </div>
          <div className="space-y-2">
            <Label>وصف مختصر (اختياري)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-4 w-4 me-1" /> اختر صورة
            </Button>
            <span className="text-xs text-muted-foreground">الأبعاد المُوصى بها: 800×450 بكسل • الحد الأقصى: 5 MB</span>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {file && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{file.name}</span>}
          </div>
          {preview && (
            <img src={preview} alt="معاينة" className="h-32 rounded-md object-cover" />
          )}
          <Button onClick={handleAdd} disabled={addItem.isPending} size="sm" className="w-full">
            {addItem.isPending ? "جارٍ الرفع..." : "إضافة للمعرض"}
          </Button>
        </div>

        {/* Existing items */}
        {items && items.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="relative group rounded-lg overflow-hidden border border-border">
                <img src={item.image_url} alt={item.title} className="w-full aspect-video object-cover" />
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 start-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(item.id, item.image_url)}
                  disabled={deleteItem.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
