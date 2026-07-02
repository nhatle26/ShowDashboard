import { NextResponse } from "next/server";
import { getSheetsClient, SHEET_ID } from "@/lib/db";

// Hàm lấy tất cả Skill Solutions ở dòng 3
async function getSkillSolutions(sheets: any, sheetId: string) {
    const range = "Vendor!A3:Z3"; 
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
    });
    
    const rows = response.data.values || [];
    if (rows.length === 0) return [];
    
    // Trả về dữ liệu dòng 3 (index 0 trong mảng trả về)
    return rows[0]; 
}

// Hàm lấy tất cả Skill Vendors từ dòng 4 trở xuống
async function getSkillVendors(sheets: any, sheetId: string) {
    const range = "Vendor!A4:Z100"; 
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range,
    });
    
    return response.data.values || [];
}

export async function GET() {
    try {
        const sheetId = process.env.GOOGLE_SHEET_ID || SHEET_ID;
        const sheets = await getSheetsClient();
        
        // Gọi 2 hàm riêng biệt để lấy dữ liệu
        const solutionsRow = await getSkillSolutions(sheets, sheetId);
        const vendorsRows = await getSkillVendors(sheets, sheetId);
        
        const solutions = [];

        // Ghép dữ liệu Vendor vào đúng cột của Skill Solution tương ứng
        for (let colIndex = 0; colIndex < solutionsRow.length; colIndex++) {
            const solutionName = solutionsRow[colIndex]?.trim();
            
            if (solutionName) {
                const vendors = [];
                // Duyệt qua các dòng từ dòng 4 trở xuống
                for (let rowIndex = 0; rowIndex < vendorsRows.length; rowIndex++) {
                    const vendor = vendorsRows[rowIndex]?.[colIndex]?.trim();
                    if (vendor) {
                        vendors.push(vendor);
                    }
                }
                
                solutions.push({
                    name: solutionName,
                    vendors: vendors
                });
            }
        }

        return NextResponse.json({ solutions });
    } catch (error) {
        console.error("Error fetching vendors:", error);
        return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
    }
}
