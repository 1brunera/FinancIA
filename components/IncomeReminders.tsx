import React, { useState } from 'react';
import { Plus, Check, Trash2, Calendar as CalendarIcon, List, Repeat, X, ArrowUpCircle } from 'lucide-react';
import { IncomeReminder, RecurrenceType, CategoryOption } from '../types';
import { INCOME_CATEGORIES } from '../constants';

interface IncomeRemindersProps {
  incomes: IncomeReminder[];
  onAddIncome: (income: Omit<IncomeReminder, 'id' | 'isReceived'>) => void;
  onEditIncome?: (income: IncomeReminder) => void;
  onReceiveIncome: (id: string) => void;
  onDeleteIncome: (id: string) => void;
  categories: CategoryOption[];
}

export const IncomeReminders: React.FC<IncomeRemindersProps> = ({ incomes, onAddIncome, onEditIncome, onReceiveIncome, onDeleteIncome, categories }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'received'>('pending');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month' | 'year'>('all');
  
  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [category, setCategory] = useState(INCOME_CATEGORIES[0].id);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const incomeCategories = [
      ...INCOME_CATEGORIES,
      ...categories.filter(c => c.isCustom && c.budgetGroup === 'none') // Assuming 'none' budget group is usually income or general
  ];

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const openEditModal = (income: IncomeReminder) => {
    setDescription(income.description);
    setAmount(income.amount.toString());
    setDueDate(income.dueDate);
    setRecurrence(income.recurrence);
    setCategory(income.category || INCOME_CATEGORIES[0].id);
    setEditingIncomeId(income.id);
    setIsAddModalOpen(true);
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDueDate('');
    setRecurrence('none');
    setCategory(INCOME_CATEGORIES[0].id);
    setEditingIncomeId(null);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !dueDate) return;

    if (editingIncomeId && onEditIncome) {
        const incomeToEdit = incomes.find(i => i.id === editingIncomeId);
        if (incomeToEdit) {
            onEditIncome({
                ...incomeToEdit,
                description,
                amount: parseFloat(amount),
                dueDate,
                recurrence,
                category,
            });
        }
    } else {
        onAddIncome({
          description,
          amount: parseFloat(amount),
          dueDate,
          recurrence,
          category,
        });
    }

    handleCloseModal();
  };

  const getDaysDiff = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getRecurrenceLabel = (type: RecurrenceType) => {
    switch (type) {
        case 'monthly': return 'Mensal';
        case 'yearly': return 'Anual';
        default: return 'Única';
    }
  };

  const filteredIncomes = incomes
    .filter(inc => {
        // Status Filter
        if (filterStatus === 'received' && !inc.isReceived) return false;
        if (filterStatus === 'pending' && inc.isReceived) return false;
        
        // Period Filter
        if (periodFilter !== 'all') {
            const due = new Date(inc.dueDate);
            due.setHours(0,0,0,0);
            const today = new Date();
            today.setHours(0,0,0,0);
            
            if (periodFilter === 'week') {
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                if (due < today || due > nextWeek) return false;
            } else if (periodFilter === 'month') {
                if (due.getMonth() !== today.getMonth() || due.getFullYear() !== today.getFullYear()) return false;
            } else if (periodFilter === 'year') {
                if (due.getFullYear() !== today.getFullYear()) return false;
            }
        }

        return true;
    })
    .sort((a, b) => {
        if (a.isReceived === b.isReceived) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return a.isReceived ? 1 : -1;
    });

  // --- Calendar Helpers ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800" />);
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
        const currentDateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d).toISOString().split('T')[0];
        const incomesForDay = filteredIncomes.filter(i => i.dueDate === currentDateStr);
        
        days.push(
            <div key={d} className="h-24 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1 relative hover:bg-slate-50 dark:bg-slate-950 transition-colors group">
                <span className="text-xs font-semibold text-slate-400 absolute top-1 left-2">{d}</span>
                <div className="mt-4 space-y-1 overflow-y-auto max-h-[calc(100%-1rem)]">
                    {incomesForDay.map(inc => (
                        <div 
                            key={inc.id} 
                            className={`text-[10px] px-1 py-0.5 rounded truncate ${
                                inc.isReceived ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 line-through opacity-70' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium border border-green-100 dark:border-green-800'
                            }`}
                            title={`${inc.description} - ${formatCurrency(inc.amount)}`}
                        >
                            {inc.description}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-700">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-200 rounded text-slate-600 dark:text-slate-300">&lt;</button>
                <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">
                    {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-200 rounded text-slate-600 dark:text-slate-300">&gt;</button>
            </div>
            <div className="grid grid-cols-7 text-center bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 py-3 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wide">
                <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
            </div>
            <div className="grid grid-cols-7">
                {days}
            </div>
        </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-8">
      {/* Header with Controls */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col xl:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
             <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <ArrowUpCircle size={24} />
             </div>
             <h3 className="text-lg font-bold text-slate-800 dark:text-white">
               Contas a Receber
             </h3>
        </div>
        
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center justify-center">
                 {/* Period Selector */}
                 <select 
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value as any)}
                    className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold py-2 px-3 rounded-xl border-none outline-none cursor-pointer hover:bg-slate-200 transition-colors"
                 >
                    <option value="all">Todo Período</option>
                    <option value="week">Próx. 7 dias</option>
                    <option value="month">Este Mês</option>
                    <option value="year">Este Ano</option>
                 </select>

                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
                     <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterStatus === 'all' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                     >
                        Todas
                     </button>
                     <button
                        onClick={() => setFilterStatus('pending')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterStatus === 'pending' ? 'bg-white dark:bg-slate-900 shadow-sm text-amber-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                     >
                        Pendentes
                     </button>
                     <button
                        onClick={() => setFilterStatus('received')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterStatus === 'received' ? 'bg-white dark:bg-slate-900 shadow-sm text-green-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
                     >
                        Recebidas
                     </button>
                </div>
            </div>
            
            {/* View Toggle */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300'}`}
                    title="Lista"
                >
                    <List size={18} />
                </button>
                <button
                    onClick={() => setViewMode('calendar')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:text-slate-300'}`}
                    title="Calendário"
                >
                    <CalendarIcon size={18} />
                </button>
            </div>

            <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
            >
                <Plus size={18} /> Nova receita
            </button>
        </div>
      </div>

      {/* Add Income Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
             <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                <div className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 z-10">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingIncomeId ? 'Editar Recebimento' : 'Adicionar receita prevista'}</h3>
                    <button onClick={handleCloseModal} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descrição</label>
                        <input
                        type="text"
                        required
                        placeholder="Ex: Salário, Projeto X, Venda Y..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valor (R$)</label>
                        <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-bold text-lg"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categoria</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium text-sm"
                            >
                                {incomeCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                    {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recorrência</label>
                             <div className="relative">
                                <select
                                    value={recurrence}
                                    onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium text-sm appearance-none"
                                >
                                    <option value="none">Única</option>
                                    <option value="monthly">Mensal</option>
                                    <option value="yearly">Anual</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 dark:text-slate-400">
                                    <Repeat size={16} />
                                </div>
                             </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data Prevista</label>
                        <input
                        type="date"
                        required
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium text-sm"
                        />
                    </div>

                    <button
                    type="submit"
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                    >
                        <Plus size={20} />
                        {editingIncomeId ? 'Salvar Alterações' : 'Salvar'}
                    </button>
                </form>
             </div>
        </div>
      )}

      <div className="p-4 md:p-6 bg-slate-50/30">
        {viewMode === 'calendar' ? (
            renderCalendar()
        ) : (
            <div className="space-y-3">
                {filteredIncomes.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                    <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CalendarIcon size={24} className="opacity-50" />
                    </div>
                    <p className="font-medium">
                     {filterStatus === 'pending' ? "Você não tem recebimentos pendentes." : 
                     filterStatus === 'received' ? "Nenhum recebimento concluído encontrado." : "Nenhum recebimento cadastrado."}
                    </p>
                </div>
                ) : (
                filteredIncomes.map((inc) => {
                    const daysDiff = getDaysDiff(inc.dueDate);
                    const isLate = daysDiff < 0 && !inc.isReceived;
                    const isToday = daysDiff === 0 && !inc.isReceived;
                    
                    // Status Color Logic
                    const statusColorClass = inc.isReceived 
                        ? 'bg-green-500' 
                        : isLate 
                            ? 'bg-amber-500' 
                            : 'bg-green-300';

                    return (
                    <div key={inc.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all rounded-2xl border relative overflow-hidden group ${inc.isReceived ? 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800 opacity-80' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-green-200 hover:shadow-sm'}`}>
                        {/* Status Strip */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColorClass}`} />
                        
                        <div className="flex items-start gap-4 pl-3">
                            {/* Status Dropdown */}
                            <div className="pt-1">
                                <select
                                    value={inc.isReceived ? 'Recebido' : 'Pendente'}
                                    onChange={(e) => {
                                        if (e.target.value === 'Recebido' && !inc.isReceived) {
                                            onReceiveIncome(inc.id);
                                        }
                                        // Note: Currently no onUnreceiveIncome exists, so we only handle receiving
                                    }}
                                    className={`appearance-none px-2 py-1 rounded-full text-[10px] md:text-xs font-bold outline-none cursor-pointer border-2 transition-colors ${
                                        inc.isReceived 
                                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                                            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                                    }`}
                                >
                                    <option value="Pendente">Pendente</option>
                                    <option value="Recebido">Recebido</option>
                                </select>
                            </div>

                            <div className={`p-3 rounded-xl shrink-0 ${inc.isReceived ? 'bg-green-100 text-green-600' : isLate ? 'bg-amber-100 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                                {inc.recurrence !== 'none' ? <Repeat size={20} /> : <CalendarIcon size={20} />}
                            </div>
                            
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className={`font-bold text-base ${inc.isReceived ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>
                                        {inc.description}
                                    </p>
                                    {inc.isReceived && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">RECEBIDO</span>}
                                    {isLate && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">ATRASADO</span>}
                                    {isToday && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">HOJE</span>}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-3 text-xs">
                                    <span className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md font-medium flex items-center gap-1">
                                        <CalendarIcon size={12} />
                                        {new Date(inc.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </span>
                                    {inc.recurrence !== 'none' && (
                                        <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md font-bold flex items-center gap-1">
                                            <Repeat size={12} />
                                            {getRecurrenceLabel(inc.recurrence)}
                                        </span>
                                    )}
                                    {inc.category && (
                                        <span className="text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md font-medium flex items-center gap-1">
                                            {incomeCategories.find(c => c.id === inc.category)?.label || inc.category}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pl-14 sm:pl-0">
                            <div className="text-right">
                                <span className="text-xs text-slate-400 font-medium block uppercase tracking-wide">Valor</span>
                                <span className={`font-bold text-lg ${inc.isReceived ? 'text-slate-400' : 'text-green-600'}`}>
                                    {formatCurrency(inc.amount)}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2 pl-4 border-l border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => onDeleteIncome(inc.id)}
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                    );
                })
                )}
            </div>
        )}
      </div>
    </div>
  );
};