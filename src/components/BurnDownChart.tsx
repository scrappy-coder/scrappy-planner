import { useMemo, useState } from "react";
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

  const selectedQ = useMemo(
    () => ALL_QUARTERS.find((q) => q.label === selectedQuarter),
    [selectedQuarter]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => t.fiscal_quarter === selectedQuarter);
  }, [tasks, selectedQuarter]);

  const quarterLabels = useMemo(() => {
    const labels = new Set(tasks.map((t) => t.fiscal_quarter).filter(Boolean));
    // Show all quarters but highlight ones with tasks
    return ALL_QUARTERS.filter((q) => labels.has(q.label) || q.label === selectedQuarter);
  }, [tasks, selectedQuarter]);

  const { data, todayLabel } = useMemo(() => {
    if (!selectedQ || filteredTasks.length === 0) return { data: [], todayLabel: "" };

    const minDate = selectedQ.start;
    const maxDate = selectedQ.end;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatDate = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const totalEffort = filteredTasks.reduce((sum, t) => sum + getEffortValue(t.effort), 0);

    // Weekly sampling within quarter range
    const dateSet = new Map<number, Date>();
    const current = new Date(minDate);
    current.setHours(0, 0, 0, 0);

    while (current <= maxDate) {
      dateSet.set(current.getTime(), new Date(current));
      current.setDate(current.getDate() + 7);
    }
    dateSet.set(maxDate.getTime(), new Date(maxDate));

    const todayInRange = today >= minDate && today <= maxDate;
    if (todayInRange) {
      dateSet.set(today.getTime(), new Date(today));
    }

    const sortedDates = Array.from(dateSet.values()).sort((a, b) => a.getTime() - b.getTime());

    const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
    const dailyBurnRate = totalEffort / totalDays;

    const usedLabels = new Map<string, number>();
    let resolvedTodayLabel = "";

    const points = sortedDates.map((d) => {
      let label = formatDate(d);
      const count = usedLabels.get(label) || 0;
      if (count > 0) label = `${label}${"\u200B".repeat(count)}`;
      usedLabels.set(label, count + 1);

      if (todayInRange && d.getTime() === today.getTime()) {
        resolvedTodayLabel = label;
      }

      // Actual: sum of remaining effort across all projects
      const remaining = filteredTasks.reduce((sum, t) => {
        if (t.status === "Done" && new Date(t.end_date) <= d) return sum;
        return sum + getEffortValue(t.effort);
      }, 0);

      // Ideal burndown
      const daysElapsed = Math.max(0, (d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      const ideal = Math.max(0, Math.round((totalEffort - dailyBurnRate * daysElapsed) * 10) / 10);

      return { date: label, Actual: remaining, Ideal: ideal };
    });

    return { data: points, todayLabel: resolvedTodayLabel };
  }, [filteredTasks, selectedQ]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
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
              dataKey="date"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--border))" }}
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
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="line" />
            {todayLabel && (
              <ReferenceLine
                x={todayLabel}
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
