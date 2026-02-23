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
          <Button
            size="icon"
            className="rounded-full h-12 w-12 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 border-0"
          >
            <Accessibility className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-64 rounded-xl shadow-xl">
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Accessibility className="h-4 w-4 text-primary" />
              إمكانية الوصول
            </h4>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">حجم النص</Label>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={() => changeFontSize(-2)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="flex-1 text-center">
                  <span className="text-sm font-bold">{fontSize}px</span>
                </div>
                <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={() => changeFontSize(2)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <SunMoon className="h-4 w-4 text-muted-foreground" />
                <Label className="text-xs font-medium">تباين عالي</Label>
              </div>
              <Switch checked={highContrast} onCheckedChange={toggleContrast} />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
