import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Project, Task, TaskStatus, EffortSize } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getProjects, updateProject, getTasksByProject, createTask, updateTask, deleteTask } from "@/lib/store";
import { assessRisk, getProjectSummary } from "@/lib/risk";
import { getCurrentFiscalQuarter, getAdjacentQuarters } from "@/lib/fiscal";
import { FiscalQuarter } from "@/lib/types";
import { GanttChart } from "@/components/GanttChart";
import { TaskForm } from "@/components/TaskForm";
import { BulkEditTasks } from "@/components/BulkEditTasks";
import { StatusBadge, RiskBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, CalendarDays, CheckCircle2, AlertTriangle, Clock, Loader2, CornerDownRight, TableProperties } from "lucide-react";

const ProjectView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [parentForSubtask, setParentForSubtask] = useState<Task | undefined>();
  const [selectedQuarter, setSelectedQuarter] = useState<FiscalQuarter>(getCurrentFiscalQuarter());
  const [bulkEditing, setBulkEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const quarters = getAdjacentQuarters(2);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      const projects = await getProjects();
      const p = projects.find((p) => p.id === id);
      if (!p) { navigate("/"); return; }
      setProject(p);
      setNameValue(p.name);
      const t = await getTasksByProject(id);
      setTasks(t);
    } catch (err) {
      console.error("Failed to load project:", err);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return null;

  const risk = assessRisk(tasks);
  const summary = getProjectSummary(tasks);

  const handleSaveName = async () => {
    if (nameValue.trim() && nameValue.trim() !== project.name) {
      await updateProject(project.id, nameValue.trim());
    }
    setEditingName(false);
    refresh();
  };

  const handleSaveTask = async (data: { name: string; start_date: string; end_date: string; status: TaskStatus; detail: string; parent_id?: string | null }) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask({ ...data, project_id: project.id, parent_id: data.parent_id ?? null });
    }
    setEditingTask(undefined);
    refresh();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Delete this task?")) {
      await deleteTask(taskId);
      refresh();
    }
  };

  const handleBulkSave = async (
    updates: Array<{ id: string; changes: Partial<Omit<Task, "id" | "project_id">> }>,
    deletedIds: string[]
  ) => {
    for (const id of deletedIds) {
      await deleteTask(id);
    }
    for (const { id, changes } of updates) {
      await updateTask(id, changes);
    }
    setBulkEditing(false);
    refresh();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-3 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  className="text-lg font-semibold h-9 w-64"
                  autoFocus
                />
                <Button size="icon" variant="ghost" onClick={handleSaveName}><Check className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => { setEditingName(false); setNameValue(project.name); }}><X className="h-4 w-4" /></Button>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
                <Button size="icon" variant="ghost" onClick={() => setEditingName(true)} className="text-muted-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
          <div className="mt-2">
            <RiskBadge level={risk.level} reasons={risk.reasons} />
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard icon={<CalendarDays className="h-4 w-4 text-primary" />} label="Total Tasks" value={summary.totalTasks} />
          <SummaryCard icon={<CheckCircle2 className="h-4 w-4 text-status-done" />} label="Completed" value={summary.completedTasks} />
          <SummaryCard icon={<AlertTriangle className="h-4 w-4 text-status-at-risk" />} label="Overdue" value={summary.overdueTasks} />
          <SummaryCard
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            label="Next Due"
            value={summary.nextDueDate ? new Date(summary.nextDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Timeline</CardTitle>
              <Select
                value={`${selectedQuarter.quarter}-${selectedQuarter.year}`}
                onValueChange={(v) => {
                  const [q, y] = v.split("-").map(Number);
                  const found = quarters.find((qr) => qr.quarter === q && qr.year === y);
                  if (found) setSelectedQuarter(found);
                }}
              >
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((q) => (
                    <SelectItem key={`${q.quarter}-${q.year}`} value={`${q.quarter}-${q.year}`}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <GanttChart tasks={tasks} quarter={selectedQuarter} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Tasks</CardTitle>
              <div className="flex items-center gap-2">
                {tasks.length > 0 && !bulkEditing && (
                  <Button size="sm" variant="outline" onClick={() => setBulkEditing(true)}>
                    <TableProperties className="h-4 w-4 mr-1" /> Edit
                  </Button>
                )}
                {!bulkEditing && (
                  <Button size="sm" onClick={() => { setEditingTask(undefined); setParentForSubtask(undefined); setShowTaskForm(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Add Task
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {bulkEditing ? (
              <BulkEditTasks
                tasks={tasks}
                onSave={handleBulkSave}
                onCancel={() => setBulkEditing(false)}
              />
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tasks yet. Add one to get started.</p>
            ) : (
              <div className="space-y-2">
                {tasks.filter((t) => !t.parent_id).map((task) => {
                  const subtasks = tasks.filter((t) => t.parent_id === task.id);
                  return (
                    <div key={task.id}>
                      <TaskRow
                        task={task}
                        isOverdue={new Date(task.end_date) < new Date() && task.status !== "Done"}
                        onEdit={() => { setEditingTask(task); setParentForSubtask(undefined); setShowTaskForm(true); }}
                        onDelete={() => handleDeleteTask(task.id)}
                        onAddSubtask={() => { setEditingTask(undefined); setParentForSubtask(task); setShowTaskForm(true); }}
                      />
                      {subtasks.length > 0 && (
                        <div className="ml-6 mt-1 space-y-1 border-l-2 border-border pl-3">
                          {subtasks.map((sub) => (
                            <TaskRow
                              key={sub.id}
                              task={sub}
                              isOverdue={new Date(sub.end_date) < new Date() && sub.status !== "Done"}
                              isSubtask
                              onEdit={() => { setEditingTask(sub); setParentForSubtask(undefined); setShowTaskForm(true); }}
                              onDelete={() => handleDeleteTask(sub.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <TaskForm
        open={showTaskForm}
        onClose={() => { setShowTaskForm(false); setEditingTask(undefined); setParentForSubtask(undefined); }}
        onSave={handleSaveTask}
        initialData={editingTask}
        parentTask={parentForSubtask}
      />
    </div>
  );
};

function TaskRow({
  task,
  isOverdue,
  isSubtask,
  onEdit,
  onDelete,
  onAddSubtask,
}: {
  task: Task;
  isOverdue: boolean;
  isSubtask?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onAddSubtask?: () => void;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-md border border-border bg-card hover:bg-accent/50 transition-colors group",
      isSubtask && "py-2"
    )}>
      {isSubtask && <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("text-sm font-medium text-foreground truncate", isSubtask && "text-xs")}>{task.name}</span>
          <StatusBadge status={task.status} />
          {isOverdue && (
            <span className="text-[10px] font-medium text-destructive">OVERDUE</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{task.start_date} → {task.end_date}</span>
          {task.detail && <span className="truncate">· {task.detail}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onAddSubtask && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onAddSubtask} title="Add subtask">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
        <p className="text-xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

export default ProjectView;
