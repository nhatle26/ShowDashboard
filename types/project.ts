export interface ProjectItem {
  taskId: string;
  detailTask: string;
  priority: string;
  mandayEst: string;
  status: string;
  startDateEst: string;
  assigned: string;
  support: string;
  kpiRatio: string;
  skillSolution: string;
  skillVendor: string;
  ticketId: string;
  remark: string;
  send: string;
  endDateEst: string;
  mandayActual: string;
  endDateActual: string;
  daysLate: string;
  kpiBase: string;
  kpiPerform: string;
  kpiOvertime: string;
  kpiFinal: string;
  subId: string;
  rootTasks: string;
  notes: string;
  isHeader?: boolean;
  solutions?: string;
  weekEst?: string;
  monthEst?: string;
  weekActual?: string;
  monthActual?: string;
  originalIndex: number; // Index gốc trong Google Sheet để gửi về API
  headerType?: 'phase' | 'majorTask' | 'issue' | null;
}
