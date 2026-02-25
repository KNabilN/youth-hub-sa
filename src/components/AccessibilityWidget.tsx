import { useState, useEffect } from "react";
import { Accessibility, Plus, Minus, SunMoon, MousePointer, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function AccessibilityWidget() {
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);
  const [focusHighlight, setFocusHighlight] = useState(false);
  const [largePointer, setLargePointer] = useState(false);

  const changeFontSize = (delta: number) => {
    const next = Math.min(24, Math.max(12, fontSize + delta));
    setFontSize(next);
    document.documentElement.style.fontSize = `${next}px`;
  };

  const toggleContrast = (on: boolean) => {
    setHighContrast(on);
    document.documentElement.classList.toggle("high-contrast", on);
  };

  const toggleFocusHighlight = (on: boolean) => {
    setFocusHighlight(on);
    document.documentElement.classList.toggle("focus-highlight", on);
  };

  const toggleLargePointer = (on: boolean) => {
    setLargePointer(on);
    document.documentElement.classList.toggle("large-pointer", on);
  };

  // Announce widget state changes to screen readers
  useEffect(() => {
    const announcement = document.getElementById("a11y-announcer");
    if (announcement) {
      announcement.textContent = "";
    }
  }, [fontSize, highContrast, focusHighlight, largePointer]);

  return (
    <>
      <div id="a11y-announcer" className="sr-only" aria-live="polite" aria-atomic="true" />
      <div className="fixed bottom-4 left-4 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              className="rounded-full h-12 w-12 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 border-0"
              aria-label="إعدادات إمكانية الوصول"
            >
              <Accessibility className="h-5 w-5" aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-72 rounded-xl shadow-xl" role="dialog" aria-label="إمكانية الوصول">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Accessibility className="h-4 w-4 text-primary" aria-hidden="true" />
                إمكانية الوصول
              </h4>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Type className="h-3 w-3" aria-hidden="true" />
                  حجم النص
                </Label>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={() => changeFontSize(-2)} aria-label="تصغير النص">
                    <Minus className="h-3 w-3" aria-hidden="true" />
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="text-sm font-bold" aria-live="polite">{fontSize}px</span>
                  </div>
                  <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={() => changeFontSize(2)} aria-label="تكبير النص">
                    <Plus className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <SunMoon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Label htmlFor="high-contrast" className="text-xs font-medium cursor-pointer">تباين عالي</Label>
                </div>
                <Switch id="high-contrast" checked={highContrast} onCheckedChange={toggleContrast} aria-label="تفعيل التباين العالي" />
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Accessibility className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Label htmlFor="focus-highlight" className="text-xs font-medium cursor-pointer">تمييز التركيز</Label>
                </div>
                <Switch id="focus-highlight" checked={focusHighlight} onCheckedChange={toggleFocusHighlight} aria-label="تفعيل تمييز التركيز" />
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <MousePointer className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Label htmlFor="large-pointer" className="text-xs font-medium cursor-pointer">مؤشر كبير</Label>
                </div>
                <Switch id="large-pointer" checked={largePointer} onCheckedChange={toggleLargePointer} aria-label="تفعيل المؤشر الكبير" />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
