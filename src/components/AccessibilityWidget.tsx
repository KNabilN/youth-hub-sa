import { useState } from "react";
import { Accessibility, Plus, Minus, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function AccessibilityWidget() {
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);

  const changeFontSize = (delta: number) => {
    const next = Math.min(24, Math.max(12, fontSize + delta));
    setFontSize(next);
    document.documentElement.style.fontSize = `${next}px`;
  };

  const toggleContrast = (on: boolean) => {
    setHighContrast(on);
    document.documentElement.classList.toggle("high-contrast", on);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant="outline" className="rounded-full h-12 w-12 shadow-lg bg-card border-border">
            <Accessibility className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-64">
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">إمكانية الوصول</h4>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">حجم النص</Label>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => changeFontSize(-2)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-medium flex-1 text-center">{fontSize}px</span>
                <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => changeFontSize(2)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SunMoon className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs">تباين عالي</Label>
              </div>
              <Switch checked={highContrast} onCheckedChange={toggleContrast} />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
