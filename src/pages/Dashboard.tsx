import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Project, Task, EFFORT_VALUES, EFFORT_SIZES } from "@/lib/types";
import { getProjects, createProject, deleteProject, getTasks, seedData, updateProject } from "@/lib/store";
import { assessRisk, getProjectSummary } from "@/lib/risk";
import { getAdjacentQuarters } from "@/lib/fiscal";
import { parseLocalDate } from "@/lib/utils";
import { RiskBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FolderOpen, Trash2, LayoutDashboard, Loader2, CalendarDays, CheckCircle2, AlertTriangle, Clock, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProjectGantt } from "@/components/ProjectGantt";
import { CompletionChart } from "@/components/CompletionChart";
import { BurnDownChart } from "@/components/BurnDownChart";

function SummaryTiles({ projects, tasks }: { projects: Project[]; tasks: Task[] }) {
  const summary = getProjectSummary(tasks);

  const nextDueFormatted = summary.nextDueDate
    ? (() => { const [y,m,d] = summary.nextDueDate!.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); })()
    : "—";

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" /> Effort Legend
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-3" align="end">
            <p className="text-xs font-semibold text-foreground mb-2">T-Shirt Sizing</p>
            <div className="space-y-1">
              {EFFORT_SIZES.map((s) => (
                <div key={s} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground uppercase">{s}</span>
                  <span className="text-muted-foreground">{EFFORT_VALUES[s]} point{EFFORT_VALUES[s] > 1 ? "s" : ""}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="py-4 px-5">
            <div className="flex items-center gap-2 mb-1"><CalendarDays className="h-4 w-4 text-primary" /><p className="text-xs text-muted-foreground">Total Tasks</p></div>
            <p className="text-2xl font-bold text-foreground">{summary.totalTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-5">
            <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="h-4 w-4 text-status-done" /><p className="text-xs text-muted-foreground">Completed</p></div>
            <p className="text-2xl font-bold text-foreground">{summary.completedTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-5">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4 text-status-at-risk" /><p className="text-xs text-muted-foreground">Overdue</p></div>
            <p className={`text-2xl font-bold ${summary.overdueTasks > 0 ? "text-destructive" : "text-foreground"}`}>{summary.overdueTasks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-5">
            <div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-orange-500" /><p className="text-xs text-muted-foreground">Behind Schedule</p></div>
            <p className={`text-2xl font-bold ${summary.behindSchedule > 0 ? "text-orange-500" : "text-foreground"}`}>{summary.behindSchedule}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-5">
            <div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-muted-foreground" /><p className="text-xs text-muted-foreground">Next Due</p></div>
            <p className="text-2xl font-bold text-foreground">{nextDueFormatted}</p>
          </CardContent>
        </Card>
      </div>
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
            <div className="grid gap-6 lg:grid-cols-2">
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
