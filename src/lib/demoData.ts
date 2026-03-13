// Sample demo projects and tasks shown to first-time visitors when the database is empty.
import { Project, Task } from "./types";

const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const offset = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return fmt(d);
};

const DEMO_PROJECT_1_ID = "demo-proj-1";
const DEMO_PROJECT_2_ID = "demo-proj-2";

export const DEMO_PROJECTS: Project[] = [
  { id: DEMO_PROJECT_1_ID, name: "Website Redesign", created_at: offset(-30), fiscal_quarter: "" },
  { id: DEMO_PROJECT_2_ID, name: "Mobile App Launch", created_at: offset(-20), fiscal_quarter: "" },
];

export const DEMO_TASKS: Task[] = [
  // Website Redesign tasks
  { id: "demo-t1", project_id: DEMO_PROJECT_1_ID, name: "Design mockups", start_date: offset(-14), end_date: offset(-2), status: "Done", detail: "Create high-fidelity mockups for all pages", parent_id: null, effort: "l", fiscal_quarter: "" },
  { id: "demo-t2", project_id: DEMO_PROJECT_1_ID, name: "Build component library", start_date: offset(-7), end_date: offset(5), status: "In Progress", detail: "Implement reusable UI components", parent_id: null, effort: "xl", fiscal_quarter: "" },
  { id: "demo-t3", project_id: DEMO_PROJECT_1_ID, name: "Content migration", start_date: offset(2), end_date: offset(14), status: "Not Started", detail: "Migrate existing content to new CMS", parent_id: null, effort: "m", fiscal_quarter: "" },
  { id: "demo-t4", project_id: DEMO_PROJECT_1_ID, name: "SEO audit", start_date: offset(-10), end_date: offset(-1), status: "In Review", detail: "Review and optimize meta tags and structure", parent_id: null, effort: "s", fiscal_quarter: "" },
  { id: "demo-t5", project_id: DEMO_PROJECT_1_ID, name: "Launch prep", start_date: offset(10), end_date: offset(20), status: "Not Started", detail: "Final QA and go-live checklist", parent_id: null, effort: "m", fiscal_quarter: "" },

  // Mobile App Launch tasks
  { id: "demo-t6", project_id: DEMO_PROJECT_2_ID, name: "API integration", start_date: offset(-5), end_date: offset(7), status: "In Progress", detail: "Connect mobile app to backend APIs", parent_id: null, effort: "xl", fiscal_quarter: "" },
  { id: "demo-t7", project_id: DEMO_PROJECT_2_ID, name: "Push notifications", start_date: offset(0), end_date: offset(10), status: "Not Started", detail: "Implement push notification service", parent_id: null, effort: "l", fiscal_quarter: "" },
  { id: "demo-t8", project_id: DEMO_PROJECT_2_ID, name: "App store listing", start_date: offset(8), end_date: offset(18), status: "Not Started", detail: "Prepare screenshots and descriptions", parent_id: null, effort: "s", fiscal_quarter: "" },
  { id: "demo-t9", project_id: DEMO_PROJECT_2_ID, name: "Beta testing", start_date: offset(-12), end_date: offset(-3), status: "Done", detail: "Internal beta with 50 users", parent_id: null, effort: "m", fiscal_quarter: "" },
  { id: "demo-t10", project_id: DEMO_PROJECT_2_ID, name: "Performance optimization", start_date: offset(-8), end_date: offset(-1), status: "In Progress", detail: "Reduce load times and memory usage", parent_id: null, effort: "l", fiscal_quarter: "" },
];
