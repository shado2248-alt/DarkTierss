import { cn } from "@/lib/utils";

interface TierBadgeProps {
  tierName?: string | null;
  tierColor?: string | null;
  className?: string;
}

export function TierBadge({ tierName, tierColor, className }: TierBadgeProps) {
  if (!tierName) {
    return <span className={cn("text-xs text-muted-foreground", className)}>Unranked</span>;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold shadow-sm",
        className
      )}
      style={{
        backgroundColor: tierColor ? `${tierColor}20` : "rgba(120, 40, 200, 0.2)",
        color: tierColor || "hsl(270, 80%, 70%)",
        border: `1px solid ${tierColor ? `${tierColor}40` : "rgba(120, 40, 200, 0.4)"}`,
      }}
    >
      {tierName}
    </div>
  );
}
