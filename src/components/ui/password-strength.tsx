import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "ضعيفة", color: "bg-destructive" };
  if (score <= 2) return { score: 2, label: "متوسطة", color: "bg-[hsl(var(--warning,40_96%_50%))]" };
  if (score <= 3) return { score: 3, label: "جيدة", color: "bg-[hsl(var(--info,210_100%_50%))]" };
  return { score: 4, label: "قوية", color: "bg-primary" };
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  if (!password) return null;
  const { score, label, color } = getStrength(password);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-full transition-colors duration-300",
              i <= score ? color : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className={cn("text-[11px] font-medium", score <= 1 ? "text-destructive" : score <= 2 ? "text-muted-foreground" : "text-primary")}>
        قوة كلمة المرور: {label}
      </p>
    </div>
  );
}
