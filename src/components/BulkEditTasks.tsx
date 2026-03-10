import { useState, useCallback } from "react";
import { Task, TaskStatus, EffortSize, EFFORT_SIZES } from "@/lib/types";
import { getAdjacentQuarters } from "@/lib/fiscal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save, X, Loader2, CornerDownRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Done", "Blocked"];
const QUARTERS = getAdjacentQuarters(4);

interface BulkEditTasksProps {
  tasks: Task[];
  onSave: (updates: Array<{ id: string; changes: Partial<Omit<Task, "id" | "project_id">> }>, deletedIds: string[]) => Promise<void>;
  onCancel: () => void;
}

export function BulkEditTasks({ tasks, onSave, onCancel }: BulkEditTasksProps) {
  const [editedTasks, setEditedTasks] = useState<Task[]>(() => tasks.map((t) => ({ ...t })));
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const visibleTasks = editedTasks.filter((t) => !deletedIds.includes(t.id));
  const parentTasks = visibleTasks.filter((t) => !t.parent_id);

  const updateField = useCallback((id: string, field: keyof Task, value: string) => {
    setEditedTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  }, []);

  const handleDelete = (id: string) => {
    setDeletedIds((prev) => [...prev, id]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const original = new Map(tasks.map((t) => [t.id, t]));
      const updates: Array<{ id: string; changes: Partial<Omit<Task, "id" | "project_id">> }> = [];

      for (const task of editedTasks) {
        if (deletedIds.includes(task.id)) continue;
        const orig = original.get(task.id);
        if (!orig) continue;

        const changes: Partial<Omit<Task, "id" | "project_id">> = {};
        if (task.name !== orig.name) changes.name = task.name;
        if (task.start_date !== orig.start_date) changes.start_date = task.start_date;
        if (task.end_date !== orig.end_date) changes.end_date = task.end_date;
        if (task.status !== orig.status) changes.status = task.status;
        if (task.detail !== orig.detail) changes.detail = task.detail;
        if (task.effort !== orig.effort) changes.effort = task.effort;
        if (task.fiscal_quarter !== orig.fiscal_quarter) changes.fiscal_quarter = task.fiscal_quarter;

        if (Object.keys(changes).length > 0) {
          updates.push({ id: task.id, changes });
        }
      }

      await onSave(updates, deletedIds);
    } finally {
      setSaving(false);
    }
  };

  const renderRow = (task: Task, isSubtask: boolean) => (
    <TableRow key={task.id} className={cn(isSubtask && "bg-muted/30")}>
      <TableCell className="py-1.5 px-2">
        <div className="flex items-center gap-1.5">
          {isSubtask && <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
          <Input
            value={task.name}
            onChange={(e) => updateField(task.id, "name", e.target.value)}
            className={cn("h-8 text-sm", isSubtask && "text-xs")}
          />
        </div>
      </TableCell>
      <TableCell className="py-1.5 px-2">
        <Input
          type="date"
          value={task.start_date}
          onChange={(e) => updateField(task.id, "start_date", e.target.value)}
          className="h-8 text-xs w-[130px]"
        />
      </TableCell>
      <TableCell className="py-1.5 px-2">
        <Input
          type="date"
          value={task.end_date}
          onChange={(e) => updateField(task.id, "end_date", e.target.value)}
          className="h-8 text-xs w-[130px]"
        />
      </TableCell>
      <TableCell className="py-1.5 px-2">
        <Select
          value={task.status}
          onValueChange={(v) => updateField(task.id, "status", v)}
        >
          <SelectTrigger className="h-8 text-xs w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="py-1.5 px-2">
        <Select
          value={task.effort}
          onValueChange={(v) => updateField(task.id, "effort", v)}
        >
          <SelectTrigger className="h-8 text-xs w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EFFORT_SIZES.map((s) => (
              <SelectItem key={s} value={s}>{s.toUpperCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="py-1.5 px-2">
        <Select
          value={task.fiscal_quarter || ""}
          onValueChange={(v) => updateField(task.id, "fiscal_quarter", v)}
        >
          <SelectTrigger className="h-8 text-xs w-[110px]">
            <SelectValue placeholder="Quarter" />
          </SelectTrigger>
          <SelectContent>
            {QUARTERS.map((q) => (
              <SelectItem key={q.label} value={q.label}>{q.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="py-1.5 px-2">
        <Input
          value={task.detail}
          onChange={(e) => updateField(task.id, "detail", e.target.value)}
          className="h-8 text-xs"
          placeholder="Details..."
        />
      </TableCell>
      <TableCell className="py-1.5 px-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => handleDelete(task.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Editing {visibleTasks.length} task{visibleTasks.length !== 1 ? "s" : ""}
          {deletedIds.length > 0 && (
            <span className="text-destructive ml-1">
              ({deletedIds.length} marked for deletion)
            </span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save All
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs py-2 px-2 min-w-[180px]">Name</TableHead>
              <TableHead className="text-xs py-2 px-2">Start</TableHead>
              <TableHead className="text-xs py-2 px-2">End</TableHead>
              <TableHead className="text-xs py-2 px-2">Status</TableHead>
              <TableHead className="text-xs py-2 px-2">Effort</TableHead>
              <TableHead className="text-xs py-2 px-2">Quarter</TableHead>
              <TableHead className="text-xs py-2 px-2 min-w-[150px]">Detail</TableHead>
              <TableHead className="text-xs py-2 px-2 w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parentTasks.map((task) => {
              const subtasks = visibleTasks.filter((t) => t.parent_id === task.id);
              return (
                <>{renderRow(task, false)}{subtasks.map((sub) => renderRow(sub, true))}</>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
