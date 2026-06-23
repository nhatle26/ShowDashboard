// app/api/projects/route.ts
import { NextResponse } from "next/server";
import { getSheetsClient } from "@/lib/db";

interface ProjectItem {
    name: string;
    client: string;
    status: string;
    color: string;
    progress: number;
    date: string;
}

export async function GET() {
    try {
        const sheets = await getSheetsClient();
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: "1ej1tIq4nsR2xmFPL3Wpm47YjorVNsf4qmrW7uLxyvjo",
            range: "ActiveProjects!A2:F",
        });

        const rows = res.data.values;
        if (!rows || rows.length === 0) {
            return NextResponse.json([]);
        }

        const projects: ProjectItem[] = rows.map((row): ProjectItem => ({
            name: row[0] || "N/A",
            client: row[1] || "N/A",
            status: row[2] || "N/A",
            color: row[3] || "bg-zinc-700 text-zinc-200",
            progress: Number(row[4]) || 0,
            date: row[5] || "N/A",
        }));

        return NextResponse.json(projects.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
        console.error("API Error fetching projects:", error);
        return NextResponse.json({ message: "Failed to fetch projects" }, { status: 500 });
    }
}