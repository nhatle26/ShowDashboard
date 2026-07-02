import { NextResponse } from "next/server";
import { getSheetsClient, SHEET_ID } from "@/lib/db";

export async function GET() {
    try {
        const sheetId = process.env.GOOGLE_SHEET_ID || SHEET_ID;
        const sheets = await getSheetsClient();
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: "UserMap!A2:A", 
        });
        
        const rows = response.data.values || [];
        const users = rows.map((row: any[]) => row[0]?.trim()).filter(Boolean);
        
        return NextResponse.json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
