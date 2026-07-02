import { NextResponse } from "next/server";
import { listSheetTitles } from "@/lib/db";

export async function GET() {
    try {
        const titles = await listSheetTitles();
        return NextResponse.json(titles);
    } catch (err) {
        console.error("Failed to list sheet titles:", err);
        return NextResponse.json({ message: "Failed" }, { status: 500 });
    }
}
