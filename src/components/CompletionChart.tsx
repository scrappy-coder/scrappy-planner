import { useMemo } from "react";
import { Project, Task } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CompletionChartProps {
  projects: Project[];
  tasks: Task[];
}

export function CompletionChart({ projects, tasks }: CompletionChartProps) {
  const data = useMemo(() => {
    return projects
      .map((p) => {
        const projectTasks = tasks.filter((t) => t.project_id === p.id);
        if (projectTasks.length === 0) return null;
        const done = projectTasks.filter((t) => t.status === "Done").length;
        const pct = Math.round((done / projectTasks.length) * 100);
        return {
          name: p.name.length > 18 ? p.name.slice(0, 16) + "…" : p.name,
          fullName: p.name,
          completion: pct,
          done,
          total: projectTasks.length,
        };
      })
      .filter(Boolean) as { name: string; fullName: string; completion: number; done: number; total: number }[];
  }, [projects, tasks]);

  if (data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-6">
        No data to display.
      </div>
    );
  }

  const barHeight = Math.max(220, data.length * 50);

  return (
    <div className="w-full" style={{ height: barHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 30, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--accent))" }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number, _name: string, props: any) => [
              `${value}% (${props.payload.done}/${props.payload.total})`,
              props.payload.fullName,
            ]}
            labelFormatter={() => ""}
          />
          <Bar dataKey="completion" radius={[0, 4, 4, 0]} barSize={24}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.completion === 100
                    ? "hsl(var(--status-done))"
                    : "hsl(var(--primary))"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
