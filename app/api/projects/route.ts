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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        let { tab, rootTask, detailTask, status, priority, mandayEst, assigned, startDateEst, support, skillSolution, skillVendor, ticketId } = body;

        const sheetId = process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;
        const sheets = await getSheetsClient();

        const newRow = new Array(26).fill(""); // Mở rộng mảng để khớp 29 cột

        // Điền dữ liệu vào các cột tương ứng
        newRow[1] = detailTask || ""; // Chi tiết Task
        newRow[2] = priority || "Normal"; // Độ ưu tiên
        newRow[3] = mandayEst || ""; // Manday (Est)
        newRow[4] = status || "To Do"; // Trạng thái
        newRow[5] = startDateEst || ""; // Start Date (Est)
        newRow[6] = assigned || ""; // Người thực hiện
        newRow[7] = support || ""; // Support
        // KPI Ratio (cột 8) không có trong form
        newRow[9] = skillSolution || ""; // Skill Solution
        newRow[10] = skillVendor || ""; // Skill Vendor
        newRow[11] = ticketId || ""; // Ticket ID

        // Logic mới: Tìm dòng "Issue" và chèn vào trước nó
        let issueRowIndex = -1;
        try {
            const sheetData = await sheets.spreadsheets.values.get({
                spreadsheetId: sheetId,
                range: `${tab}!A1:A`, // Chỉ cần đọc cột A để tìm "Issue"
            });
            const rows = sheetData.data.values || [];
            for (let i = 0; i < rows.length; i++) {
                const cellValue = (rows[i][0] || "").toString().trim();
                if (cellValue.toLowerCase().startsWith("issue") || cellValue.toLowerCase().startsWith("change request")) {
                    issueRowIndex = i; // 0-based index
                    break;
                }
            }
        } catch (e) {
            console.warn("Could not read sheet to find 'Issue' row. Will append to the end.", e);
        }

        // Nếu rootTask không được cung cấp, tìm rootTask gần nhất phía TRÊN dòng "Issue"
        if (!rootTask && tab) {
            try {
                const rangeEnd = issueRowIndex !== -1 ? issueRowIndex + 1 : 1000; // Đọc đến dòng issue hoặc 1000
                const response = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: `${tab}!A1:A${rangeEnd}` });
                const rows = response.data.values || [];
                // Duyệt từ dưới lên (từ vị trí ngay trên 'Issue') để tìm majorTask gần nhất
                for (let i = rows.length - 1; i >= 0; i--) {
                    const cellValue = (rows[i][0] || "").toString().trim();
                    if (cellValue.match(/^[IVX]+\.\s/i)) { rootTask = cellValue; break; }
                }
            } catch (e) { console.warn("Could not find last root task. Proceeding without it.", e); }
        }
        newRow[23] = rootTask || ""; // Gán Task lớn sau khi đã tìm

        let insertionIndex = -1; // Mặc định là không tìm thấy vị trí, sẽ append vào cuối

        // Logic mới: Luôn tìm vị trí chèn dựa trên rootTask (dù là tự động hay người dùng chọn)
        if (rootTask) {
            try {
                const sheetData = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: `${tab}!A1:A` });
                const rows = sheetData.data.values || [];
                let rootTaskIndex = -1;

                // 1. Tìm vị trí của rootTask cha
                for (let i = 0; i < rows.length; i++) {
                    if ((rows[i][0] || "").toString().trim() === rootTask) {
                        rootTaskIndex = i;
                        break;
                    }
                }

                if (rootTaskIndex !== -1) {
                    // 2. Tìm vị trí của task con cuối cùng thuộc rootTask đó
                    let lastChildIndex = rootTaskIndex;
                    for (let i = rootTaskIndex + 1; i < rows.length; i++) {
                        const cellValue = (rows[i][0] || "").toString().trim();
                        // Dừng lại khi gặp header tiếp theo hoặc dòng trống
                        if (cellValue.match(/^[IVX]+\.\s/i) || cellValue.toLowerCase().startsWith("issue") || cellValue.toLowerCase().startsWith("change request") || cellValue === "") break;
                        lastChildIndex = i; // Cập nhật vị trí task con cuối cùng
                    }
                    insertionIndex = lastChildIndex + 1; // Vị trí chèn là ngay sau task con cuối cùng
                }
            } catch (e) { console.warn("Error finding last child task, will fall back to default insertion.", e); }
        }

        if (insertionIndex !== -1) {
            // Tìm thấy "Issue", chèn dòng vào trước nó
            // Cần lấy sheetId số để dùng batchUpdate
            const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
            const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === tab);
            const numericSheetId = sheet?.properties?.sheetId;

            if (numericSheetId !== undefined) {
                // 1. Chèn một dòng trống
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId: sheetId,
                    requestBody: {
                        requests: [{
                            insertDimension: {
                                range: { sheetId: numericSheetId, dimension: "ROWS", startIndex: insertionIndex, endIndex: insertionIndex + 1 },
                                inheritFromBefore: false,
                            }
                        }]
                    }
                });
                // 2. Cập nhật dữ liệu vào dòng mới đó (dòng mới giờ là issueRowIndex + 1)
                await sheets.spreadsheets.values.update({
                    spreadsheetId: sheetId,
                    range: `${tab}!A${insertionIndex + 1}`,
                    valueInputOption: "USER_ENTERED",
                    requestBody: { values: [newRow] }
                });
            }
        } else {
            // Không tìm thấy "Issue", thêm vào cuối như cũ
            await sheets.spreadsheets.values.append({
                spreadsheetId: sheetId,
                range: `${tab}!A:AC`,
                valueInputOption: "USER_ENTERED",
                requestBody: { values: [newRow] },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Google Sheets Append Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to add task", error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { tab, projects } = body;

        if (!tab || !Array.isArray(projects)) {
            return NextResponse.json({ success: false, message: "Invalid parameters" }, { status: 400 });
        }

        const sheetId = process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;
        const sheets = await getSheetsClient();

        // Lấy dữ liệu hiện tại để biết dòng header
        const currentSheetData = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: `${tab}!A1:AC1`, // Chỉ cần lấy dòng header
        });
        const headerRow = currentSheetData.data.values ? currentSheetData.data.values[0] : [];

        // Chuyển đổi mảng projects (JSON) thành mảng các mảng giá trị cho Google Sheet
        const values = projects.map((p: any) => {
            // Nếu là header, chỉ trả về 2 cột đầu tiên, các cột còn lại rỗng
            if (p.isHeader) {
                const headerValues = new Array(29).fill("");
                headerValues[0] = p.taskId;
                headerValues[1] = p.detailTask;
                return headerValues;
            }
            // Nếu là task, trả về đầy đủ các cột
            return [
                p.taskId || "", p.detailTask || "", p.priority || "", p.mandayEst || "",
                p.status || "", p.startDateEst || "", p.assigned || "", p.support || "",
                p.kpiRatio || "", p.skillSolution || "", p.skillVendor || "", p.ticketId || "",
                p.remark || "", p.send || "", p.endDateEst || "", p.mandayActual || "",
                p.endDateActual || "", p.daysLate || "", p.kpiBase || "", p.kpiPerform || "",
                p.kpiOvertime || "", p.kpiFinal || "", p.subId || "", p.rootTasks || "",
                p.notes || "",
                // Các cột mới có thể không tồn tại trong p, cần xử lý
                p.weekEst || "", p.monthEst || "", p.weekActual || "", p.monthActual || ""
            ];
        });

        // Xóa dữ liệu cũ (từ dòng 2 trở đi)
        await sheets.spreadsheets.values.clear({
            spreadsheetId: sheetId,
            range: `${tab}!A2:AC`,
        });

        // Ghi đè dữ liệu mới (từ dòng 2 trở đi)
        await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `${tab}!A2`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: values },
        });

        return NextResponse.json({ success: true, message: "Tasks reordered successfully" });
    } catch (error) {
        console.error("Google Sheets Move Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to move task", error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}


export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { sourceTab, destinationTab, rowData, sourceIndex } = body;

        if (!sourceTab || !destinationTab || !rowData || sourceIndex === undefined) {
            return NextResponse.json({ success: false, message: "Invalid parameters for moving task" }, { status: 400 });
        }

        const sheetId = process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;
        const sheets = await getSheetsClient();

        // --- BƯỚC 1: THÊM DỮ LIỆU VÀO TAB ĐÍCH ---
        const newRow = [
            rowData.taskId || "", rowData.detailTask || "", rowData.priority || "Normal", rowData.mandayEst || "",
            rowData.status || "To Do", rowData.startDateEst || "", rowData.assigned || "", rowData.support || "",
            rowData.kpiRatio || "", rowData.skillSolution || "", rowData.skillVendor || "", rowData.ticketId || "",
            rowData.remark || "", rowData.send || "", rowData.endDateEst || "", rowData.mandayActual || "",
            rowData.endDateActual || "", rowData.daysLate || "", rowData.kpiBase || "", rowData.kpiPerform || "",
            rowData.kpiOvertime || "", rowData.kpiFinal || "", rowData.subId || "", rowData.rootTasks || "",
            rowData.notes || ""
        ];

        // Chèn vào cuối tab đích
        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: `${destinationTab}!A:AC`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: [newRow] },
        });

        // --- BƯỚC 2: XÓA DÒNG KHỎI TAB NGUỒN ---
        const sourceSheet = (await sheets.spreadsheets.get({ spreadsheetId: sheetId })).data.sheets?.find(s => s.properties?.title === sourceTab);
        const sourceNumericSheetId = sourceSheet?.properties?.sheetId;

        if (sourceNumericSheetId !== undefined) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: sheetId,
                requestBody: {
                    requests: [{
                        deleteDimension: {
                            range: {
                                sheetId: sourceNumericSheetId,
                                dimension: "ROWS",
                                startIndex: sourceIndex,
                                endIndex: sourceIndex + 1
                            }
                        }
                    }]
                }
            });
        }

        return NextResponse.json({ success: true, message: "Task moved successfully" });

    } catch (error) {
        console.error("Google Sheets Move Task Error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to move task", error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}