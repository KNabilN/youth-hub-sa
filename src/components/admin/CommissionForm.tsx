import { useState, useEffect } from "react";
import { useCommissionConfig, useUpdateCommission } from "@/hooks/useAdminFinance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Percent, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CommissionForm() {
  const { data: config, isLoading } = useCommissionConfig();
  const update = useUpdateCommission();
  const [rate, setRate] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    if (config) {
      setRate(String(Number(config.rate) * 100));
      setDesc(config.description ?? "");
    }
  }, [config]);

  const handleSave = () => {
    if (!config) return;
    const rateNum = parseFloat(rate) / 100;
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 1) {
      toast.error("أدخل نسبة صحيحة بين 0 و 100");
      return;
    }
    update.mutate({ id: config.id, rate: rateNum, description: desc }, {
      onSuccess: () => toast.success("تم تحديث نسبة العمولة"),
      onError: () => toast.error("حدث خطأ"),
    });
  };

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">نسبة العمولة</CardTitle>
          </div>
          {config && (
            <Badge variant="secondary" className="text-sm">
              {(Number(config.rate) * 100).toFixed(1)}%
            </Badge>
          )}
        </div>
        <CardDescription>تحديد نسبة العمولة المقتطعة من كل معاملة مالية على المنصة</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>النسبة (%)</Label>
          <Input type="number" value={rate} onChange={(e) => setRate(e.target.value)} min={0} max={100} step={0.1} />
        </div>
        <div className="space-y-2">
          <Label>الوصف</Label>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          حفظ
        </Button>
      </CardContent>
    </Card>
  );
}
