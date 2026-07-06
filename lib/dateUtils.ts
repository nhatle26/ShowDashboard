/**
 * Hàm tính toán Ngày kết thúc (End Date Est) dựa trên Ngày bắt đầu (Start Date Est) và số ngày làm việc (Manday Est).
 * Công thức: Ngày kết thúc = Ngày bắt đầu + (Manday - 1) ngày.
 * Lưu ý: Hiện tại tính cả ngày cuối tuần (thứ 7, CN).
 */
export const calculateEndDate = (startDateStr: string, mandayStr: string): string => {
  // Nếu thiếu ngày bắt đầu hoặc số manday thì trả về chuỗi rỗng
  if (!startDateStr || !mandayStr) return "";

  const manday = parseFloat(mandayStr);
  if (isNaN(manday) || manday <= 0) return "";

  const startDate = new Date(startDateStr);
  if (isNaN(startDate.getTime())) return "";

  // Tính số ngày cần cộng thêm: Số manday - 1. Nếu manday <= 1 thì cộng thêm 0 ngày (End Date = Start Date).
  const addDays = Math.max(0, Math.ceil(manday) - 1);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + addDays);

  // Format lại ngày tháng năm về chuẩn giao diện DD-MMM-YYYY (VD: 23-Jun-2026)
  const day = endDate.getDate().toString().padStart(2, '0');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[endDate.getMonth()];
  const year = endDate.getFullYear();

  return `${day}-${month}-${year}`;
};
