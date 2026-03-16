import React, { useState } from 'react';
import { Plus, Trash2, CreditCard, AlertCircle, Wallet, TrendingUp, DollarSign, ArrowLeft, Calendar, Layers, Pencil, X, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { CreditCard as CreditCardType, Transaction, TransactionType, CategoryOption, Bill } from '../types';
import { COLOR_PALETTE, DEFAULT_CATEGORIES } from '../constants';
import { TransactionList } from './TransactionList';
import { TransactionForm } from './TransactionForm';

interface CreditCardManagerProps {
  cards: CreditCardType[];
  transactions: Transaction[];
  categories: CategoryOption[];
  bills: Bill[];
  onAddCard: (card: Omit<CreditCardType, 'id'>) => void;
  onUpdateCard: (card: CreditCardType) => void;
  onDeleteCard: (id: string) => void;
  onAddTransaction: (transactions: Omit<Transaction, 'id'>[]) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddBill: (bill: Omit<Bill, 'id' | 'isPaid'>) => void;
  onEditBill: (bill: Bill) => void;
}

export const CreditCardManager: React.FC<CreditCardManagerProps> = ({ 
  cards, transactions, categories, bills, 
  onAddCard, onUpdateCard, onDeleteCard, 
  onAddTransaction, onEditTransaction, onDeleteTransaction,
  onAddBill, onEditBill
}) => {
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [error, setError] = useState<string | null>(null);
  
  // State for detail view
  const [selectedCard, setSelectedCard] = useState<CreditCardType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  
  // Invoice state
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [editedInvoiceAmount, setEditedInvoiceAmount] = useState('');

  React.useEffect(() => {
    setInvoiceDate(new Date());
    setIsEditingInvoice(false);
  }, [selectedCard?.id]);

  // Edit State
  const [editName, setEditName] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [editClosingDay, setEditClosingDay] = useState('');
  const [editDueDay, setEditDueDay] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !limit || !closingDay || !dueDay) {
        setError("Preencha todos os campos.");
        return;
    }

    const cDay = parseInt(closingDay);
    const dDay = parseInt(dueDay);

    onAddCard({
      name,
      limit: parseFloat(limit),
      closingDay: cDay,
      dueDay: dDay,
      color: selectedColor
    });

    setName('');
    setLimit('');
    setClosingDay('');
    setDueDay('');
    setSelectedColor(COLOR_PALETTE[0]);
    setIsAddingCard(false);
  };

  const startEditing = (card: CreditCardType) => {
      setEditName(card.name);
      setEditLimit(card.limit.toString());
      setEditClosingDay(card.closingDay.toString());
      setEditDueDay(card.dueDay.toString());
      setEditColor(card.color);
      setIsEditing(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedCard) return;
      
      const updatedCard = {
          ...selectedCard,
          name: editName,
          limit: parseFloat(editLimit),
          closingDay: parseInt(editClosingDay),
          dueDay: parseInt(editDueDay),
          color: editColor
      };
      
      onUpdateCard(updatedCard);
      setSelectedCard(updatedCard); // Update local view
      setIsEditing(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Helper to get current month expenses for calculation
  const getMonthlyExpenses = (methodId?: string) => {
    const today = new Date();
    return transactions
      .filter(t => {
          const tDate = new Date(t.date);
          const isSameMonth = tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
          const isExpense = t.type === TransactionType.EXPENSE;
          const isMethod = methodId ? t.paymentMethodId === methodId : (t.paymentMethodId && t.paymentMethodId !== 'cash');
          return isSameMonth && isExpense && isMethod;
      })
      .reduce((acc, t) => acc + t.amount, 0);
  };

  // Global Dashboard Calculations
  const totalLimit = cards.reduce((acc, card) => acc + card.limit, 0);
  const totalSpentGlobal = getMonthlyExpenses();
  const totalAvailable = totalLimit - totalSpentGlobal;

  // Global card transactions
  const globalCardTransactions = transactions.filter(t => cards.some(c => c.id === t.paymentMethodId));
  globalCardTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- DETAIL VIEW RENDER ---
  if (selectedCard) {
    const invoiceMonth = invoiceDate.getMonth();
    const invoiceYear = invoiceDate.getFullYear();

    const getInvoicePeriod = (card: CreditCardType, date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        // Fatura fecha no dia `closingDay`. 
        // Gastos do dia `closingDay + 1` do mês anterior até o dia `closingDay` deste mês
        // entram na fatura deste mês.
        const endDate = new Date(year, month, card.closingDay);
        const startDate = new Date(year, month - 1, card.closingDay + 1);
        
        return { startDate, endDate };
    };

    const { startDate, endDate } = getInvoicePeriod(selectedCard, invoiceDate);

    const formatDateStr = (d: Date) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const startStr = formatDateStr(startDate);
    const endStr = formatDateStr(endDate);
    
    const cardTransactions = transactions.filter(t => {
        if (t.paymentMethodId !== selectedCard.id) return false;
        return t.date >= startStr && t.date <= endStr;
    });
    cardTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const calculatedInvoiceAmount = cardTransactions.reduce((acc, t) => acc + t.amount, 0);
    
    const dueMonth = selectedCard.dueDay < selectedCard.closingDay ? invoiceMonth + 1 : invoiceMonth;
    const dueYear = dueMonth > 11 ? invoiceYear + 1 : invoiceYear;
    const actualDueMonth = dueMonth % 12;
    
    const expectedDueDateStr = `${dueYear}-${String(actualDueMonth + 1).padStart(2, '0')}-${String(selectedCard.dueDay).padStart(2, '0')}`;
    
    const existingBill = bills.find(b => 
        b.paymentMethodId === selectedCard.id && 
        b.dueDate === expectedDueDateStr
    );

    const displayInvoiceAmount = existingBill ? existingBill.amount : calculatedInvoiceAmount;
    
    // For the global available limit, we should probably use the total unpaid or just the standard getMonthlyExpenses.
    // Let's keep the available limit based on the current month expenses to not break existing logic,
    // or we can just use the calculatedInvoiceAmount.
    const cardSpent = getMonthlyExpenses(selectedCard.id);
    const cardAvailable = selectedCard.limit - cardSpent;

    const handlePrevMonth = () => {
        setInvoiceDate(new Date(invoiceYear, invoiceMonth - 1, 1));
    };

    const handleNextMonth = () => {
        setInvoiceDate(new Date(invoiceYear, invoiceMonth + 1, 1));
    };

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const invoiceMonthName = `${monthNames[invoiceMonth]} ${invoiceYear}`;

    const handleSaveInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(editedInvoiceAmount);
        if (isNaN(amount)) return;

        if (existingBill) {
            onEditBill({
                ...existingBill,
                amount
            });
        } else {
            onAddBill({
                description: `Fatura ${selectedCard.name} - ${invoiceMonthName}`,
                amount,
                dueDate: expectedDueDateStr,
                notifyDaysBefore: 3,
                recurrence: 'none',
                paymentMethodId: selectedCard.id,
                category: 'Cartão de Crédito'
            });
        }
        setIsEditingInvoice(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                     <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Editar Cartão</h3>
                            <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome do Cartão</label>
                                <input
                                    type="text"
                                    required
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Limite (R$)</label>
                                <input
                                    type="number"
                                    required
                                    value={editLimit}
                                    onChange={(e) => setEditLimit(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data de fechamento</label>
                                    <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    required
                                    value={editClosingDay}
                                    onChange={(e) => setEditClosingDay(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data de vencimento</label>
                                    <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    required
                                    value={editDueDay}
                                    onChange={(e) => setEditDueDay(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Cor:</p>
                                <div className="flex flex-wrap gap-2">
                                    {COLOR_PALETTE.map(color => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setEditColor(color)}
                                            className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${editColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-slate-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <Check size={16} /> Salvar Alterações
                            </button>
                        </form>
                     </div>
                </div>
            )}

            <button 
                onClick={() => setSelectedCard(null)}
                className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-white font-bold transition-colors mb-4"
            >
                <ArrowLeft size={20} /> Voltar para cartões
            </button>

            {/* Header Card */}
            <div 
                className="w-full rounded-3xl p-6 md:p-8 shadow-xl text-white relative overflow-hidden flex flex-col justify-between min-h-[200px] md:min-h-[220px]"
                style={{ backgroundColor: selectedCard.color }}
            >
                {/* Dark Overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/50 pointer-events-none"></div>
                
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-white/80 font-bold uppercase tracking-wider text-xs md:text-sm mb-1">Cartão de Crédito</p>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{selectedCard.name}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                         <button 
                            onClick={(e) => { e.stopPropagation(); startEditing(selectedCard); }}
                            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors backdrop-blur-sm"
                            title="Editar Cartão"
                        >
                            <Pencil size={20} />
                        </button>
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if(confirm('Tem certeza que deseja excluir este cartão?')) {
                                    onDeleteCard(selectedCard.id);
                                    setSelectedCard(null);
                                }
                            }}
                            className="p-2 bg-white/20 hover:bg-red-500 text-white rounded-lg transition-colors backdrop-blur-sm"
                            title="Excluir Cartão"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mt-6 md:mt-8">
                     <div>
                         <p className="text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Limite Total</p>
                         <div className="flex items-center gap-2">
                            <p className="text-lg md:text-xl font-bold">{formatCurrency(selectedCard.limit)}</p>
                         </div>
                     </div>
                     <div>
                         <div className="flex items-center gap-1 mb-1">
                             <button onClick={handlePrevMonth} className="p-1 hover:bg-white/20 rounded-full transition-colors"><ChevronLeft size={14} /></button>
                             <p className="text-[10px] md:text-xs font-bold text-white/90 uppercase tracking-wider">Fatura {invoiceMonthName}</p>
                             <button onClick={handleNextMonth} className="p-1 hover:bg-white/20 rounded-full transition-colors"><ChevronRight size={14} /></button>
                         </div>
                         {isEditingInvoice ? (
                             <form onSubmit={handleSaveInvoice} className="flex items-center gap-2">
                                 <input 
                                     type="number" 
                                     step="0.01"
                                     value={editedInvoiceAmount}
                                     onChange={(e) => setEditedInvoiceAmount(e.target.value)}
                                     className="w-24 px-2 py-1 text-slate-900 rounded text-sm outline-none"
                                     autoFocus
                                 />
                                 <button type="submit" className="p-1 bg-green-500 rounded text-white hover:bg-green-600 transition-colors"><Check size={14} /></button>
                                 <button type="button" onClick={() => setIsEditingInvoice(false)} className="p-1 bg-slate-500 rounded text-white hover:bg-slate-600 transition-colors"><X size={14} /></button>
                             </form>
                         ) : (
                             <div className="flex items-center gap-2">
                                 <p className="text-lg md:text-xl font-bold">{formatCurrency(displayInvoiceAmount)}</p>
                                 <button onClick={() => { setEditedInvoiceAmount(displayInvoiceAmount.toString()); setIsEditingInvoice(true); }} className="p-1.5 hover:bg-white/20 rounded-full transition-colors" title="Editar Fatura">
                                     <Pencil size={14} />
                                 </button>
                             </div>
                         )}
                     </div>
                     <div className="col-span-2 md:col-span-1">
                         <p className="text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Disponível</p>
                         <div className="flex items-center gap-2">
                             <p className={`text-lg md:text-xl font-bold ${cardSpent > selectedCard.limit * 0.8 ? 'text-red-300' : 'text-white'}`}>{formatCurrency(cardAvailable)}</p>
                             {cardSpent > selectedCard.limit * 0.8 && <AlertCircle size={16} className="text-red-300" title="Gasto excedeu 80% do limite" />}
                         </div>
                     </div>
                </div>
                
                <div className="relative z-10 flex justify-between items-end mt-6 border-t border-white/20 pt-4">
                    <div className="flex gap-4 md:gap-6">
                        <div>
                            <p className="text-[10px] text-white/70 uppercase">Fechamento</p>
                            <p className="font-bold">Dia {selectedCard.closingDay}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/70 uppercase">Vencimento</p>
                            <p className="font-bold">Dia {selectedCard.dueDay}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/70 uppercase">Melhor Dia</p>
                            <p className="font-bold text-green-300">Dia {selectedCard.closingDay === 31 ? 1 : selectedCard.closingDay + 1}</p>
                        </div>
                    </div>
                    <CreditCard size={32} className="text-white/60 hidden md:block" />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="flex items-center gap-2">
                        <Layers className="text-primary-600" size={24} />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Histórico de Transações</h3>
                    </div>
                    <button
                        onClick={() => setIsAddingTransaction(true)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} /> Adicionar gasto
                    </button>
                </div>
                
                {isAddingTransaction && (
                    <div className="mb-6 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <TransactionForm
                            onAdd={(transactions) => {
                                const newTransactions = transactions.map(t => ({
                                    ...t,
                                    paymentMethodId: selectedCard.id,
                                    type: TransactionType.EXPENSE // Force expense
                                }));
                                onAddTransaction(newTransactions);
                                setIsAddingTransaction(false);
                            }}
                            onClose={() => setIsAddingTransaction(false)}
                            categories={categories}
                            creditCards={cards}
                            fixedPaymentMethodId={selectedCard.id}
                        />
                    </div>
                )}

                {cardTransactions.length > 0 ? (
                    <TransactionList 
                        transactions={cardTransactions}
                        onDelete={onDeleteTransaction}
                        onEdit={onEditTransaction}
                        categories={categories}
                        creditCards={cards}
                        hidePaymentMethodFilter={true}
                    />
                ) : (
                    <div className="text-center py-10 text-slate-400">
                        Nenhuma transação registrada neste cartão.
                    </div>
                )}
            </div>
        </div>
    );
  }

  // --- LIST / DASHBOARD RENDER ---
  return (
    <div className="space-y-6">
      
      {/* Dashboard Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <CreditCard size={24} />
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Limite Total</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(totalLimit)}</p>
              </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <TrendingUp size={24} />
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gastos (Mês Atual)</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(totalSpentGlobal)}</p>
              </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <Wallet size={24} />
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disponível Total</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(totalAvailable)}</p>
              </div>
          </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <CreditCard className="text-primary-600" size={20} />
            Meus Cartões
            </h3>
            {!isAddingCard && (
                <button
                    onClick={() => setIsAddingCard(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={16} /> Adicionar novo cartão
                </button>
            )}
        </div>
        
        <div className={`p-4 md:p-6 grid grid-cols-1 ${isAddingCard ? 'lg:grid-cols-2' : ''} gap-8`}>
            {/* Form */}
            {isAddingCard && (
                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 order-2 lg:order-1">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-slate-800 dark:text-white">Novo Cartão</h4>
                    <button onClick={() => setIsAddingCard(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg flex items-center gap-2 border border-red-100">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome do Cartão</label>
                <input
                    type="text"
                    required
                    placeholder="Ex: Nubank, Visa Platinum"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                />
                </div>
                
                <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Limite (R$)</label>
                <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                />
                </div>

                <div className="flex gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data de fechamento</label>
                    <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    placeholder="Dia"
                    value={closingDay}
                    onChange={(e) => setClosingDay(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Data de vencimento</label>
                    <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    placeholder="Dia"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-indigo-500"
                    />
                </div>
                </div>

                <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Cor:</p>
                    <div className="flex flex-wrap gap-2">
                        {COLOR_PALETTE.map(color => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setSelectedColor(color)}
                                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                <button
                type="submit"
                className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                <Plus size={16} /> Adicionar Cartão
                </button>
            </form>
            </div>
            )}

            {/* List */}
            <div className={`space-y-4 ${isAddingCard ? 'order-1 lg:order-2' : ''}`}>
            {cards.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm italic py-8">
                    Nenhum cartão cadastrado.
                </div>
            ) : (
                cards.map(card => {
                   // Calculate simplified stats for card preview
                   const cardSpent = getMonthlyExpenses(card.id);
                   const available = card.limit - cardSpent;

                   return (
                   <div 
                        key={card.id} 
                        onClick={() => setSelectedCard(card)}
                        className="relative overflow-hidden rounded-2xl p-5 md:p-6 shadow-lg cursor-pointer transition-transform hover:scale-[1.02] text-white group"
                        style={{ backgroundColor: card.color }}
                   >
                        {/* Dark Overlay for Text Readability - Predominant Color remains visible */}
                        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/40 pointer-events-none"></div>
                        
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h3 className="font-bold text-lg md:text-xl mb-1 drop-shadow-sm">{card.name}</h3>
                                <p className="text-xs text-white/90 font-medium">Limite: {formatCurrency(card.limit)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <CreditCard size={24} className="text-white/80 md:w-7 md:h-7" />
                            </div>
                        </div>

                        <div className="mt-5 md:mt-6 flex justify-between items-end relative z-10">
                             <div>
                                 <p className="text-[10px] text-white/80 uppercase tracking-wider font-bold">Disponível</p>
                                 <div className="flex items-center gap-2">
                                     <p className={`font-bold text-base md:text-lg drop-shadow-sm ${cardSpent > card.limit * 0.8 ? 'text-red-300' : ''}`}>{formatCurrency(available)}</p>
                                     {cardSpent > card.limit * 0.8 && <AlertCircle size={14} className="text-red-300" title="Gasto excedeu 80% do limite" />}
                                 </div>
                             </div>
                             <div className="text-right">
                                 <p className="text-[10px] text-white/80 uppercase tracking-wider font-bold">Melhor Dia</p>
                                 <p className="font-medium text-green-300">Dia {card.closingDay === 31 ? 1 : card.closingDay + 1}</p>
                             </div>
                             <div className="text-right">
                                 <p className="text-[10px] text-white/80 uppercase tracking-wider font-bold">Fechamento</p>
                                 <p className="font-medium">Dia {card.closingDay}</p>
                             </div>
                        </div>
                   </div>
               )})
            )}
            </div>
        </div>
      </div>

      {/* Global Transaction History */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4 md:mb-6">
              <Layers className="text-primary-600" size={24} />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Histórico de Transações (Todos os Cartões)</h3>
          </div>
          
          {globalCardTransactions.length > 0 ? (
              <TransactionList 
                  transactions={globalCardTransactions}
                  onDelete={onDeleteTransaction}
                  onEdit={onEditTransaction}
                  categories={categories}
                  creditCards={cards}
              />
          ) : (
              <div className="text-center py-10 text-slate-400">
                  Nenhuma transação registrada em cartões de crédito.
              </div>
          )}
      </div>
    </div>
  );
};