import React, { useState } from 'react';
import { Plus, Trash2, CreditCard, AlertCircle, Wallet, TrendingUp, DollarSign, ArrowLeft, Calendar, Layers, Pencil, X, Check } from 'lucide-react';
import { CreditCard as CreditCardType, Transaction, TransactionType } from '../types';
import { COLOR_PALETTE, DEFAULT_CATEGORIES } from '../constants';
import { TransactionList } from './TransactionList';

interface CreditCardManagerProps {
  cards: CreditCardType[];
  transactions: Transaction[];
  onAddCard: (card: Omit<CreditCardType, 'id'>) => void;
  onUpdateCard: (card: CreditCardType) => void;
  onDeleteCard: (id: string) => void;
}

export const CreditCardManager: React.FC<CreditCardManagerProps> = ({ cards, transactions, onAddCard, onUpdateCard, onDeleteCard }) => {
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [error, setError] = useState<string | null>(null);
  
  // State for detail view
  const [selectedCard, setSelectedCard] = useState<CreditCardType | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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

  // --- DETAIL VIEW RENDER ---
  if (selectedCard) {
    const cardSpent = getMonthlyExpenses(selectedCard.id);
    const cardAvailable = selectedCard.limit - cardSpent;
    
    // Filter transactions for this specific card
    const cardTransactions = transactions.filter(t => t.paymentMethodId === selectedCard.id);
    // Sort by date desc
    cardTransactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
                         <p className="text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Gasto (Mês)</p>
                         <p className="text-lg md:text-xl font-bold">{formatCurrency(cardSpent)}</p>
                     </div>
                     <div className="col-span-2 md:col-span-1">
                         <p className="text-[10px] md:text-xs font-bold text-white/70 uppercase tracking-wider mb-1">Disponível</p>
                         <p className="text-lg md:text-xl font-bold text-white">{formatCurrency(cardAvailable)}</p>
                     </div>
                </div>
                
                <div className="relative z-10 flex justify-between items-end mt-6 border-t border-white/20 pt-4">
                    <div className="flex gap-6">
                        <div>
                            <p className="text-[10px] text-white/70 uppercase">Fechamento</p>
                            <p className="font-bold">Dia {selectedCard.closingDay}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-white/70 uppercase">Vencimento</p>
                            <p className="font-bold">Dia {selectedCard.dueDay}</p>
                        </div>
                    </div>
                    <CreditCard size={32} className="text-white/60" />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                    <Layers className="text-primary-600" size={24} />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Histórico de Transações</h3>
                </div>
                
                {cardTransactions.length > 0 ? (
                    <TransactionList 
                        transactions={cardTransactions}
                        onDelete={() => {}} // Disable delete from here or implement bubbling
                        categories={DEFAULT_CATEGORIES} // Should pass actual categories if available
                        creditCards={cards}
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
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <CreditCard className="text-primary-600" size={20} />
            Meus Cartões
            </h3>
        </div>
        
        <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-xl border border-slate-200 dark:border-slate-700 order-2 lg:order-1">
            <h4 className="font-medium text-slate-800 dark:text-white mb-4">Novo Cartão</h4>
            
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

            {/* List */}
            <div className="space-y-4 order-1 lg:order-2">
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
                                 <p className="font-bold text-base md:text-lg drop-shadow-sm">{formatCurrency(available)}</p>
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
    </div>
  );
};