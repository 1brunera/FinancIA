import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  Target, 
  PieChart as PieChartIcon, 
  DollarSign, 
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  Wallet,
  X,
  Clock
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { Investment, InvestmentGoal, Transaction, TransactionType, InvestmentType } from '../types';

interface InvestmentsDashboardProps {
  investments: Investment[];
  goals: InvestmentGoal[];
  transactions: Transaction[];
  onAddInvestment: (inv: Investment) => void;
  onDeleteInvestment: (id: string) => void;
  onAddGoal: (goal: InvestmentGoal) => void;
  onDeleteGoal: (id: string) => void;
}

export const InvestmentsDashboard: React.FC<InvestmentsDashboardProps> = ({
  investments,
  goals,
  transactions,
  onAddInvestment,
  onDeleteInvestment,
  onAddGoal,
  onDeleteGoal
}) => {
  // --- States for interactivity ---
  const [emergencyMonths, setEmergencyMonths] = useState<3 | 6 | 12>(6);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);

  // --- Investment Form State ---
  const [invName, setInvName] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invType, setInvType] = useState<InvestmentType>('fixed');
  const [isLiquidity, setIsLiquidity] = useState(false);

  // --- Goal Form State ---
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  const handleInvSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!invName || !invAmount) return;

      onAddInvestment({
          id: crypto.randomUUID(),
          name: invName,
          amount: parseFloat(invAmount),
          type: invType,
          isLiquidity: isLiquidity
      });

      setInvName('');
      setInvAmount('');
      setInvType('fixed');
      setIsLiquidity(false);
      setIsInvModalOpen(false);
  };

  const handleGoalSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!goalName || !goalTarget || !goalDeadline) return;

      onAddGoal({
          id: crypto.randomUUID(),
          name: goalName,
          targetAmount: parseFloat(goalTarget),
          currentAmount: parseFloat(goalCurrent) || 0,
          deadline: goalDeadline
      });

      setGoalName('');
      setGoalTarget('');
      setGoalCurrent('');
      setGoalDeadline('');
      setIsGoalModalOpen(false);
  };

  // --- Logic: Emergency Fund ---
  // 1. Calculate Average Monthly Expense (Last 3 months to be realistic)
  const averageMonthlyExpense = useMemo(() => {
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);

      const recentExpenses = transactions.filter(t => 
          t.type === TransactionType.EXPENSE && new Date(t.date) >= threeMonthsAgo
      );

      const total = recentExpenses.reduce((acc, t) => acc + t.amount, 0);
      // Avoid division by zero, assume at least 1 month if data exists
      return total > 0 ? total / 3 : 0;
  }, [transactions]);

  // If no data, assume a baseline or show 0
  const safeAvgExpense = averageMonthlyExpense || 0;
  
  const liquidityTotal = investments
    .filter(inv => inv.isLiquidity)
    .reduce((acc, inv) => acc + inv.amount, 0);

  const emergencyTarget = safeAvgExpense * emergencyMonths;
  const emergencyProgress = emergencyTarget > 0 ? (liquidityTotal / emergencyTarget) * 100 : 0;
  const monthsCovered = safeAvgExpense > 0 ? (liquidityTotal / safeAvgExpense).toFixed(1) : "0";

  // --- Logic: Asset Allocation ---
  const allocationData = useMemo(() => {
      const groups = investments.reduce((acc, inv) => {
          const label = inv.type === 'fixed' ? 'Renda Fixa' : 
                        inv.type === 'stock' ? 'Ações' : 
                        inv.type === 'fii' ? 'FIIs' : 
                        inv.type === 'crypto' ? 'Cripto' : 
                        inv.type === 'foreign' ? 'Exterior' : 'Fundos';
          acc[label] = (acc[label] || 0) + inv.amount;
          return acc;
      }, {} as Record<string, number>);

      return Object.entries(groups).map(([name, value]) => ({ name, value }));
  }, [investments]);

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

  // --- Logic: Net Worth (Mocked History + Current) ---
  const totalAssets = investments.reduce((acc, inv) => acc + inv.amount, 0);
  const netWorth = totalAssets; 

  const netWorthHistory = [
      { month: 'Jan', value: netWorth * 0.85 },
      { month: 'Fev', value: netWorth * 0.88 },
      { month: 'Mar', value: netWorth * 0.92 },
      { month: 'Abr', value: netWorth * 0.95 },
      { month: 'Mai', value: netWorth * 0.98 },
      { month: 'Jun', value: netWorth },
  ];

  // --- Logic: Dividends Calendar ---
  const dividendTransactions = transactions
    .filter(t => t.type === TransactionType.INCOME && t.category === 'dividendos')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5); // Last 5

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getRemainingTime = (dateStr: string) => {
      const deadline = new Date(dateStr);
      const now = new Date();
      const diffTime = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Vencido';
      if (diffDays < 30) return `${diffDays} dias`;
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
        {/* Modals */}
        {isInvModalOpen && (
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                    <div className="px-6 py-5 bg-white border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">Novo Investimento</h3>
                        <button onClick={() => setIsInvModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleInvSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome do Ativo</label>
                            <input 
                                type="text" 
                                required 
                                placeholder="Ex: CDB Nubank, PETR4..."
                                value={invName}
                                onChange={e => setInvName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valor Atual (R$)</label>
                             <input 
                                type="number" 
                                required 
                                placeholder="0.00"
                                value={invAmount}
                                onChange={e => setInvAmount(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoria</label>
                            <select 
                                value={invType}
                                onChange={e => setInvType(e.target.value as InvestmentType)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            >
                                <option value="fixed">Renda Fixa</option>
                                <option value="stock">Ações</option>
                                <option value="fii">FIIs (Fundos Imobiliários)</option>
                                <option value="crypto">Criptomoedas</option>
                                <option value="foreign">Exterior</option>
                                <option value="fund">Fundos de Investimento</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                             <input 
                                type="checkbox"
                                id="isLiquidity"
                                checked={isLiquidity}
                                onChange={e => setIsLiquidity(e.target.checked)}
                                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                             />
                             <label htmlFor="isLiquidity" className="text-sm text-slate-700 select-none">
                                 Este ativo tem liquidez diária?
                                 <span className="block text-xs text-slate-400 font-normal">Marque para contar na Reserva de Emergência.</span>
                             </label>
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                            Adicionar Investimento
                        </button>
                    </form>
                 </div>
             </div>
        )}

        {isGoalModalOpen && (
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                 <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                    <div className="px-6 py-5 bg-white border-b border-slate-100 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-800">Nova Meta / Sonho</h3>
                        <button onClick={() => setIsGoalModalOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleGoalSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome do Objetivo</label>
                            <input 
                                type="text" 
                                required 
                                placeholder="Ex: Viagem Disney, Casa Própria..."
                                value={goalName}
                                onChange={e => setGoalName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valor Meta (R$)</label>
                                <input 
                                    type="number" 
                                    required 
                                    placeholder="0.00"
                                    value={goalTarget}
                                    onChange={e => setGoalTarget(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Já guardado (R$)</label>
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    value={goalCurrent}
                                    onChange={e => setGoalCurrent(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prazo (Data)</label>
                             <input 
                                type="date"
                                required
                                value={goalDeadline}
                                onChange={e => setGoalDeadline(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                             />
                        </div>
                        <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">
                            Criar Meta
                        </button>
                    </form>
                 </div>
             </div>
        )}

        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Meus Investimentos</h2>
            <button 
                onClick={() => setIsInvModalOpen(true)}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
            >
                <Plus size={18} /> Adicionar Investimento
            </button>
        </div>
        
        {/* Top Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><TrendingUp size={64} /></div>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1">Patrimônio Investido</p>
                <h3 className="text-3xl font-bold">{formatCurrency(totalAssets)}</h3>
                <div className="mt-4 flex items-center gap-2 text-green-400 text-sm font-bold">
                    <TrendingUp size={16} /> +12% esse ano (simulado)
                </div>
            </div>

            {/* Smart Emergency Fund Widget */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm md:col-span-2">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Reserva de Emergência</h3>
                            <p className="text-xs text-slate-500">Baseado no seu custo de vida médio ({formatCurrency(safeAvgExpense)}/mês)</p>
                        </div>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {[3, 6, 12].map(m => (
                            <button
                                key={m}
                                onClick={() => setEmergencyMonths(m as any)}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${emergencyMonths === m ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                            >
                                {m} Meses
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-slate-600">Você tem: <strong className="text-slate-800">{formatCurrency(liquidityTotal)}</strong></span>
                        <span className="text-slate-400">Meta: {formatCurrency(emergencyTarget)}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${emergencyProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(emergencyProgress, 100)}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${emergencyProgress >= 100 ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                            {monthsCovered} meses garantidos
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                             <AlertTriangle size={12} />
                             Considerando apenas investimentos com liquidez diária
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Asset Allocation */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-1">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <PieChartIcon size={20} className="text-indigo-500" /> Alocação de Ativos
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={allocationData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {allocationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                {/* List of Investments (Small) */}
                <div className="mt-4 border-t border-slate-100 pt-4 space-y-2 max-h-48 overflow-y-auto">
                    {investments.map(inv => (
                        <div key={inv.id} className="flex justify-between items-center text-xs">
                             <div className="flex items-center gap-2">
                                 <button onClick={() => onDeleteInvestment(inv.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>
                                 <span className="text-slate-700 font-medium truncate max-w-[120px]" title={inv.name}>{inv.name}</span>
                             </div>
                             <span className="font-bold text-slate-600">{formatCurrency(inv.amount)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Net Worth Evolution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
                 <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-500" /> Evolução Patrimonial
                </h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={netWorthHistory}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `R$${val/1000}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Goals & Dividends */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Goals (The "Bucket" Strategy) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                     <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Target size={20} className="text-red-500" /> Metas e Sonhos
                    </h3>
                    <button onClick={() => setIsGoalModalOpen(true)} className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors">
                        <Plus size={16} />
                    </button>
                </div>
                
                <div className="space-y-5">
                    {goals.map(goal => {
                        const progress = (goal.currentAmount / goal.targetAmount) * 100;
                        return (
                            <div key={goal.id} className="group relative">
                                <button onClick={() => onDeleteGoal(goal.id)} className="absolute -right-2 -top-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={12} />
                                </button>
                                <div className="flex justify-between items-end mb-1">
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">{goal.name}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                            <span>Prazo: {new Date(goal.deadline).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-0.5 bg-slate-50 px-1 rounded text-slate-500">
                                                <Clock size={8} /> {getRemainingTime(goal.deadline)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-indigo-600 text-sm">{formatCurrency(goal.currentAmount)}</span>
                                        <span className="text-[10px] text-slate-400 block">de {formatCurrency(goal.targetAmount)}</span>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )
                    })}
                    {goals.length === 0 && <p className="text-sm text-slate-400 italic">Nenhuma meta definida.</p>}
                </div>
            </div>

            {/* Dividend Calendar */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                 <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <DollarSign size={20} className="text-yellow-500" /> Últimos Proventos
                </h3>

                <div className="space-y-3">
                    {dividendTransactions.length > 0 ? (
                        dividendTransactions.map(div => (
                            <div key={div.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-lg text-yellow-600 shadow-sm">
                                        <Wallet size={16} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">{div.description}</p>
                                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <Calendar size={10} /> {new Date(div.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className="font-bold text-green-600 text-sm">+{formatCurrency(div.amount)}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            Nenhum dividendo recebido recentemente.
                            <br/><span className="text-xs">Classifique receitas como 'Dividendos' para ver aqui.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};