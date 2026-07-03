// app/api/projects/route.ts

import { NextResponse } from "next/server";
import { getSheetsClient, listSheetTitles, SHEET_ID as DEFAULT_SHEET_ID } from "@/lib/db";
import { ProjectItem } from "@/types/project";

type SheetRow = (string | number | boolean | null | undefined)[];

const COLUMNS_MAP_DEFAULT = [
    "taskId", "detailTask", "priority", "mandayEst", "status",
    "startDateEst", "assigned", "support", "kpiRatio", "skillSolution",
    "skillVendor", "ticketId", "remark", "send", "endDateEst",
    "mandayActual", "endDateActual", "daysLate", "kpiBase", "kpiPerform",
    "kpiOvertime", "kpiFinal", "subId", "rootTasks", "notes",
    "solutions"
];

const COLUMNS_MAP_MASTER = [
    "taskId", "detailTask", "priority", "mandayEst", "status",
    "startDateEst", "assigned", "support", "kpiRatio", "skillSolution",
    "skillVendor", "ticketId", "remark", "send", "endDateEst",
    "mandayActual", "endDateActual", "daysLate", "kpiBase", "kpiPerform",
    "kpiOvertime", "kpiFinal", "subId", "rootTasks", "notes",
    "weekEst", "monthEst", "weekActual", "monthActual"
];

const normalizeStatus = (status: string = "") =>
    status.trim().toLowerCase();

const parseDate = (dateStr: string) => {
    if (!dateStr) return null;

    const date = new Date(dateStr);

    if (isNaN(date.getTime())) return null;

    date.setHours(0, 0, 0, 0);

    return date;
};

const isRealTask = (task: ProjectItem) => {
    if (task.isHeader) return false;

    const detail = task.detailTask?.trim() ?? "";

    if (!detail) return false;

    if (detail.includes("[Action Verb]")) return false;

    if (detail.startsWith("Example")) return false;

    return true;
};

const getTaskIdStart = (tab: string): number => {
    switch (tab) {
        case "1.Sale/Admin":
            return 1;
        case "2.Init":
            return 200;
        case "2.1.Lab/PoC":
        case "2.1.Lab/LoC":
        case "2.1.LaB/LoC":
            return 300;
        case "3.Implement":
            return 400;
        case "4.MA":
            return 500;
        default:
            return 1;
    }
};

const parseProjectsFromSheet = (rows: SheetRow[], tab: string): ProjectItem[] => {
    const columnsMap = (tab === 'Master' || tab === '__masterplan__') ? COLUMNS_MAP_MASTER : COLUMNS_MAP_DEFAULT;
    let taskCounter = getTaskIdStart(tab);
    let currentRootTask = ""; // Biến để lưu task lớn hiện tại
    const parsedRows: ProjectItem[] = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        if (!row || row.length === 0 || !row.some(cell => cell && cell.toString().trim() !== '')) continue;
        const col0 = (row[0] || "").toString().trim();
        const col1 = (row[1] || "").toString().trim();
        if (col0.toUpperCase() === "TASK ID" || col1.toUpperCase() === "DETAIL TASK") continue;
        const isSectionHeader = col0 && !col1 && (col0.startsWith("PHASE") || col0.match(/^[IVX]+\./) || col0.match(/^Issue/));
        if (!isSectionHeader && col1 === "") continue;

        let headerType: 'phase' | 'majorTask' | 'issue' | null = null;
        if (col0.toUpperCase().startsWith("PHASE")) {
            headerType = 'phase';
        } else if (col0.match(/^[IVX]+\.\s/i)) { // Regex: Bắt đầu bằng số La Mã, theo sau là dấu chấm và khoảng trắng
            headerType = 'majorTask';
        } else if (col0.toLowerCase().includes('issue') || col0.toLowerCase().includes('change request')) {
            headerType = 'issue';
        }

        const isSectionHeaderRow = headerType !== null;
        const taskObj: Partial<ProjectItem> = {
            isHeader: isSectionHeaderRow,
            headerType: headerType,
            originalIndex: i
        };

        if (isSectionHeaderRow) {
            if (headerType === 'majorTask') {
                currentRootTask = col0;
            }
            columnsMap.forEach((key, index) => {
                if (index < 8) {
                    (taskObj as Record<string, any>)[key] = (row[index] || "").toString().trim();
                } else {
                    (taskObj as Record<string, any>)[key] = "";
                }
            });
            taskObj.taskId = col0;
            taskObj.detailTask = col1;
        } else {
            let currentTaskId = "";
            if (tab === 'Master' || tab === '__masterplan__') {
                currentTaskId = col0;
            } else {
                currentTaskId = taskCounter.toString();
                taskCounter++;
            }
            
            columnsMap.forEach((key, index) => {
                (taskObj as Record<string, any>)[key] = (row[index] || "").toString().trim();
            });
            
            // Đối với tab Master, ID thực sự của các task nằm ở cột subId, do col0 chỉ là số thứ tự 1, 2, 3
            if (tab === 'Master' && taskObj.subId) {
                taskObj.taskId = taskObj.subId;
            } else {
                taskObj.taskId = currentTaskId || col0;
            }

            if (!taskObj.rootTasks) {
                taskObj.rootTasks = currentRootTask;
            }
        }

        parsedRows.push(taskObj as ProjectItem);
    }
    return parsedRows;
};

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const tab = searchParams.get("tab") || "1.Sale/Admin";
        const sheetId = process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;
        const sheets = await getSheetsClient();

        // --- MASTER PLAN LOGIC ---
        if (tab === '__masterplan__') {
            const allSheetTitles = await listSheetTitles(sheetId);
            const projectSheetTitles = allSheetTitles.filter(title => title.match(/^\d/) && !title.toLowerCase().includes('view'));

            const ranges = projectSheetTitles.map(title => `${title}!A1:AC100`);
            const response = await sheets.spreadsheets.values.batchGet({
                spreadsheetId: sheetId,
                ranges,
            });

            const valueRanges = response.data.valueRanges || [];
            const allTasks: ProjectItem[] = [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const phases = valueRanges.map((rangeData, index) => {
                const phaseName = projectSheetTitles[index];
                const rows = rangeData.values || [];
                const phaseTasks = parseProjectsFromSheet(rows, phaseName).filter(isRealTask);
                allTasks.push(...phaseTasks);

                const doneCount = phaseTasks.filter(
                    t => normalizeStatus(t.status) === "done"
                ).length;

                const overdueCount = phaseTasks.filter(task => {
                    if (normalizeStatus(task.status) === "done") return false;

                    const endDate = parseDate(task.endDateEst);

                    if (!endDate) return false;

                    return endDate < today;
                }).length;

                const manday = phaseTasks.reduce((acc, p) => acc + (parseFloat(p.mandayEst) || 0), 0);

                return {
                    name: phaseName,
                    taskCount: phaseTasks.length,
                    doneCount,
                    overdueCount,
                    manday,
                    progress: phaseTasks.length > 0 ? Math.round((doneCount / phaseTasks.length) * 100) : 0,
                };
            });

            const totalTasks = allTasks.length;
            const totalDone = allTasks.filter(t => normalizeStatus(t.status) === "done").length;
            
            const globalToday = new Date();
            globalToday.setHours(0, 0, 0, 0);
            const totalOverdue = allTasks.filter(task => {
                if (!isRealTask(task)) return false;
                if (normalizeStatus(task.status) === "done") return false;
                const endDate = parseDate(task.endDateEst);
                if (!endDate) return false;
                return endDate < globalToday;
            }).length;

            const totalMandays = allTasks.reduce((acc, p) => acc + (parseFloat(p.mandayEst) || 0), 0);

            const masterData = {
                overallKpis: {
                    overallProgress: totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0,
                    totalTasks,
                    totalMandays,
                    overdue: totalOverdue,
                },
                phases,
                tasks: allTasks,
            };

            return NextResponse.json({ success: true, data: masterData });
        }

        // --- SINGLE TAB LOGIC (EXISTING) ---
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: `${tab}!A1:AC100`, // Mở rộng range để lấy đủ 29 cột (A -> AC)
        });

        const rows = response.data.values || [];
        const formattedProjects = parseProjectsFromSheet(rows, tab);

        // Lấy danh sách duy nhất cho Assigned (cột G, index 6) và Support (cột H, index 7)
        const assignees = [...new Set(rows.slice(1).map(row => row[6]).filter(Boolean))];
        const supporters = [...new Set(rows.slice(1).map(row => row[7]).filter(Boolean))];

        return NextResponse.json({
            success: true,
            tab,
            data: formattedProjects,
            meta: {
                assignees,
                supporters,
            }
        });
    } catch (error) {
        console.error("Google Sheets Error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch sheet",
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error",
            },
            {
                status: 500,
            }
        );
    }
}

