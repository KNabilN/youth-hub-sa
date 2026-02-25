import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface CategorySelectWithOtherProps {
  categories: { id: string; name: string }[] | undefined;
  value: string;
  onChange: (value: string) => void;
  entityType?: "service" | "project";
  placeholder?: string;
}

export function CategorySelectWithOther({
  categories,
  value,
  onChange,
  entityType = "service",
  placeholder = "اختر التصنيف",
}: CategorySelectWithOtherProps) {
  const { user } = useAuth();
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleValueChange = (v: string) => {
    if (v === "__other__") {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      setCustomName("");
      onChange(v);
    }
  };

  const handleSuggest = async () => {
    if (!customName.trim() || !user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("pending_categories" as any).insert({
        name: customName.trim(),
        suggested_by: user.id,
        entity_type: entityType,
      } as any);
      if (error) throw error;
      toast.success("تم إرسال اقتراح التصنيف للمراجعة");
      setCustomName("");
      setShowCustom(false);
    } catch {
      toast.error("فشل إرسال الاقتراح");
    } finally {
      setSubmitting(false);
    }
  };

  if (showCustom) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="اكتب اسم التصنيف المقترح..."
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSuggest(); } }}
          />
          <Button type="button" size="sm" onClick={handleSuggest} disabled={submitting || !customName.trim()} className="shrink-0">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground underline"
          onClick={() => { setShowCustom(false); setCustomName(""); }}
        >
          العودة للقائمة
        </button>
      </div>
    );
  }

  return (
    <Select onValueChange={handleValueChange} value={value}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {categories?.map((c) => (
          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
        ))}
        <SelectItem value="__other__">أخرى (اقتراح تصنيف جديد)</SelectItem>
      </SelectContent>
    </Select>
  );
}
