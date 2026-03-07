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

export async function updateProject(id: string, name: string) {
  const { error } = await supabase
    .from("projects")
    .update({ name })
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

function mapTask(row: { id: string; project_id: string; name: string; start_date: string; end_date: string; status: string; detail: string; parent_id?: string | null }): Task {
  return {
    id: row.id,
    project_id: row.project_id,
    name: row.name,
    start_date: row.start_date,
    end_date: row.end_date,
    status: row.status as TaskStatus,
    detail: row.detail,
    parent_id: row.parent_id ?? null,
  };
}

export async function seedData() {
  const { data: existing } = await supabase.from("projects").select("id").limit(1);
  if (existing && existing.length > 0) return;

  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();

  const { data: p1 } = await supabase.from("projects").insert({ name: "Website Redesign" }).select().single();
  const { data: p2 } = await supabase.from("projects").insert({ name: "Mobile App Launch" }).select().single();
  const { data: p3 } = await supabase.from("projects").insert({ name: "Q1 Marketing Campaign" }).select().single();

  if (!p1 || !p2 || !p3) return;

  const fmt = (y: number, m: number, d: number) => {
    const date = new Date(y, m, d);
    return date.toISOString().split("T")[0];
  };

  await supabase.from("tasks").insert([
    { project_id: p1.id, name: "Design mockups", start_date: fmt(y, m - 1, 5), end_date: fmt(y, m - 1, 20), status: "Done", detail: "Create wireframes and high-fidelity mockups" },
    { project_id: p1.id, name: "Frontend development", start_date: fmt(y, m - 1, 21), end_date: fmt(y, m, 15), status: "In Progress", detail: "Build React components and pages" },
    { project_id: p1.id, name: "Backend API updates", start_date: fmt(y, m, 1), end_date: fmt(y, m, 20), status: "Not Started", detail: "Update REST endpoints for new design" },
    { project_id: p1.id, name: "QA testing", start_date: fmt(y, m, 16), end_date: fmt(y, m + 1, 5), status: "Not Started", detail: "End-to-end testing and bug fixes" },
    { project_id: p1.id, name: "Content migration", start_date: fmt(y, m - 1, 25), end_date: fmt(y, m, -5), status: "In Progress", detail: "Migrate blog posts and pages to new CMS" },

    { project_id: p2.id, name: "UI/UX design", start_date: fmt(y, m - 1, 1), end_date: fmt(y, m, -10), status: "Done", detail: "Design all app screens" },
    { project_id: p2.id, name: "Core feature development", start_date: fmt(y, m - 1, 15), end_date: fmt(y, m, -3), status: "In Progress", detail: "Build authentication, feed, and profile" },
    { project_id: p2.id, name: "Push notifications", start_date: fmt(y, m, 1), end_date: fmt(y, m, 10), status: "Blocked", detail: "Waiting on Firebase configuration from DevOps" },
    { project_id: p2.id, name: "App store submission", start_date: fmt(y, m, 15), end_date: fmt(y, m + 1, 1), status: "Not Started", detail: "Prepare screenshots, descriptions, and submit" },

    { project_id: p3.id, name: "Campaign strategy", start_date: fmt(y, m - 2, 15), end_date: fmt(y, m - 2, 28), status: "Done", detail: "Define target audience and channels" },
    { project_id: p3.id, name: "Creative assets", start_date: fmt(y, m - 1, 1), end_date: fmt(y, m - 1, 15), status: "Done", detail: "Design banners, social posts, and email templates" },
    { project_id: p3.id, name: "Campaign launch", start_date: fmt(y, m, 1), end_date: fmt(y, m, 5), status: "In Progress", detail: "Deploy ads and send email blasts" },
    { project_id: p3.id, name: "Performance tracking", start_date: fmt(y, m, 5), end_date: fmt(y, m + 1, 1), status: "Not Started", detail: "Monitor KPIs and adjust spend" },
  ]);
}
