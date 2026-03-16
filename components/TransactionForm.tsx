import React, { useState, useEffect } from 'react';
import { Plus, X, CreditCard as CardIcon, Banknote, Calendar, CheckCircle2 } from 'lucide-react';
import { Transaction, TransactionType, CategoryOption, CreditCard, TransactionStatus } from '../types';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';

interface TransactionFormProps {
  initialData?: Transaction;
  onAdd: (transactions: Omit<Transaction, 'id'>[]) => void;
  onEdit?: (transaction: Transaction) => void;
  onClose: () => void;
  categories: CategoryOption[];
  creditCards: CreditCard[];
  fixedPaymentMethodId?: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ initialData, onAdd, onEdit, onClose, categories, creditCards, fixedPaymentMethodId }) => {
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount.toString() || '');
  const [type, setType] = useState<TransactionType>(initialData?.type || TransactionType.EXPENSE);
  const [category, setCategory] = useState(initialData?.category || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [paymentMethodId, setPaymentMethodId] = useState(fixedPaymentMethodId || initialData?.paymentMethodId || 'cash');
  const [status, setStatus] = useState<TransactionStatus>(initialData?.status || 'Pendente');
  
  // Installment / Recurrence State
  const [paymentType, setPaymentType] = useState<'avista' | 'parcelado' | 'recorrente'>('avista');
  const [installments, setInstallments] = useState(2);
  const [recurrenceMonths, setRecurrenceMonths] = useState(12);

  // Filter categories based on type
  const availableCategories = type === TransactionType.INCOME 
    ? INCOME_CATEGORIES 
    : [...EXPENSE_CATEGORIES, ...categories.filter(c => c.isCustom)]; // Custom categories are usually expenses, or we could add a type to CategoryOption

  useEffect(() => {
      // Reset category when type changes, only if not editing or category is invalid
      if (!initialData && availableCategories.length > 0 && !availableCategories.find(c => c.id === category)) {
          setCategory(availableCategories[0].id);
      }
  }, [type, initialData, availableCategories, category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) return;

    const numAmount = parseFloat(amount);

    if (initialData && onEdit) {
        onEdit({
            ...initialData,
            description,
            amount: numAmount,
            type,
            category,
            date,
            paymentMethodId: type === TransactionType.EXPENSE ? paymentMethodId : undefined,
            status
        });
        onClose();
        return;
    }
    
    // Determine actual number of installments based on UI state
    const isCredit = type === TransactionType.EXPENSE && paymentMethodId !== 'cash';
    const finalInstallments = (isCredit && paymentType === 'parcelado') ? Math.max(2, installments) : 1;
    const isRecurring = (isCredit && paymentType === 'recorrente');
    const totalMonths = isRecurring ? Math.max(2, recurrenceMonths) : finalInstallments;
    
    const newTransactions: Omit<Transaction, 'id'>[] = [];
    const installmentGroupId = crypto.randomUUID();
    const installmentAmount = finalInstallments > 1 ? numAmount / finalInstallments : numAmount;

    for (let i = 0; i < totalMonths; i++) {
        const currentDate = new Date(date);
        // Add months for subsequent installments/recurrences
        currentDate.setMonth(currentDate.getMonth() + i);
        
        const dateStr = currentDate.toISOString().split('T')[0];

        let txDescription = description;
        if (finalInstallments > 1) {
            txDescription = `${description} (${i + 1} de ${finalInstallments})`;
        } else if (isRecurring) {
            txDescription = `${description} (Recorrente ${i + 1}/${totalMonths})`;
        }

        newTransactions.push({
            description: txDescription,
            amount: installmentAmount,
            type,
            category,
            date: dateStr,
            status: 'Pendente',
            paymentMethodId: type === TransactionType.EXPENSE ? paymentMethodId : undefined,
            installments: finalInstallments > 1 ? {
                current: i + 1,
                total: finalInstallments,
                id: installmentGroupId
            } : undefined
        });
    }

    onAdd(newTransactions);
    onClose();
  };

  const isCreditCard = type === TransactionType.EXPENSE && paymentMethodId !== 'cash';

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 md:px-6 md:py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 z-10">
          <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">{initialData ? 'Editar transação' : 'Nova transação'}</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-5 overflow-y-auto custom-scrollbar">
          {/* Type Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                type === TransactionType.EXPENSE ? 'bg-white dark:bg-slate-900 text-red-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
              }`}
            >
              <ArrowDownIcon className="w-4 h-4" /> Despesa
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.INCOME)}
              className={`flex-1 py-3 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                type === TransactionType.INCOME ? 'bg-white dark:bg-slate-900 text-green-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
              }`}
            >
              <ArrowUpIcon className="w-4 h-4" /> Receita
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Valor Total</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-primary-600 transition-colors text-lg">R$</span>
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-11 pr-4 py-3 md:py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-bold text-xl md:text-2xl text-slate-800 dark:text-white placeholder-slate-300"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descrição</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-medium text-sm md:text-base"
              placeholder={type === TransactionType.INCOME ? "Ex: Salário, Venda de serviço..." : "Ex: Supermercado, Aluguel..."}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Categoria</label>
                <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-xs md:text-sm font-medium text-slate-900 dark:text-white"
                >
                {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                    {cat.label}
                    </option>
                ))}
                </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data</label>
                <div className="relative">
                    <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-xs md:text-sm font-medium"
                    />
                </div>
            </div>
          </div>

          {/* Payment Method (Only for Expense) */}
          {type === TransactionType.EXPENSE && !fixedPaymentMethodId && (
            <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Forma de Pagamento</label>
                
                <div className="grid grid-cols-2 gap-3">
                    {/* Cash / Debit Option */}
                    <div 
                        onClick={() => setPaymentMethodId('cash')}
                        className={`relative p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                            paymentMethodId === 'cash' 
                                ? 'bg-green-50 border-green-500' 
                                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700'
                        }`}
                    >
                         {paymentMethodId === 'cash' && (
                             <div className="absolute top-2 right-2 text-green-600"><CheckCircle2 size={16} /></div>
                         )}
                         <div className={`p-2 rounded-full ${paymentMethodId === 'cash' ? 'bg-green-100 text-green-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            <Banknote size={20} className="md:w-6 md:h-6" />
                         </div>
                         <span className={`text-[10px] md:text-xs font-bold text-center ${paymentMethodId === 'cash' ? 'text-green-700' : 'text-slate-500 dark:text-slate-400'}`}>
                             Dinheiro / Débito
                         </span>
                    </div>

                    {/* Credit Cards Loop */}
                    {creditCards.map(card => (
                        <div 
                            key={card.id}
                            onClick={() => setPaymentMethodId(card.id)}
                            className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between h-24 md:h-28 overflow-hidden group ${
                                paymentMethodId === card.id 
                                    ? 'border-indigo-500 shadow-md' 
                                    : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                            }`}
                        >
                             {/* Card Background Color Strip */}
                             <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: card.color }} />
                             
                             {paymentMethodId === card.id && (
                                <div className="absolute top-2 right-2 text-indigo-600 bg-white dark:bg-slate-900 rounded-full"><CheckCircle2 size={16} /></div>
                             )}

                             <div className="mt-2">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Cartão</span>
                                <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-white leading-tight block truncate">{card.name}</span>
                             </div>

                             <div className="flex items-center gap-1 text-slate-400">
                                <CardIcon size={14} />
                                <span className="text-[10px]">Crédito</span>
                             </div>
                        </div>
                    ))}
                    
                    {/* Add Card Shortcut if none exist */}
                    {creditCards.length === 0 && (
                        <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-50 dark:bg-slate-950">
                            <span className="text-xs text-center">Nenhum cartão cadastrado</span>
                        </div>
                    )}
                </div>

                {/* Installments / Recurrence Logic (Only if Credit Card is selected and NOT editing) */}
                {!initialData && isCreditCard && (
                    <div className="animate-fade-in bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-4">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tipo de Pagamento</label>
                        
                        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                            <button
                                type="button"
                                onClick={() => setPaymentType('avista')}
                                className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${
                                    paymentType === 'avista' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'
                                }`}
                            >
                                À vista (1x)
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentType('parcelado')}
                                className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${
                                    paymentType === 'parcelado' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'
                                }`}
                            >
                                Parcelado
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentType('recorrente')}
                                className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${
                                    paymentType === 'recorrente' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'
                                }`}
                            >
                                Fixo/Recorrente
                            </button>
                        </div>

                        {paymentType === 'parcelado' && (
                            <div className="animate-fade-in">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Quantidade</span>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            type="button" 
                                            onClick={() => setInstallments(Math.max(2, installments - 1))}
                                            className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:bg-slate-800"
                                        >-</button>
                                        <span className="font-bold text-lg w-6 text-center">{installments}x</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setInstallments(Math.min(48, installments + 1))}
                                            className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:bg-slate-800"
                                        >+</button>
                                    </div>
                                </div>
                                
                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-100 flex justify-between items-center">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Valor por parcela:</span>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {formatCurrency(parseFloat(amount || '0') / installments)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {paymentType === 'recorrente' && (
                            <div className="animate-fade-in">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Duração (Meses)</span>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            type="button" 
                                            onClick={() => setRecurrenceMonths(Math.max(2, recurrenceMonths - 1))}
                                            className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:bg-slate-800"
                                        >-</button>
                                        <span className="font-bold text-lg w-8 text-center">{recurrenceMonths}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => setRecurrenceMonths(Math.min(120, recurrenceMonths + 1))}
                                            className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:bg-slate-800"
                                        >+</button>
                                    </div>
                                </div>
                                
                                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-indigo-100 flex justify-between items-center">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">Valor mensal:</span>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {formatCurrency(parseFloat(amount || '0'))}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 text-center">
                                    Serão criadas {recurrenceMonths} transações de {formatCurrency(parseFloat(amount || '0'))}.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-3 md:py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 dark:shadow-white/10 active:scale-[0.98] text-sm md:text-base"
          >
            <Plus size={20} />
            {initialData ? 'Salvar Alterações' : 'Confirmar Transação'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Icons for the toggle
const ArrowUpIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
);
const ArrowDownIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="m8 12 4 4 4-4"/></svg>
);