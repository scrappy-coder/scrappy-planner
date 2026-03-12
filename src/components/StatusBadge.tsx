import { TaskStatus, RiskLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<TaskStatus, string> = {
  "Done": "bg-status-done/15 text-status-done border-status-done/30",
  "In Progress": "bg-status-in-progress/15 text-status-in-progress border-status-in-progress/30",
  "In Review": "bg-status-in-review/15 text-status-in-review border-status-in-review/30",
  "Not Started": "bg-status-not-started/15 text-status-not-started border-status-not-started/30",
  "Blocked": "bg-status-blocked/15 text-status-blocked border-status-blocked/30",
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", statusStyles[status])}>
      {status}
    </Badge>
  );
}

export function RiskBadge({ level, reasons }: { level: RiskLevel; reasons: string[] }) {
  const isRisk = level === "At Risk";
  const isBehind = level === "Behind Schedule";
  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className={cn(
          "text-xs font-medium",
          isRisk
            ? "bg-status-at-risk/15 text-status-at-risk border-status-at-risk/30"
            : isBehind
              ? "bg-orange-500/15 text-orange-500 border-orange-500/30"
              : "bg-status-on-track/15 text-status-on-track border-status-on-track/30"
        )}
      >
        {level}
      </Badge>
      {(isRisk || isBehind) && reasons.length > 0 && (
        <span className="text-xs text-muted-foreground">{reasons[0]}</span>
      )}
    </div>
  );
}
