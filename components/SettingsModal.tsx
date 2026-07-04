import React from 'react';
import { X, Save } from 'lucide-react';
import { useKPISettings, KPISettings } from '@/hooks/useKPISettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useKPISettings();
  const [localSettings, setLocalSettings] = React.useState<KPISettings>(settings);

  React.useEffect(() => {
    if (isOpen) {
      setLocalSettings(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111113] border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div>
            <h2 className="text-lg font-semibold text-white">Cấu hình hệ thống</h2>
            <p className="text-xs text-zinc-400 mt-1">Điều chỉnh điểm KPI Base mặc định theo Priority</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 flex-1 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-zinc-300">Điểm KPI Base mặc định</h3>
            
            {/* Priority: Normal */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                Normal
              </label>
              <input 
                type="number"
                value={localSettings.Normal}
                onChange={(e) => setLocalSettings({...localSettings, Normal: e.target.value})}
                className="bg-black/50 border border-zinc-800 text-sm text-white px-3 py-1.5 rounded-md focus:outline-none focus:border-blue-500 w-24 text-right"
              />
            </div>
            
            {/* Priority: High */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                High
              </label>
              <input 
                type="number"
                value={localSettings.High}
                onChange={(e) => setLocalSettings({...localSettings, High: e.target.value})}
                className="bg-black/50 border border-zinc-800 text-sm text-white px-3 py-1.5 rounded-md focus:outline-none focus:border-blue-500 w-24 text-right"
              />
            </div>
            
            {/* Priority: Critical */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                Critical
              </label>
              <input 
                type="number"
                value={localSettings.Critical}
                onChange={(e) => setLocalSettings({...localSettings, Critical: e.target.value})}
                className="bg-black/50 border border-zinc-800 text-sm text-white px-3 py-1.5 rounded-md focus:outline-none focus:border-blue-500 w-24 text-right"
              />
            </div>

            {/* Priority: Interrupt */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-zinc-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                Interrupt
              </label>
              <input 
                type="number"
                value={localSettings.Interrupt}
                onChange={(e) => setLocalSettings({...localSettings, Interrupt: e.target.value})}
                className="bg-black/50 border border-zinc-800 text-sm text-white px-3 py-1.5 rounded-md focus:outline-none focus:border-blue-500 w-24 text-right"
              />
            </div>
            
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-300 bg-transparent border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            <Save size={16} />
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
