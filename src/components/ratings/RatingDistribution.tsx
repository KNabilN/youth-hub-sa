import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingDistributionProps {
  ratings: { quality_score: number; timing_score: number; communication_score: number }[];
}

export function RatingDistribution({ ratings }: RatingDistributionProps) {
  if (!ratings.length) return null;

  // Calculate distribution (1-5 stars)
  const avgScores = ratings.map(r => Math.round((r.quality_score + r.timing_score + r.communication_score) / 3));
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: avgScores.filter(s => s === star).length,
    pct: (avgScores.filter(s => s === star).length / ratings.length) * 100,
  }));

  const overallAvg = (avgScores.reduce((a, b) => a + b, 0) / avgScores.length).toFixed(1);

  return (
    <div className="flex gap-6 items-start">
      {/* Big average */}
      <div className="flex flex-col items-center gap-1 min-w-[80px]">
        <span className="text-4xl font-bold">{overallAvg}</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map(s => (
            <Star key={s} className={cn("h-4 w-4", s <= Math.round(Number(overallAvg)) ? "text-warning fill-warning" : "text-muted-foreground/20")} />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{ratings.length} تقييم</span>
      </div>

      {/* Bars */}
      <div className="flex-1 space-y-1.5">
        {distribution.map(d => (
          <div key={d.star} className="flex items-center gap-2 text-sm">
            <span className="w-3 text-muted-foreground">{d.star}</span>
            <Star className="h-3 w-3 text-warning fill-warning" />
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-warning rounded-full transition-all" style={{ width: `${d.pct}%` }} />
            </div>
            <span className="w-6 text-xs text-muted-foreground text-end">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
