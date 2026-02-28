import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, Square, Timer } from "lucide-react";

interface WorkTimerProps {
  onStop: (startTime: string, endTime: string, hours: number) => void;
}

export function WorkTimer({ onStop }: WorkTimerProps) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const timeFmt = (d: Date) => d.toTimeString().slice(0, 5); // HH:MM

  const handleStart = () => {
    setStartedAt(new Date());
    setElapsed(0);
    setRunning(true);
  };

  const handlePause = () => setRunning(false);
  const handleResume = () => setRunning(true);

  const handleStop = useCallback(() => {
    setRunning(false);
    const end = new Date();
    const hours = Math.round((elapsed / 3600) * 100) / 100;
    onStop(startedAt ? timeFmt(startedAt) : "", timeFmt(end), hours > 0 ? hours : 0.01);
    setElapsed(0);
    setStartedAt(null);
  }, [elapsed, startedAt, onStop]);

  const isActive = running || elapsed > 0;

  return (
    <Card className={`border-2 transition-colors ${running ? "border-primary animate-pulse" : isActive ? "border-primary/50" : "border-dashed border-muted-foreground/30"}`}>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-3">
          <Timer className={`h-5 w-5 ${running ? "text-primary" : "text-muted-foreground"}`} />
          <div>
            <p className="text-xs text-muted-foreground">المؤقت</p>
            <p className={`text-2xl font-mono font-bold tabular-nums ${running ? "text-primary" : "text-foreground"}`}>{fmt(elapsed)}</p>
          </div>
          {startedAt && (
            <p className="text-xs text-muted-foreground me-2">بدأ: {timeFmt(startedAt)}</p>
          )}
        </div>
        <div className="flex gap-2">
          {!isActive && (
            <Button size="sm" onClick={handleStart} className="gap-1.5">
              <Play className="h-3.5 w-3.5" /> ابدأ
            </Button>
          )}
          {running && (
            <Button size="sm" variant="outline" onClick={handlePause} className="gap-1.5">
              <Pause className="h-3.5 w-3.5" /> إيقاف مؤقت
            </Button>
          )}
          {!running && isActive && (
            <Button size="sm" variant="outline" onClick={handleResume} className="gap-1.5">
              <Play className="h-3.5 w-3.5" /> استئناف
            </Button>
          )}
          {isActive && (
            <Button size="sm" variant="destructive" onClick={handleStop} className="gap-1.5">
              <Square className="h-3.5 w-3.5" /> إنهاء
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
