import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Project, Task, EFFORT_VALUES, EffortSize } from "@/lib/types";
import { getProjects, createProject, deleteProject, getTasks, seedData, updateProject } from "@/lib/store";
import { assessRisk } from "@/lib/risk";
import { getAdjacentQuarters } from "@/lib/fiscal";
import { RiskBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FolderOpen, Trash2, LayoutDashboard, Loader2 } from "lucide-react";
import { ProjectGantt } from "@/components/ProjectGantt";
import { CompletionChart } from "@/components/CompletionChart";
import { BurnDownChart } from "@/components/BurnDownChart";

function SummaryTiles({ projects, tasks }: { projects: ProjectType[]; tasks: TaskType[] }) {
  const startedProjects = projects.filter((p) => {
    const pTasks = tasks.filter((t) => t.project_id === p.id);
    return pTasks.some((t) => t.status !== "Not Started");
  }).length;

  const totalEffort = tasks.reduce((s, t) => s + (EFFORT_VALUES[t.effort as EffortSize] ?? 3), 0);
  const doneEffort = tasks.filter((t) => t.status === "Done").reduce((s, t) => s + (EFFORT_VALUES[t.effort as EffortSize] ?? 3), 0);
  const effortPct = totalEffort > 0 ? Math.round((doneEffort / totalEffort) * 100) : 0;

  const doneCount = tasks.filter((t) => t.status === "Done").length;
  const taskPct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const atRiskCount = tasks.filter((t) => {
    if (t.status === "Done") return false;
    const end = new Date(t.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (end < today && t.status !== "Done") || t.status === "Blocked";
  }).length;

  const tiles = [
    { label: "Projects Started", value: startedProjects, sub: `of ${projects.length}` },
    { label: "Effort Completion", value: `${effortPct}%`, sub: `(${totalEffort} pts)` },
    { label: "Task Completion", value: `${taskPct}%`, sub: `(${tasks.length} tasks)` },
    { label: "Tasks at Risk", value: atRiskCount, sub: "overdue / blocked", alert: atRiskCount > 0 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((t) => (
        <Card key={t.label}>
          <CardContent className="py-4 px-5">
            <p className="text-xs text-muted-foreground mb-1">{t.label}</p>
            <p className={`text-2xl font-bold ${t.alert ? "text-destructive" : "text-foreground"}`}>{t.value}</p>
            <p className="text-xs text-muted-foreground">{t.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([getProjects(), getTasks()]);
      setProjects(p);
      setAllTasks(t);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    seedData().then(() => refresh());
  }, [refresh]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createProject(newName.trim());
    setNewName("");
    setShowCreate(false);
    refresh();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this project and all its tasks?")) {
      await deleteProject(id);
      refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LayoutDashboard className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Quarterly Planner</h1>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Project
          </Button>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        {projects.length > 0 && (
          <SummaryTiles projects={projects} tasks={allTasks} />
        )}
        {projects.length > 0 && allTasks.length > 0 && (
          <div className="space-y-6">
            <Card>
              <CardContent className="py-4 px-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Project Timeline</h3>
                <ProjectGantt
                  projects={projects}
                  tasks={allTasks}
                  onSelectProject={(id) => navigate(`/project/${id}`)}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 px-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Completion Overview</h3>
                <CompletionChart projects={projects} tasks={allTasks} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 px-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Burn-Down Chart</h3>
                <BurnDownChart projects={projects} tasks={allTasks} />
              </CardContent>
            </Card>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No projects yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => {
              const tasks = allTasks.filter((t) => t.project_id === project.id);
              const risk = assessRisk(tasks);
              const completedCount = tasks.filter((t) => t.status === "Done").length;

              return (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-border"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <CardContent className="flex items-center justify-between py-4 px-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h2 className="font-medium text-foreground truncate">{project.name}</h2>
                        <Select
                          value={project.fiscal_quarter || ""}
                          onValueChange={async (v) => {
                            await updateProject(project.id, { fiscal_quarter: v });
                            refresh();
                          }}
                        >
                          <SelectTrigger
                            className="w-32 h-6 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue placeholder="Set quarter" />
                          </SelectTrigger>
                          <SelectContent onClick={(e) => e.stopPropagation()}>
                            {getAdjacentQuarters(4).map((q) => (
                              <SelectItem key={q.label} value={q.label}>{q.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-4">
                        <RiskBadge level={risk.level} reasons={risk.reasons} />
                        <span className="text-xs text-muted-foreground">
                          {completedCount}/{tasks.length} tasks done
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => handleDelete(project.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Input
              placeholder="Project name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
