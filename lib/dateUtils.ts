export const calculateEndDate = (startDateStr: string, mandayStr: string): string => {
  if (!startDateStr || !mandayStr) return "";

  const manday = parseFloat(mandayStr);
  if (isNaN(manday) || manday <= 0) return "";

  const startDate = new Date(startDateStr);
  if (isNaN(startDate.getTime())) return "";

  // End Date = Start Date + (Manday - 1) days
  // Default to 0 days added if manday is <= 1
  const addDays = Math.max(0, Math.ceil(manday) - 1);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + addDays);

  // Format back to DD-MMM-YYYY (e.g. 23-Jun-2026)
  const day = endDate.getDate().toString().padStart(2, '0');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[endDate.getMonth()];
  const year = endDate.getFullYear();
  return `${day}-${month}-${year}`;
};
