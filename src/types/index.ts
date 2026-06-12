export interface SheetRow {
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
  meta3p: string;
  link: string;
  refund: number;
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

export type Tab = 'overview' | 'staff' | 'points';
