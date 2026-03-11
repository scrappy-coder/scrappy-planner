import { useEffect, useMemo, useState } from "react";
import { Project, Task, EFFORT_VALUES, EffortSize } from "@/lib/types";
import { getAdjacentQuarters } from "@/lib/fiscal";
import { FiscalQuarter } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";

interface BurnDownChartProps {
  projects: Project[];
  tasks: Task[];
}

const ALL_QUARTERS = getAdjacentQuarters(4);

function getEffortValue(effort: string): number {
  return EFFORT_VALUES[effort as EffortSize] ?? 3;
}

export function BurnDownChart({ tasks }: BurnDownChartProps) {
  // Default to the latest quarter that has tasks
  const defaultQuarter = useMemo(() => {
    const quartersWithTasks = ALL_QUARTERS.filter((q) =>
      tasks.some((t) => t.fiscal_quarter === q.label)
    );
    return quartersWithTasks.length > 0
      ? quartersWithTasks[quartersWithTasks.length - 1].label
      : ALL_QUARTERS[ALL_QUARTERS.length - 1].label;
  }, [tasks]);

  const [selectedQuarter, setSelectedQuarter] = useState<string>(defaultQuarter);
  const [hasManualQuarterSelection, setHasManualQuarterSelection] = useState(false);

  useEffect(() => {
    if (!hasManualQuarterSelection) {
      setSelectedQuarter(defaultQuarter);
    }
  }, [defaultQuarter, hasManualQuarterSelection]);

  const selectedQ = useMemo(
    () => ALL_QUARTERS.find((q) => q.label === selectedQuarter),
    [selectedQuarter]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => t.fiscal_quarter === selectedQuarter);
  }, [tasks, selectedQuarter]);

  const { data, todayKey } = useMemo(() => {
    if (!selectedQ || filteredTasks.length === 0) return { data: [], todayKey: "" };

    const toLocalDate = (value: Date | string) => {
      if (typeof value === "string") {
        const [y, m, d] = value.split("-").map(Number);
        const parsed = new Date(y, m - 1, d);
        parsed.setHours(0, 0, 0, 0);
        return parsed;
      }
      const parsed = new Date(value);
      parsed.setHours(0, 0, 0, 0);
      return parsed;
    };

    const toDateKey = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const minDate = toLocalDate(selectedQ.start);
    const maxDate = toLocalDate(selectedQ.end);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const remainingEffortAtDate = (d: Date) => {
      return filteredTasks.reduce((sum, t) => {
        if (t.status === "Done") {
          const endLocal = toLocalDate(t.end_date);
          if (endLocal <= d) return sum;
        }
        return sum + getEffortValue(t.effort);
      }, 0);
    };

    // Keep both lines aligned at the same start value for the selected quarter
    const startingEffort = remainingEffortAtDate(minDate);

    // 2-week sprint cadence for ideal burndown
    const SPRINT_DAYS = 14;
    const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
    const numSprints = Math.max(1, Math.ceil(totalDays / SPRINT_DAYS));
    const effortPerSprint = startingEffort / numSprints;

    // Daily sampling so exact completion dates (e.g. Mar 6) are visible
    const points: Array<{ dateKey: string; Actual: number; Ideal: number }> = [];
    const cursor = new Date(minDate);

    while (cursor <= maxDate) {
      const daysElapsed = Math.max(
        0,
        Math.floor((cursor.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      const sprintsCompleted = Math.floor(daysElapsed / SPRINT_DAYS);

      const ideal = Math.max(
        0,
        Math.round((startingEffort - effortPerSprint * sprintsCompleted) * 10) / 10
      );

      points.push({
        dateKey: toDateKey(cursor),
        Actual: remainingEffortAtDate(cursor),
        Ideal: ideal,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    const todayInRange = today >= minDate && today <= maxDate;
    return { data: points, todayKey: todayInRange ? toDateKey(today) : "" };
  }, [filteredTasks, selectedQ]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Select
          value={selectedQuarter}
          onValueChange={(value) => {
            setHasManualQuarterSelection(true);
            setSelectedQuarter(value);
          }}
        >
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALL_QUARTERS.map((q) => (
              <SelectItem key={q.label} value={q.label}>{q.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {data.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-6">
          No tasks assigned to {selectedQuarter}.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 16, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="dateKey"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              minTickGap={24}
              tickFormatter={(value: string) => {
                const [y, m, d] = value.split("-").map(Number);
                return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
              label={{
                value: "Effort Points",
                angle: -90,
                position: "insideLeft",
                offset: 20,
                style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
              }}
            />
            <Tooltip
              labelFormatter={(value: string) => {
                const [y, m, d] = value.split("-").map(Number);
                return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="line" />
            {todayKey && (
              <ReferenceLine
                x={todayKey}
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                strokeDasharray="4 3"
                label={{
                  value: "Today",
                  position: "top",
                  fill: "hsl(var(--destructive))",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="Ideal"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="Actual"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
