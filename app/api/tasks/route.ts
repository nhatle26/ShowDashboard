import { NextResponse } from "next/server";
import { appendSheetData } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Nhận 2 trường từ request body của form AddTaskModal
    const { mainTask, subTask } = body;

    if (!mainTask || !subTask) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // Ghi vào tab 'Tasks', bắt đầu từ cột A.
    await appendSheetData("Tasks!A:B", [[mainTask, subTask]]);

    return NextResponse.json({ success: true, message: "Task added successfully" });
  } catch (error) {
    console.error("API Error adding task:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
