import { useState, useEffect } from 'react';

// Kiểu dữ liệu lưu trữ điểm KPI cho từng mức độ ưu tiên
export type KPISettings = {
  Normal: string;
  High: string;
  Critical: string;
  Interrupt: string;
};

// Cấu hình mặc định ban đầu nếu chưa có dữ liệu lưu trữ
const DEFAULT_KPI_SETTINGS: KPISettings = {
  Normal: "6",
  High: "12",
  Critical: "20",
  Interrupt: "6",
};

/**
 * Hook quản lý cấu hình KPI Base
 * - Đọc/ghi dữ liệu từ localStorage để lưu trữ ngay trên trình duyệt của người dùng.
 * - Cung cấp hàm lấy điểm KPI cho 1 mức độ ưu tiên cụ thể.
 */
export function useKPISettings() {
  const [settings, setSettings] = useState<KPISettings>(DEFAULT_KPI_SETTINGS);

  // Tải cấu hình từ localStorage khi component được render lần đầu
  useEffect(() => {
    const saved = localStorage.getItem('kpi_settings');
    if (saved) {
      try {
        setSettings({ ...DEFAULT_KPI_SETTINGS, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to parse KPI settings", e);
      }
    }
  }, []);

  // Cập nhật cấu hình mới và lưu đè xuống localStorage
  const updateSettings = (newSettings: Partial<KPISettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('kpi_settings', JSON.stringify(updated));
  };

  // Hàm tiện ích: Trả về số điểm KPI dựa vào chuỗi Priority (VD: truyền vào "High" sẽ trả ra "12")
  const getKpiForPriority = (priority: string, currentSettings?: KPISettings) => {
    return (currentSettings || settings)[priority as keyof KPISettings] || "";
  };

  return { settings, updateSettings, getKpiForPriority };
}
