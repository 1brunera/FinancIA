import React, { useState } from 'react';
import { Save, Download, Upload, Trash2, Bell, Moon, Sun, DollarSign, AlertTriangle, X } from 'lucide-react';

interface SettingsProps {
  onClearData: () => void;
  onExportData: () => void;
  onImportData: (data: string) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClearData, onExportData, onImportData, theme, onThemeChange }) => {
  const [currency, setCurrency] = useState('BRL');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [importText, setImportText] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleSave = () => {
    // In a real app, these would be saved to localStorage or a backend
    alert('Configurações salvas com sucesso!');
  };

  const handleImport = () => {
    try {
      onImportData(importText);
      setImportText('');
      alert('Dados importados com sucesso!');
    } catch (error) {
      alert('Erro ao importar dados. Verifique o formato JSON.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <DollarSign className="text-primary-500" /> Preferências Regionais
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Moeda Principal</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full md:w-1/2 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              <option value="BRL">Real Brasileiro (R$)</option>
              <option value="USD">Dólar Americano ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Sun className="text-orange-500" /> Aparência
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tema</label>
            <div className="flex gap-4">
              <button
                onClick={() => onThemeChange('light')}
                className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${theme === 'light' ? 'bg-primary-50 border-primary-200 text-primary-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Sun size={18} /> Claro
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Moon size={18} /> Escuro
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Bell className="text-indigo-500" /> Notificações
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-800">Alertas de Vencimento</p>
            <p className="text-sm text-slate-500">Receba avisos sobre contas próximas do vencimento.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Save className="text-blue-500" /> Dados e Backup
        </h3>
        
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <p className="font-bold text-slate-800">Exportar Dados</p>
              <p className="text-sm text-slate-500">Baixe um arquivo CSV com suas transações.</p>
            </div>
            <button 
              onClick={onExportData}
              className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors font-medium text-sm"
            >
              <Download size={16} /> Exportar CSV
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div>
              <p className="font-bold text-slate-800">Importar Dados</p>
              <p className="text-sm text-slate-500">Cole o conteúdo do seu arquivo CSV exportado anteriormente.</p>
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Cole o CSV aqui..."
              className="w-full h-32 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm font-mono"
            />
            <button 
              onClick={handleImport}
              disabled={!importText.trim()}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={16} /> Importar
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
            <div>
              <p className="font-bold text-red-800">Zona de Perigo</p>
              <p className="text-sm text-red-600">Apagar todos os dados do aplicativo. Esta ação é irreversível.</p>
            </div>
            <button 
              onClick={() => setIsResetModalOpen(true)}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors font-medium text-sm"
            >
              <Trash2 size={16} /> Apagar Tudo
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          className="bg-primary-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20 flex items-center gap-2"
        >
          <Save size={20} /> Salvar Alterações
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3 text-red-600">
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <h2 className="text-xl font-bold">Apagar todos os dados</h2>
              </div>
              <button 
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-slate-600 mb-6 leading-relaxed">
              Tem certeza absoluta que deseja apagar <strong className="text-slate-800">TODOS</strong> os seus dados? 
              Isso inclui todas as transações, categorias, cartões e configurações. 
              <br/><br/>
              <span className="text-red-600 font-medium">Esta ação não pode ser desfeita.</span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onClearData();
                  setIsResetModalOpen(false);
                }}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                Sim, apagar tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
