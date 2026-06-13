export interface SheetRow {
  processedAt: string;
  date: string;
  point: string;
  type: string;
  source: string;
  shift: string;
  object: string;
  categories: string[];
  violations: string[];
  misdemeanors: string[];
  name: string;
  position: string;
  department: string;
  processor: string;
  meta3p: string;
  link: string;
  refund: number;
  statusOS: string;
  resolution: string;
}

export interface EmployeeStats {
  name: string;
  position: string;
  count: number;
  refund: number;
  byPoint: Record<string, number>;
  byCategory: Record<string, number>;
  violations: Record<string, number>;
  misdemeanors: Record<string, number>;
  meta3p: Record<string, number>;
}

export interface PointStats {
  name: string;
  count: number;
  refund: number;
  byCategory: Record<string, number>;
  violations: Record<string, number>;
  misdemeanors: Record<string, number>;
  cleanCount: number;
}

export interface ProcessorStats {
  name: string;
  department: string;
  count: number;
}

export type Tab = 'overview' | 'staff' | 'points' | 'departments';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}