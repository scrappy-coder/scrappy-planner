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
} from "recharts";

interface BurnDownChartProps {
  projects: Project[];
  tasks: Task[];
}

export function BurnDownChart({ projects, tasks }: BurnDownChartProps) {
  const data = useMemo(() => {
    if (tasks.length === 0) return [];

    const allDates = tasks.flatMap((t) => [new Date(t.start_date), new Date(t.end_date)]);
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

    // Generate weekly data points
    const points: { date: string; [key: string]: string | number }[] = [];
    const current = new Date(minDate);
    current.setHours(0, 0, 0, 0);

    while (current <= maxDate) {
      const point: { date: string; [key: string]: string | number } = {
        date: current.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };

      for (const project of projects) {
        const projectTasks = tasks.filter((t) => t.project_id === project.id);
        if (projectTasks.length === 0) continue;

        // Tasks not completed by this date = tasks that exist by this date and are not done
        // Simulate: a task is "done" if its end_date <= current date AND status is Done
        const activeTasks = projectTasks.filter((t) => new Date(t.start_date) <= current);
        const notCompleted = activeTasks.filter((t) => {
          if (t.status === "Done") {
            // Assume done tasks completed by their end_date
            return new Date(t.end_date) > current;
          }
          return true;
        }).length;

        point[project.name] = notCompleted;
      }

      points.push(point);
      current.setDate(current.getDate() + 7);
    }

    // Add final point at maxDate
    const finalPoint: { date: string; [key: string]: string | number } = {
      date: maxDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    for (const project of projects) {
      const projectTasks = tasks.filter((t) => t.project_id === project.id);
      if (projectTasks.length === 0) continue;
      const remaining = projectTasks.filter((t) => t.status !== "Done").length;
      finalPoint[project.name] = remaining;
    }
    points.push(finalPoint);

    return points;
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
