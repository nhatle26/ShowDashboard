// app/api/projects/route.ts

import { NextResponse } from "next/server";
import { getSheetsClient, listSheetTitles, SHEET_ID as DEFAULT_SHEET_ID } from "@/lib/db";
import { parse } from "path";

const parseProjectsFromSheet = (rows: any[][]) => {
    let taskCounter = 1;
    let currentRootTask = ""; // Biến để lưu task lớn hiện tại
    const parsedRows = rows.slice(1)
        .filter((row: any[]) => {
            if (row.length === 0 || !row.some(cell => cell && cell.toString().trim() !== '')) return false;
            const col0 = (row[0] || "").toString().trim();
            const col1 = (row[1] || "").toString().trim();
            if (col0.toUpperCase() === "TASK ID" || col1.toUpperCase() === "DETAIL TASK") return false;
            const isSectionHeader = col0 && !col1 && (col0.startsWith("PHASE") || col0.match(/^[IVX]+\./) || col0.match(/^Issue/));
            return isSectionHeader || col1 !== "";
        })
        .map((row: any[]) => {
            const col0 = (row[0] || "").toString().trim();
            const col1 = (row[1] || "").toString().trim();

            let headerType = null;
            // Thay đổi logic: chỉ cần cột A khớp là đủ để xác định header
            if (col0.toUpperCase().startsWith("PHASE")) {
                headerType = 'phase';
            } else if (col0.match(/^[IVX]+\.\s/i)) { // Regex: Bắt đầu bằng số La Mã, theo sau là dấu chấm và khoảng trắng
                headerType = 'majorTask';
            } else if (col0.toLowerCase().includes('issue') || col0.toLowerCase().includes('change request')) {
                headerType = 'issue';
            }

            const isSectionHeader = headerType !== null;

            if (isSectionHeader) {
                taskCounter = 1;
                // Chỉ cập nhật root task nếu là task lớn (số la mã)
                if (headerType === 'majorTask') {
                    currentRootTask = col0;
                }
                return {
                    taskId: col0, detailTask: col1, priority: row[2] || "", mandayEst: row[3] || "", status: row[4] || "", startDateEst: row[5] || "", assigned: row[6] || "", support: row[7] || "",
                    kpiRatio: "", skillSolution: "", skillVendor: "", ticketId: "", remark: "", send: "", endDateEst: "", mandayActual: "",
                    endDateActual: "", daysLate: "", kpiBase: "", kpiPerform: "", kpiOvertime: "", kpiFinal: "", subId: "", rootTasks: "",
                    notes: "", weekEst: "", monthEst: "", weekActual: "", monthActual: "",
                    isHeader: true,
                    headerType: headerType
                };
            }

            const currentTaskId = row[0] ? row[0] : taskCounter.toString();
            taskCounter++;

            return {
                taskId: currentTaskId, detailTask: row[1] || "", priority: row[2] || "", mandayEst: row[3] || "", status: row[4] || "",
                startDateEst: row[5] || "", assigned: row[6] || "", support: row[7] || "", kpiRatio: row[8] || "", skillSolution: row[9] || "",
                skillVendor: row[10] || "", ticketId: row[11] || "", remark: row[12] || "", send: row[13] || "", endDateEst: row[14] || "",
                mandayActual: row[15] || "", endDateActual: row[16] || "", daysLate: row[17] || "", kpiBase: row[18] || "",
                kpiPerform: row[19] || "", kpiOvertime: row[20] || "", kpiFinal: row[21] || "", subId: row[22] || "",
                rootTasks: row[23] || currentRootTask, // Gán task lớn hiện tại nếu cột rootTasks trống
                notes: row[24] || "",
                solutions: row[25] || "", // Cột này không còn
                isHeader: false
            };
        });
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
            const allTasks: any[] = [];

            const phases = valueRanges.map((rangeData, index) => {
                const phaseName = projectSheetTitles[index];
                const rows = rangeData.values || [];
                const phaseTasks = parseProjectsFromSheet(rows).filter(p => !p.isHeader);
                allTasks.push(...phaseTasks);

                const doneCount = phaseTasks.filter(t => t.status === 'Done').length;
                const overdueCount = phaseTasks.filter(p => {
                    if (p.status === 'Done' || !p.endDateEst) return false;
                    try { return new Date(p.endDateEst) < new Date(); } catch { return false; }
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
            const totalDone = allTasks.filter(t => t.status === 'Done').length;
            const totalOverdue = allTasks.filter(p => !p.isHeader && p.status !== 'Done' && p.endDateEst && new Date(p.endDateEst) < new Date()).length;
            const totalMandays = allTasks.reduce((acc, p) => acc + (parseFloat(p.mandayEst) || 0), 0);

            const masterData = {
                overallKpis: {
                    overallProgress: totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0,
                    totalTasks,
                    totalMandays,
                    overdue: totalOverdue,
                },
                phases,
            };

            return NextResponse.json({ success: true, data: masterData });
        }

        // --- SINGLE TAB LOGIC (EXISTING) ---
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: `${tab}!A1:AC100`, // Mở rộng range để lấy đủ 29 cột (A -> AC)
        });

        const rows = response.data.values || [];
        const formattedProjects = parseProjectsFromSheet(rows);

        return NextResponse.json({
            success: true,
            tab,
            data: formattedProjects,
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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { tab, rootTask, detailTask, progress, priority, mandayEst, assigned } = body;

        const sheetId = process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;
        const sheets = await getSheetsClient();

        const newRow = new Array(26).fill(""); // Mở rộng mảng để khớp 29 cột

        newRow[1] = detailTask || "";
        newRow[2] = priority || "";
        newRow[3] = mandayEst || "";
        newRow[4] = progress || "To Do";
        newRow[6] = assigned || "";
        newRow[23] = rootTask || "";

        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: `${tab}!A:AC`, // Mở rộng range để ghi
            valueInputOption: "USER_ENTERED",
            requestBody: {
                values: [newRow],
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Google Sheets Append Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to add task", error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}