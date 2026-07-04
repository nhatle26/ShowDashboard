import { useState, useEffect } from 'react';

export type KPISettings = {
  Normal: string;
  High: string;
  Critical: string;
  Interrupt: string;
};

const DEFAULT_KPI_SETTINGS: KPISettings = {
  Normal: "6",
  High: "12",
  Critical: "20",
  Interrupt: "6",
};

export function useKPISettings() {
  const [settings, setSettings] = useState<KPISettings>(DEFAULT_KPI_SETTINGS);

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

  const updateSettings = (newSettings: Partial<KPISettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('kpi_settings', JSON.stringify(updated));
  };

  const getKpiForPriority = (priority: string, currentSettings?: KPISettings) => {
    return (currentSettings || settings)[priority as keyof KPISettings] || "";
  };

  return { settings, updateSettings, getKpiForPriority };
}
