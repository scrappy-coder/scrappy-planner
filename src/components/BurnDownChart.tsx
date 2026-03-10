import { useMemo, useState } from "react";
import { Project, Task, EFFORT_VALUES, EffortSize } from "@/lib/types";
import { getAdjacentQuarters } from "@/lib/fiscal";
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

export function BurnDownChart({ projects, tasks }: BurnDownChartProps) {
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");

  const filteredTasks = useMemo(() => {
    if (selectedQuarter === "all") return tasks;
    return tasks.filter((t) => t.fiscal_quarter === selectedQuarter);
  }, [tasks, selectedQuarter]);

  const quarterLabels = useMemo(() => {
    const labels = new Set(tasks.map((t) => t.fiscal_quarter).filter(Boolean));
    return ALL_QUARTERS.filter((q) => labels.has(q.label));
  }, [tasks]);

  const { data, todayLabel, idealData } = useMemo(() => {
    if (filteredTasks.length === 0) return { data: [], todayLabel: "", idealData: [] };

    // Get quarter date range if a specific quarter is selected
    const selectedQ = ALL_QUARTERS.find((q) => q.label === selectedQuarter);

    const allDates = filteredTasks.flatMap((t) => [new Date(t.start_date), new Date(t.end_date)]);
    let minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    let maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    if (selectedQ) {
      minDate = selectedQ.start;
      maxDate = selectedQ.end;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatDate = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    // Total effort for all filtered tasks
    const totalEffort = filteredTasks.reduce((sum, t) => sum + getEffortValue(t.effort), 0);

    // Build daily data points (weekly sampling)
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

      const point: Record<string, string | number> = { date: label };

      // Actual: remaining effort per project
      for (const project of projects) {
        const projectTasks = filteredTasks.filter((t) => t.project_id === project.id);
        if (projectTasks.length === 0) continue;

        const remaining = projectTasks.reduce((sum, t) => {
          if (t.status === "Done" && new Date(t.end_date) <= d) return sum;
          if (new Date(t.start_date) > d) return sum + getEffortValue(t.effort);
          return sum + getEffortValue(t.effort);
        }, 0);

        point[project.name] = remaining;
      }

      // Ideal burndown
      const daysElapsed = Math.max(0, (d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
      point["Ideal"] = Math.max(0, Math.round((totalEffort - dailyBurnRate * daysElapsed) * 10) / 10);

      return point;
    });

    return { data: points, todayLabel: resolvedTodayLabel, idealData: [] };
  }, [projects, filteredTasks, selectedQuarter]);

  const projectNames = useMemo(
    () =>
      projects
        .filter((p) => filteredTasks.some((t) => t.project_id === p.id))
        .map((p) => p.name),
    [projects, filteredTasks]
  );

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  if (data.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <QuarterFilter value={selectedQuarter} onChange={setSelectedQuarter} quarters={quarterLabels} />
        </div>
        <div className="text-sm text-muted-foreground text-center py-6">
          No task data to display.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <QuarterFilter value={selectedQuarter} onChange={setSelectedQuarter} quarters={quarterLabels} />
      </div>
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
          {projectNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function QuarterFilter({ value, onChange, quarters }: { value: string; onChange: (v: string) => void; quarters: { label: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-36 h-8 text-xs">
        <SelectValue placeholder="All Quarters" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Quarters</SelectItem>
        {quarters.map((q) => (
          <SelectItem key={q.label} value={q.label}>{q.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
