// app/api/projects/route.ts

import { NextResponse } from "next/server";
import { getSheetsClient, SHEET_ID as DEFAULT_SHEET_ID } from "@/lib/db";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const tab = searchParams.get("tab") || "1.Sale/Admin";

        const sheetId =
            process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;

        const sheets = await getSheetsClient();

        console.log("Sheet ID:", sheetId);
        console.log("Tab:", tab);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: `${tab}!A1:Z100`,
        });

        const rows = response.data.values || [];

        console.log("Rows found:", rows.length);

        return NextResponse.json({
            success: true,
            tab,
            totalRows: rows.length,
            data: rows,
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
        const { tab, rootTask, detailTask, progress } = body;

        const sheetId = process.env.GOOGLE_SHEET_ID || DEFAULT_SHEET_ID;
        const sheets = await getSheetsClient();

        // Tạo mảng 26 cột rỗng (dựa trên số cột trong bảng dashboard)
        const newRow = new Array(26).fill("");
        
        // Gán các giá trị vào đúng vị trí cột tương ứng
        // 1: DETAIL TASK (Task nhỏ)
        // 4: STATUS (Tiến độ)
        // 23: ROOT TASKS (Task lớn)
        newRow[1] = detailTask;
        newRow[4] = progress;
        newRow[23] = rootTask;

        await sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: `${tab}!A:Z`,
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