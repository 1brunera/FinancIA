import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Transaction, TransactionType, CategoryOption } from '../types';
import { Settings, Info, Edit3 } from 'lucide-react';

interface FinancialChartsProps {
  transactions: Transaction[];
  categories: CategoryOption[];
  monthlyIncome: number; // Recebendo a renda mensal para basear o orçamento
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ transactions, categories, monthlyIncome }) => {
  // Estado para o modelo de orçamento
  const [budgetModel, setBudgetModel] = useState<'50/30/20' | '60/20/20' | '70/20/10' | 'custom'>(() => {
    return (localStorage.getItem('finance_budget_model') as any) || '50/30/20';
  });
  
  // Estado para valores personalizados (em porcentagem inteira: 50, 30, 20)
  const [customNeeds, setCustomNeeds] = useState(() => {
    return Number(localStorage.getItem('finance_custom_needs')) || 50;
  });
  const [customWants, setCustomWants] = useState(() => {
    return Number(localStorage.getItem('finance_custom_wants')) || 30;
  });
  const [customSavings, setCustomSavings] = useState(() => {
    return Number(localStorage.getItem('finance_custom_savings')) || 20;
  });

  const handleModelChange = (model: string) => {
    setBudgetModel(model as any);
    localStorage.setItem('finance_budget_model', model);
  };

  const handleSaveCustomBudget = () => {
    const totalCustom = customNeeds + customWants + customSavings;
    if (totalCustom !== 100) {
      alert('A soma das porcentagens deve ser exatamente 100%.');
      return;
    }
    localStorage.setItem('finance_budget_model', 'custom');
    localStorage.setItem('finance_custom_needs', customNeeds.toString());
    localStorage.setItem('finance_custom_wants', customWants.toString());
    localStorage.setItem('finance_custom_savings', customSavings.toString());
    alert('Modelo de orçamento personalizado salvo com sucesso!');
  };

  // Configurações do modelo
  const getModelConfig = () => {
    switch (budgetModel) {
      case '50/30/20': return { needs: 0.50, wants: 0.30, savings: 0.20 };
      case '60/20/20': return { needs: 0.60, wants: 0.20, savings: 0.20 };
      case '70/20/10': return { needs: 0.70, wants: 0.20, savings: 0.10 };
      case 'custom': return { needs: customNeeds / 100, wants: customWants / 100, savings: customSavings / 100 };
      default: return { needs: 0.50, wants: 0.30, savings: 0.20 };
    }
  };

  const modelConfig = getModelConfig();

  // Helper for currency format
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // --- Logic for Pie Chart ---
  const expenseData = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.categoryId === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        const categoryInfo = categories.find(c => c.id === curr.category);
        acc.push({
          name: categoryInfo?.label || curr.category,
          value: curr.amount,
          categoryId: curr.category,
          color: categoryInfo?.color || '#cbd5e1'
        });
      }
      return acc;
    }, [] as { name: string; value: number; categoryId: string; color: string }[]);

  // --- Logic for Budget Bar Chart ---
  const calculateGroupTotal = (group: 'needs' | 'wants' | 'savings') => {
    return transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => {
        const cat = categories.find(c => c.id === t.category);
        // Default to 'wants' if no group specified, unless it looks like a essential category
        return (cat?.budgetGroup === group) ? sum + t.amount : sum;
      }, 0);
  };

  const needsTotal = calculateGroupTotal('needs');
  const wantsTotal = calculateGroupTotal('wants');
  const savingsTotal = calculateGroupTotal('savings');

  // Logic for color alerts (Green -> Yellow -> Red)
  const getProgressColor = (current: number, max: number) => {
    if (max === 0) return '#cbd5e1';
    const percentage = current / max;
    if (percentage < 0.8) return '#22c55e'; // Green (< 80%)
    if (percentage < 1.0) return '#f59e0b'; // Yellow (80% - 100%)
    return '#ef4444'; // Red (> 100%)
  };

  const renderBudgetBar = (label: string, current: number, percentageTarget: number, description: string) => {
    const max = monthlyIncome * percentageTarget;
    const percentUsed = max > 0 ? (current / max) * 100 : 0;
    const color = getProgressColor(current, max);

    return (
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
              {label} <span className="text-xs text-slate-400 font-normal">({(percentageTarget * 100).toFixed(0)}%)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
          </div>
          <div className="text-right">
             <span className="font-bold text-slate-800 dark:text-white text-sm">{formatCurrency(current)}</span>
             <span className="text-xs text-slate-400 mx-1">de</span>
             <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{formatCurrency(max)}</span>
          </div>
        </div>
        
        {/* Progress Bar Container */}
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-full relative">
            {/* Background markers for 80% and 100% */}
            <div className="absolute top-0 bottom-0 left-[80%] w-[1px] bg-white/50 z-10"></div>
            
            {/* Fill */}
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${Math.min(percentUsed, 100)}%`, 
                backgroundColor: color 
              }}
            ></div>
        </div>
        
        {/* Helper Text */}
        <div className="flex justify-between mt-1">
             <span className="text-[10px] font-bold" style={{ color }}>
               {percentUsed.toFixed(1)}% utilizado
             </span>
             {current > max && (
               <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                 <Info size={10} /> Acima do orçamento
               </span>
             )}
        </div>
      </div>
    );
  };

  if (transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
        <p className="text-slate-400">Adicione transações para ver os gráficos</p>
      </div>
    );
  }

  const totalCustom = customNeeds + customWants + customSavings;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* Budget Analysis Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Modelo de Orçamento</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Planejado vs Real (Baseado na Receita)</p>
            </div>
            <div className="relative">
                <select 
                    value={budgetModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="appearance-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-1.5 pl-3 pr-8 rounded-lg outline-none cursor-pointer hover:border-indigo-300 transition-colors"
                >
                    <option value="50/30/20">50/30/20</option>
                    <option value="60/20/20">60/20/20</option>
                    <option value="70/20/10">70/20/10</option>
                    <option value="custom">Personalizado</option>
                </select>
                <Settings size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
        </div>

        {budgetModel === 'custom' && (
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <Edit3 size={14} /> Defina as porcentagens
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Necess.</label>
                        <div className="relative">
                             <input 
                                type="number" 
                                value={customNeeds}
                                onChange={e => setCustomNeeds(Number(e.target.value))}
                                className="w-full pl-2 pr-6 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-1 focus:ring-primary-500 outline-none"
                             />
                             <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Desejos</label>
                        <div className="relative">
                             <input 
                                type="number" 
                                value={customWants}
                                onChange={e => setCustomWants(Number(e.target.value))}
                                className="w-full pl-2 pr-6 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-1 focus:ring-primary-500 outline-none"
                             />
                             <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Objetivos</label>
                        <div className="relative">
                             <input 
                                type="number" 
                                value={customSavings}
                                onChange={e => setCustomSavings(Number(e.target.value))}
                                className="w-full pl-2 pr-6 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-sm font-bold focus:ring-1 focus:ring-primary-500 outline-none"
                             />
                             <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                        </div>
                    </div>
                </div>
                {totalCustom !== 100 && (
                    <p className="text-[10px] text-red-500 mt-2 font-bold text-center">
                        Atenção: A soma atual é {totalCustom}%. O ideal é 100%.
                    </p>
                )}
                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={handleSaveCustomBudget}
                        disabled={totalCustom !== 100}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Salvar Modelo
                    </button>
                </div>
            </div>
        )}

        <div className="flex-1 flex flex-col justify-center">
            {monthlyIncome === 0 ? (
                <div className="text-center p-4 bg-amber-50 rounded-xl text-amber-700 text-sm">
                    Adicione receitas neste mês para visualizar a análise de orçamento.
                </div>
            ) : (
                <>
                    {renderBudgetBar(
                        "Necessidades", 
                        needsTotal, 
                        modelConfig.needs, 
                        "Moradia, Alimentação, Saúde..."
                    )}
                    {renderBudgetBar(
                        "Estilo de Vida", 
                        wantsTotal, 
                        modelConfig.wants, 
                        "Lazer, Compras, Streaming..."
                    )}
                    {renderBudgetBar(
                        "Objetivos", 
                        savingsTotal, 
                        modelConfig.savings, 
                        "Investimentos, Dívidas..."
                    )}
                </>
            )}
        </div>
      </div>

      {/* Expenses Breakdown Pie Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Despesas por Categoria</h3>
        <div className="h-64 w-full">
          {expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              Sem despesas registradas
            </div>
          )}
        </div>
      </div>
    </div>
  );
};