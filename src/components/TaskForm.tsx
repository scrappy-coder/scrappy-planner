import { useState } from "react";
import { Task, TaskStatus } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: { name: string; start_date: string; end_date: string; status: TaskStatus; detail: string; parent_id?: string | null }) => void;
  initialData?: Task;
  parentTask?: Task;
}

export function TaskForm({ open, onClose, onSave, initialData, parentTask }: TaskFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [startDate, setStartDate] = useState(initialData?.start_date ?? parentTask?.start_date ?? "");
  const [endDate, setEndDate] = useState(initialData?.end_date ?? parentTask?.end_date ?? "");
  const [status, setStatus] = useState<TaskStatus>(initialData?.status ?? "Not Started");
  const [detail, setDetail] = useState(initialData?.detail ?? "");
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!name.trim()) { setError("Task name is required"); return; }
    if (!startDate) { setError("Start date is required"); return; }
    if (!endDate) { setError("End date is required"); return; }
    if (new Date(endDate) < new Date(startDate)) { setError("End date must be after start date"); return; }
    onSave({
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      status,
      detail: detail.trim(),
      parent_id: parentTask?.id ?? initialData?.parent_id ?? null,
    });
    onClose();
  };

  const title = parentTask
    ? `Add Subtask to "${parentTask.name}"`
    : initialData
      ? "Edit Task"
      : "Add Task";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-1.5">
            <Label>Task Name</Label>
            <Input value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="e.g., Design mockups" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setError(""); }} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setError(""); }} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
                <SelectItem value="Blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Optional details..." rows={3} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>{initialData ? "Update" : "Add Task"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
