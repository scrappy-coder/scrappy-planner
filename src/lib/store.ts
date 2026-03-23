import { supabase } from "@/integrations/supabase/client";
import { Project, Task, TaskStatus, EffortSize } from "./types";

const CLOUD_EMAIL = "hpljh914@gmail.com";

async function getUserEmail(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.email ?? "";
}

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

async function isCloudUser(): Promise<boolean> {
  const email = await getUserEmail();
  return email === CLOUD_EMAIL;
}

// ── localStorage helpers ──

function localGet<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function localSet<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Projects ──

export async function getProjects(): Promise<Project[]> {
  if (await isCloudUser()) {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return localGet<Project>("local_projects");
}

export async function createProject(name: string): Promise<Project> {
  if (await isCloudUser()) {
    const user_id = await getUserId();
    const { data, error } = await supabase.from("projects").insert({ name, user_id }).select().single();
    if (error) throw error;
    return data;
  }
  const projects = localGet<Project>("local_projects");
  const newProject: Project = { id: crypto.randomUUID(), name, created_at: new Date().toISOString(), fiscal_quarter: "" };
  projects.push(newProject);
  localSet("local_projects", projects);
  return newProject;
}

export async function updateProject(id: string, updates: Partial<Omit<Project, "id" | "created_at">>) {
  if (await isCloudUser()) {
    const { error } = await supabase.from("projects").update(updates).eq("id", id);
    if (error) throw error;
    return;
  }
  const projects = localGet<Project>("local_projects").map((p) => (p.id === id ? { ...p, ...updates } : p));
  localSet("local_projects", projects);
}

export async function deleteProject(id: string) {
  if (await isCloudUser()) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  localSet("local_projects", localGet<Project>("local_projects").filter((p) => p.id !== id));
  localSet("local_tasks", localGet<Task>("local_tasks").filter((t) => t.project_id !== id));
}

// ── Tasks ──

export async function getTasks(): Promise<Task[]> {
  if (await isCloudUser()) {
    const { data, error } = await supabase.from("tasks").select("*").order("start_date", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapTask);
  }
  return localGet<Task>("local_tasks");
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  if (await isCloudUser()) {
    const { data, error } = await supabase.from("tasks").select("*").eq("project_id", projectId).order("start_date", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapTask);
  }
  return localGet<Task>("local_tasks").filter((t) => t.project_id === projectId);
}

export async function createTask(task: Omit<Task, "id">): Promise<Task> {
  if (await isCloudUser()) {
    const user_id = await getUserId();
    const { data, error } = await supabase.from("tasks").insert({
      project_id: task.project_id, name: task.name, start_date: task.start_date,
      end_date: task.end_date, status: task.status, detail: task.detail,
      parent_id: task.parent_id ?? null, effort: task.effort ?? "m",
      fiscal_quarter: task.fiscal_quarter ?? "", user_id,
    }).select().single();
    if (error) throw error;
    return mapTask(data);
  }
  const newTask: Task = { id: crypto.randomUUID(), ...task, detail: task.detail ?? "", parent_id: task.parent_id ?? null, effort: task.effort ?? "m", fiscal_quarter: task.fiscal_quarter ?? "" };
  const tasks = localGet<Task>("local_tasks");
  tasks.push(newTask);
  localSet("local_tasks", tasks);
  return newTask;
}

export async function updateTask(id: string, updates: Partial<Omit<Task, "id" | "project_id">>) {
  if (await isCloudUser()) {
    const { error } = await supabase.from("tasks").update(updates).eq("id", id);
    if (error) throw error;
    return;
  }
  const tasks = localGet<Task>("local_tasks").map((t) => (t.id === id ? { ...t, ...updates } : t));
  localSet("local_tasks", tasks);
}

export async function deleteTask(id: string) {
  if (await isCloudUser()) {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  localSet("local_tasks", localGet<Task>("local_tasks").filter((t) => t.id !== id));
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
    effort: ((row.effort as string) ?? "m") as EffortSize,
    fiscal_quarter: (row.fiscal_quarter as string) ?? "",
  };
}

export async function seedData() {
  // No-op
}

// ── Notes (for MemoPad) ──

export async function isCloudUserCheck(): Promise<boolean> {
  return isCloudUser();
}
