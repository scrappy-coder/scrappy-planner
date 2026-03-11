import { supabase } from "@/integrations/supabase/client";
import { Project, Task, TaskStatus } from "./types";

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createProject(name: string): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, updates: Partial<Omit<Project, "id" | "created_at">>) {
  const { error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProject(id: string) {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("start_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapTask);
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("start_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapTask);
}

export async function createTask(task: Omit<Task, "id">): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: task.project_id,
      name: task.name,
      start_date: task.start_date,
      end_date: task.end_date,
      status: task.status,
      detail: task.detail,
      parent_id: task.parent_id ?? null,
      effort: task.effort ?? "m",
      fiscal_quarter: task.fiscal_quarter ?? "",
    })
    .select()
    .single();
  if (error) throw error;
  return mapTask(data);
}

export async function updateTask(id: string, updates: Partial<Omit<Task, "id" | "project_id">>) {
  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    project_id: row.project_id as string,
    name: row.name as string,
    start_date: row.start_date as string,
    end_date: row.end_date as string,
    status: row.status as TaskStatus,
    detail: (row.detail as string) ?? "",
    parent_id: (row.parent_id as string) ?? null,
    effort: ((row.effort as string) ?? "m") as import("./types").EffortSize,
    fiscal_quarter: (row.fiscal_quarter as string) ?? "",
  };
}

export async function seedData() {
  // No-op: seed data removed
}
