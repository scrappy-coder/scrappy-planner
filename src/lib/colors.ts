// Deterministic project color palette for consistent colors across charts

const PROJECT_COLORS = [
  "hsl(210, 70%, 50%)",  // blue
  "hsl(340, 65%, 50%)",  // rose
  "hsl(160, 60%, 42%)",  // teal
  "hsl(30, 80%, 50%)",   // orange
  "hsl(270, 55%, 55%)",  // purple
  "hsl(50, 75%, 45%)",   // gold
  "hsl(190, 65%, 45%)",  // cyan
  "hsl(10, 70%, 50%)",   // red-orange
  "hsl(130, 50%, 42%)",  // green
  "hsl(300, 45%, 50%)",  // magenta
];

export function getProjectColor(projectId: string, projectIds: string[]): string {
  const index = projectIds.indexOf(projectId);
  return PROJECT_COLORS[index % PROJECT_COLORS.length];
}
