import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Project, Task } from "@/lib/types";
import { getProjects, createProject, deleteProject, getTasks, seedData } from "@/lib/store";
import { assessRisk } from "@/lib/risk";
import { getFiscalQuarterLabel } from "@/lib/fiscal";
import { RiskBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FolderOpen, Trash2, LayoutDashboard } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const refresh = useCallback(() => {
    setProjects(getProjects());
    setAllTasks(getTasks());
  }, []);

  useEffect(() => {
    seedData();
    refresh();
  }, [refresh]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createProject(newName.trim());
    setNewName("");
    setShowCreate(false);
    refresh();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this project and all its tasks?")) {
      deleteProject(id);
      refresh();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Content */}
      <main className="container max-w-5xl mx-auto px-4 py-8">
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
                        <span className="text-xs text-muted-foreground shrink-0">
                          {getFiscalQuarterLabel(new Date())}
                        </span>
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

      {/* Create dialog */}
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
