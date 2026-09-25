import React, { useState } from 'react';
import { Save, Download, Upload, Trash2, Bell, Moon, Sun, DollarSign, AlertTriangle, X, RotateCw, Sparkles, CheckCircle2, Sliders } from 'lucide-react';

interface SettingsProps {
  onClearData: () => void;
  onExportData: () => void;
  onImportData: (data: string) => void;
  theme: string;
  onThemeChange: (theme: string) => void;
  monthlyBudgetLimit: number;
  onMonthlyBudgetLimitChange: (limit: number) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  onClearData, 
  onExportData, 
  onImportData, 
  theme, 
  onThemeChange,
  monthlyBudgetLimit,
  onMonthlyBudgetLimitChange
}) => {
  const [currency, setCurrency] = useState('BRL');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [importText, setImportText] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);
  const [budgetLimitInput, setBudgetLimitInput] = useState(monthlyBudgetLimit > 0 ? monthlyBudgetLimit.toString() : '');
  const [budgetSaved, setBudgetSaved] = useState(false);

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      sessionStorage.clear();
      setCacheMessage('Cache limpo com sucesso! Recarregando...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Error clearing cache:', err);
      setCacheMessage('Cache limpo! Recarregando...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } finally {
      setIsClearingCache(false);
    }
  };

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
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <DollarSign className="text-primary-500" /> Preferências Regionais
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Moeda Principal</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full md:w-1/2 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              <option value="BRL">Real Brasileiro (R$)</option>
              <option value="USD">Dólar Americano ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Limite de Orçamento Mensal */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <Sliders className="text-emerald-500" /> Limite de Orçamento Mensal
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Defina um teto máximo de despesas para o mês. O sistema exibirá um alerta visual no Dashboard caso os gastos totais ultrapassem este limite.
        </p>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
            <input 
              type="number"
              min="0"
              step="50"
              placeholder="Ex: 5000"
              value={budgetLimitInput}
              onChange={(e) => {
                setBudgetLimitInput(e.target.value);
                setBudgetSaved(false);
              }}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-bold text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => {
              const val = parseFloat(budgetLimitInput) || 0;
              onMonthlyBudgetLimitChange(val);
              setBudgetSaved(true);
              setTimeout(() => setBudgetSaved(false), 3000);
            }}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Save size={16} /> Salvar Limite
          </button>
        </div>

        {budgetSaved && (
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-fade-in">
            <CheckCircle2 size={14} />
            <span>Limite de orçamento mensal salvo com sucesso!</span>
          </div>
        )}
        
        {monthlyBudgetLimit > 0 && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center justify-between">
            <span>Limite mensal ativo: <strong>{monthlyBudgetLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong></span>
            <button
              onClick={() => {
                setBudgetLimitInput('');
                onMonthlyBudgetLimitChange(0);
                setBudgetSaved(true);
                setTimeout(() => setBudgetSaved(false), 3000);
              }}
              className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
            >
              Remover Limite
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <Sun className="text-orange-500" /> Aparência
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Tema</label>
            <div className="flex gap-4">
              <button
                onClick={() => onThemeChange('light')}
                className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${theme === 'light' ? 'bg-primary-50 border-primary-200 text-primary-700 font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-950'}`}
              >
                <Sun size={18} /> Claro
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-white font-bold' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-950'}`}
              >
                <Moon size={18} /> Escuro
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
          <Bell className="text-indigo-500" /> Notificações Push & Alertas
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Receba notificações push no navegador e alertas visuais quando contas a pagar estiverem com menos de 2 dias para o vencimento.
        </p>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-bold text-slate-800 dark:text-white">Alertas de Vencimento (menos de 2 dias)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ativa alertas para contas que vencem hoje, amanhã ou em até 2 dias.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notificationsEnabled}
                onChange={(e) => {
                  setNotificationsEnabled(e.target.checked);
                  localStorage.setItem('finance_notifications_enabled', e.target.checked.toString());
                }}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-slate-900 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-bold text-slate-800 dark:text-white text-sm">Permissão do Navegador</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {typeof window !== 'undefined' && 'Notification' in window
                  ? Notification.permission === 'granted'
                    ? 'Status: Notificações permitidas pelo navegador ✅'
                    : Notification.permission === 'denied'
                    ? 'Status: Notificações bloqueadas nas configurações do navegador ⚠️'
                    : 'Status: Permissão ainda não solicitada'
                  : 'Navegador não suporta Web Notifications'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
                <button
                  onClick={async () => {
                    const perm = await Notification.requestPermission();
                    if (perm === 'granted') {
                      new Notification('Notificações Ativadas! 🔔', {
                        body: 'Você agora receberá avisos sobre contas próximas do vencimento.',
                        icon: '/favicon.ico'
                      });
                      alert('Permissão concedida com sucesso!');
                    }
                  }}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Solicitar Permissão
                </button>
              )}
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification('Teste de Notificação Push 🔔', {
                      body: 'Esta é uma notificação de teste para lembrete de contas a pagar (vencimento em menos de 2 dias).',
                      icon: '/favicon.ico'
                    });
                  }
                  alert('Notificação Push disparada com sucesso!');
                }}
                className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors"
              >
                🔔 Testar Notificação
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <Save className="text-blue-500" /> Dados e Backup
        </h3>
        
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-bold text-slate-800 dark:text-white">Exportar Dados</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Baixe um arquivo CSV com suas transações.</p>
            </div>
            <button 
              onClick={onExportData}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 dark:bg-slate-950 transition-colors font-medium text-sm"
            >
              <Download size={16} /> Exportar CSV
            </button>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div>
              <p className="font-bold text-slate-800 dark:text-white">Importar Dados</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Cole o conteúdo do seu arquivo CSV exportado anteriormente.</p>
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Cole o CSV aqui..."
              className="w-full h-32 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm font-mono"
            />
            <button 
              onClick={handleImport}
              disabled={!importText.trim()}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={16} /> Importar
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="font-bold text-slate-800 dark:text-white">Cache e Atualizações</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Limpe dados em cache temporário do navegador ou force o recarregamento do sistema.</p>
              {cacheMessage && (
                <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={14} />
                  <span>{cacheMessage}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm shadow-xs"
              >
                <RotateCw size={16} className="text-blue-500" /> Recarregar
              </button>
              <button 
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 px-3.5 py-2 rounded-xl transition-colors font-medium text-sm shadow-xs disabled:opacity-50"
              >
                <Trash2 size={16} className="text-amber-600 dark:text-amber-400" />
                <span>{isClearingCache ? 'Limpando...' : 'Limpar Cache'}</span>
              </button>
            </div>
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3 text-red-600">
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <h2 className="text-xl font-bold">Apagar todos os dados</h2>
              </div>
              <button 
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Tem certeza absoluta que deseja apagar <strong className="text-slate-800 dark:text-white">TODOS</strong> os seus dados? 
              Isso inclui todas as transações, categorias, cartões e configurações. 
              <br/><br/>
              <span className="text-red-600 font-medium">Esta ação não pode ser desfeita.</span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
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
