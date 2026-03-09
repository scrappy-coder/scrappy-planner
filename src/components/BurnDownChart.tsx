import { useMemo } from "react";
import { Project, Task } from "@/lib/types";
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

export function BurnDownChart({ projects, tasks }: BurnDownChartProps) {
  const { data, todayLabel } = useMemo(() => {
    if (tasks.length === 0) return { data: [], todayLabel: "" };

    const allDates = tasks.flatMap((t) => [new Date(t.start_date), new Date(t.end_date)]);
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatDate = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    // Collect all date milestones (weekly + today + maxDate), deduplicate by timestamp
    const dateSet = new Map<number, Date>();
    const current = new Date(minDate);
    current.setHours(0, 0, 0, 0);

    while (current <= maxDate) {
      dateSet.set(current.getTime(), new Date(current));
      current.setDate(current.getDate() + 7);
    }
    dateSet.set(maxDate.getTime(), new Date(maxDate));

    // Insert today if within range
    const todayInRange = today >= minDate && today <= maxDate;
    if (todayInRange) {
      dateSet.set(today.getTime(), new Date(today));
    }

    // Sort dates and build data points
    const sortedDates = Array.from(dateSet.values()).sort((a, b) => a.getTime() - b.getTime());

    // Use unique labels (append year-month-day to avoid dups with same formatted string)
    const usedLabels = new Map<string, number>();
    let resolvedTodayLabel = "";

    const points = sortedDates.map((d) => {
      let label = formatDate(d);
      const count = usedLabels.get(label) || 0;
      if (count > 0) {
        label = `${label} `; // add invisible space to make unique
      }
      usedLabels.set(label, count + 1);

      if (todayInRange && d.getTime() === today.getTime()) {
        resolvedTodayLabel = label;
      }

      const point: { date: string; [key: string]: string | number } = { date: label };

      for (const project of projects) {
        const projectTasks = tasks.filter((t) => t.project_id === project.id);
        if (projectTasks.length === 0) continue;

        const activeTasks = projectTasks.filter((t) => new Date(t.start_date) <= d);
        const notCompleted = activeTasks.filter((t) => {
          if (t.status === "Done") {
            return new Date(t.end_date) > d;
          }
          return true;
        }).length;

        point[project.name] = notCompleted;
      }

      return point;
    });

    return { data: points, todayLabel: resolvedTodayLabel };
  }, [projects, tasks]);

  const projectNames = useMemo(
    () =>
      projects
        .filter((p) => tasks.some((t) => t.project_id === p.id))
        .map((p) => p.name),
    [projects, tasks]
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
      <div className="text-sm text-muted-foreground text-center py-6">
        No task data to display.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
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
            value: "Remaining Tasks",
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
        <Legend
          wrapperStyle={{ fontSize: 11 }}
          iconType="line"
        />
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
  );
}
