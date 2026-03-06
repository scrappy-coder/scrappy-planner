import { Project, Task } from "./types";

const PROJECTS_KEY = "qp_projects";
const TASKS_KEY = "qp_tasks";

function generateId(): string {
  return crypto.randomUUID();
}

export function getProjects(): Project[] {
  const raw = localStorage.getItem(PROJECTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveProjects(projects: Project[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function createProject(name: string): Project {
  const projects = getProjects();
  const project: Project = { id: generateId(), name, created_at: new Date().toISOString() };
  projects.push(project);
  saveProjects(projects);
  return project;
}

export function updateProject(id: string, name: string) {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx >= 0) {
    projects[idx].name = name;
    saveProjects(projects);
  }
}

export function deleteProject(id: string) {
  saveProjects(getProjects().filter((p) => p.id !== id));
  saveTasks(getTasks().filter((t) => t.project_id !== id));
}

export function getTasks(): Task[] {
  const raw = localStorage.getItem(TASKS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getTasksByProject(projectId: string): Task[] {
  return getTasks().filter((t) => t.project_id === projectId);
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function createTask(task: Omit<Task, "id">): Task {
  const tasks = getTasks();
  const newTask: Task = { ...task, id: generateId() };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

export function updateTask(id: string, updates: Partial<Omit<Task, "id" | "project_id">>) {
  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx >= 0) {
    tasks[idx] = { ...tasks[idx], ...updates };
    saveTasks(tasks);
  }
}

export function deleteTask(id: string) {
  saveTasks(getTasks().filter((t) => t.id !== id));
}

export function seedData() {
  if (getProjects().length > 0) return;

  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();

  const p1: Project = { id: generateId(), name: "Website Redesign", created_at: new Date(y, m - 1, 1).toISOString() };
  const p2: Project = { id: generateId(), name: "Mobile App Launch", created_at: new Date(y, m, 1).toISOString() };
  const p3: Project = { id: generateId(), name: "Q1 Marketing Campaign", created_at: new Date(y, m - 2, 15).toISOString() };

  saveProjects([p1, p2, p3]);

  const tasks: Task[] = [
    // Website Redesign - mix of statuses
    { id: generateId(), project_id: p1.id, name: "Design mockups", start_date: fmt(y, m - 1, 5), end_date: fmt(y, m - 1, 20), status: "Done", detail: "Create wireframes and high-fidelity mockups" },
    { id: generateId(), project_id: p1.id, name: "Frontend development", start_date: fmt(y, m - 1, 21), end_date: fmt(y, m, 15), status: "In Progress", detail: "Build React components and pages" },
    { id: generateId(), project_id: p1.id, name: "Backend API updates", start_date: fmt(y, m, 1), end_date: fmt(y, m, 20), status: "Not Started", detail: "Update REST endpoints for new design" },
    { id: generateId(), project_id: p1.id, name: "QA testing", start_date: fmt(y, m, 16), end_date: fmt(y, m + 1, 5), status: "Not Started", detail: "End-to-end testing and bug fixes" },
    { id: generateId(), project_id: p1.id, name: "Content migration", start_date: fmt(y, m - 1, 25), end_date: fmt(y, m, -5), status: "In Progress", detail: "Migrate blog posts and pages to new CMS" },

    // Mobile App - has overdue and blocked tasks (at risk)
    { id: generateId(), project_id: p2.id, name: "UI/UX design", start_date: fmt(y, m - 1, 1), end_date: fmt(y, m, -10), status: "Done", detail: "Design all app screens" },
    { id: generateId(), project_id: p2.id, name: "Core feature development", start_date: fmt(y, m - 1, 15), end_date: fmt(y, m, -3), status: "In Progress", detail: "Build authentication, feed, and profile" },
    { id: generateId(), project_id: p2.id, name: "Push notifications", start_date: fmt(y, m, 1), end_date: fmt(y, m, 10), status: "Blocked", detail: "Waiting on Firebase configuration from DevOps" },
    { id: generateId(), project_id: p2.id, name: "App store submission", start_date: fmt(y, m, 15), end_date: fmt(y, m + 1, 1), status: "Not Started", detail: "Prepare screenshots, descriptions, and submit" },

    // Marketing Campaign - mostly on track
    { id: generateId(), project_id: p3.id, name: "Campaign strategy", start_date: fmt(y, m - 2, 15), end_date: fmt(y, m - 2, 28), status: "Done", detail: "Define target audience and channels" },
    { id: generateId(), project_id: p3.id, name: "Creative assets", start_date: fmt(y, m - 1, 1), end_date: fmt(y, m - 1, 15), status: "Done", detail: "Design banners, social posts, and email templates" },
    { id: generateId(), project_id: p3.id, name: "Campaign launch", start_date: fmt(y, m, 1), end_date: fmt(y, m, 5), status: "In Progress", detail: "Deploy ads and send email blasts" },
    { id: generateId(), project_id: p3.id, name: "Performance tracking", start_date: fmt(y, m, 5), end_date: fmt(y, m + 1, 1), status: "Not Started", detail: "Monitor KPIs and adjust spend" },
  ];

  saveTasks(tasks);
}

function fmt(y: number, m: number, d: number): string {
  const date = new Date(y, m, d);
  return date.toISOString().split("T")[0];
}
