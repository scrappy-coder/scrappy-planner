import { FiscalQuarter } from "./types";

// Q1=Feb-Apr, Q2=May-Jul, Q3=Aug-Oct, Q4=Nov-Jan
export function getFiscalQuarter(date: Date): { quarter: number; fiscalYear: number } {
  const month = date.getMonth(); // 0-indexed
  const year = date.getFullYear();
  if (month >= 1 && month <= 3) return { quarter: 1, fiscalYear: year + 1 };
  if (month >= 4 && month <= 6) return { quarter: 2, fiscalYear: year + 1 };
  if (month >= 7 && month <= 9) return { quarter: 3, fiscalYear: year + 1 };
  // Nov(10), Dec(11) → next calendar year + 1 FY; Jan(0) → current year's Q4
  if (month >= 10) return { quarter: 4, fiscalYear: year + 1 };
  return { quarter: 4, fiscalYear: year }; // January
}

export function getFiscalQuarterRange(quarter: number, fiscalYear: number): FiscalQuarter {
  // Q1=Feb-Apr, Q2=May-Jul, Q3=Aug-Oct, Q4=Nov-Jan
  // FY27 Q1 = Feb 2026 – Apr 2026
  // FY27 Q4 = Nov 2026 – Jan 2027
  const quarterMonths: Record<number, [number, number]> = {
    1: [1, 3],   // Feb-Apr
    2: [4, 6],   // May-Jul
    3: [7, 9],   // Aug-Oct
    4: [10, 0],  // Nov-Jan
  };

  const [startMonth, endMonth] = quarterMonths[quarter];

  let startYear: number;
  let endYear: number;

  if (quarter === 4) {
    startYear = fiscalYear - 1; // Nov of previous calendar year
    endYear = fiscalYear;       // Jan of fiscal year
  } else {
    startYear = fiscalYear - 1; // Q1-Q3: calendar year = fiscalYear - 1
    endYear = fiscalYear - 1;
  }

  const start = new Date(startYear, startMonth, 1);
  const end = quarter === 4
    ? new Date(endYear, 1, 0) // Last day of January
    : new Date(endYear, endMonth + 1, 0); // Last day of end month

  return {
    label: `Q${quarter} FY${fiscalYear}`,
    start,
    end,
    year: fiscalYear,
    quarter,
  };
}

export function getCurrentFiscalQuarter(): FiscalQuarter {
  const now = new Date();
  const { quarter, fiscalYear } = getFiscalQuarter(now);
  return getFiscalQuarterRange(quarter, fiscalYear);
}

export function getAdjacentQuarters(count: number = 2): FiscalQuarter[] {
  const now = new Date();
  const { quarter, fiscalYear } = getFiscalQuarter(now);
  const quarters: FiscalQuarter[] = [];

  for (let i = -count; i <= count; i++) {
    let q = quarter + i;
    let fy = fiscalYear;
    while (q > 4) { q -= 4; fy += 1; }
    while (q < 1) { q += 4; fy -= 1; }
    quarters.push(getFiscalQuarterRange(q, fy));
  }

  return quarters;
}

export function getFiscalQuarterLabel(date: Date): string {
  const { quarter, fiscalYear } = getFiscalQuarter(date);
  return `Q${quarter} FY${fiscalYear}`;
}
