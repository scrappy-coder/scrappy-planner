import { useState, useCallback, DragEvent } from "react";
import { Task, Project } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { MemoPad } from "@/components/MemoPad";
import { GripVertical, Target, ListTodo } from "lucide-react";

const FOCUS_KEY = "scrappy-focus-task-ids";

function loadFocusedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(FOCUS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
}

function saveFocusedIds(ids: Set<string>) {
  localStorage.setItem(FOCUS_KEY, JSON.stringify([...ids]));
}

function getTaskStyle(task: Task, isOverdue: boolean, isBehind: boolean): React.CSSProperties {
  const alpha = (cssVar: string, opacity: number) => `hsla(var(${cssVar}) / ${opacity})`;
  if (isOverdue) return { backgroundColor: alpha("--destructive", 0.1), borderColor: alpha("--destructive", 0.3) };
  if (isBehind) return { backgroundColor: alpha("--status-at-risk", 0.1), borderColor: alpha("--status-at-risk", 0.3) };
  if (task.status === "Blocked") return { backgroundColor: alpha("--status-blocked", 0.1), borderColor: alpha("--status-blocked", 0.3) };
  if (task.status === "In Progress") return { backgroundColor: alpha("--status-in-progress", 0.1), borderColor: alpha("--status-in-progress", 0.3) };
  if (task.status === "In Review") return { backgroundColor: alpha("--status-in-review", 0.1), borderColor: alpha("--status-in-review", 0.3) };
  if (task.status === "Done") return { backgroundColor: alpha("--status-done", 0.1), borderColor: alpha("--status-done", 0.3) };
  return {};
}

function formatDueDate(dateStr: string): string {
  const [_y, m, d] = dateStr.split("-");
  return `${m}-${d}`;
}

interface TaskCardProps {
  task: Task;
  project?: Project;
  isOverdue: boolean;
  isBehind: boolean;
  isDemo: boolean;
  onNavigate: () => void;
}

function TaskCard({ task, project, isOverdue, isBehind, isDemo, onNavigate }: TaskCardProps) {
  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const colorClass = getTaskColorClass(task, isOverdue, isBehind);

  return (
    <div
      draggable={!isDemo}
      onDragStart={handleDragStart}
      className={`flex items-center gap-2 p-3 rounded-md border transition-colors ${colorClass} hover:opacity-80 ${isDemo ? "" : "cursor-grab active:cursor-grabbing"}`}
      onClick={() => !isDemo && onNavigate()}
    >
      {!isDemo && <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">{task.name}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{project?.name ?? "Unknown"}</span>
          <span>· due {formatDueDate(task.end_date)}</span>
        </div>
      </div>
    </div>
  );
}

interface DropZoneProps {
  title: string;
  icon: React.ReactNode;
  tasks: Task[];
  projects: Project[];
  today: Date;
  isDemo: boolean;
  onNavigate: (projectId: string) => void;
  onDrop: (taskId: string) => void;
  emptyText: string;
}

function DropZone({ title, icon, tasks, projects, today, isDemo, onNavigate, onDrop, emptyText }: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) onDrop(taskId);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-lg border-2 border-dashed transition-colors p-4 ${
        dragOver ? "border-primary bg-primary/5" : "border-transparent"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground ml-auto">{tasks.length}</span>
      </div>
      <div className="space-y-2 max-h-[272px] overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">{emptyText}</p>
        ) : (
          tasks.map((task) => {
            const proj = projects.find((p) => p.id === task.project_id);
            const [y, m, d] = task.end_date.split("-").map(Number);
            const end = new Date(y, m - 1, d);
            const isOverdue = end < today;
            const [sy, sm, sd] = task.start_date.split("-").map(Number);
            const start = new Date(sy, sm - 1, sd);
            const isBehind = !isOverdue && ((start < today && task.status === "Not Started") || (end < today && task.status === "In Progress"));
            return (
              <TaskCard
                key={task.id}
                task={task}
                project={proj}
                isOverdue={isOverdue}
                isBehind={isBehind}
                isDemo={isDemo}
                onNavigate={() => onNavigate(task.project_id)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

interface TodayBoardProps {
  tasks: Task[];
  projects: Project[];
  isDemo: boolean;
  onNavigate: (projectId: string) => void;
}

export function TodayBoard({ tasks, projects, isDemo, onNavigate }: TodayBoardProps) {
  const [focusedIds, setFocusedIds] = useState<Set<string>>(() => loadFocusedIds());

  const updateFocused = useCallback((updater: (prev: Set<string>) => Set<string>) => {
    setFocusedIds((prev) => {
      const next = updater(new Set(prev));
      saveFocusedIds(next);
      return next;
    });
  }, []);

  const moveToFocus = useCallback((taskId: string) => {
    updateFocused((s) => { s.add(taskId); return s; });
  }, [updateFocused]);

  const moveToTodo = useCallback((taskId: string) => {
    updateFocused((s) => { s.delete(taskId); return s; });
  }, [updateFocused]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validFocusedIds = new Set([...focusedIds].filter((id) => tasks.some((t) => t.id === id)));
  const focusTasks = tasks.filter((t) => validFocusedIds.has(t.id));
  const todoTasks = tasks.filter((t) => !validFocusedIds.has(t.id));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardContent className="py-4 px-3">
          <DropZone
            title="Today's Focus"
            icon={<Target className="h-4 w-4 text-primary" />}
            tasks={focusTasks}
            projects={projects}
            today={today}
            isDemo={isDemo}
            onNavigate={onNavigate}
            onDrop={moveToFocus}
            emptyText="Drag tasks here to focus on today"
          />
        </CardContent>
      </Card>
      <Card className="lg:col-span-1">
        <CardContent className="py-4 px-3">
          <DropZone
            title="Todo"
            icon={<ListTodo className="h-4 w-4 text-muted-foreground" />}
            tasks={todoTasks}
            projects={projects}
            today={today}
            isDemo={isDemo}
            onNavigate={onNavigate}
            onDrop={moveToTodo}
            emptyText="Drag tasks here to plan"
          />
        </CardContent>
      </Card>
      <MemoPad />
    </div>
  );
}
