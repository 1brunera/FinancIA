import React, { useState } from 'react';
import { Trash2, ArrowUpCircle, ArrowDownCircle, CreditCard, Banknote } from 'lucide-react';
import { Transaction, TransactionType, CategoryOption, CreditCard as CreditCardType } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  categories: CategoryOption[];
  creditCards: CreditCardType[];
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, categories, creditCards }) => {
  const [filterPayment, setFilterPayment] = useState<string>('all');

  const getCategoryLabel = (id: string) => categories.find(c => c.id === id)?.label || id;
  const getCategoryColor = (id: string) => categories.find(c => c.id === id)?.color || '#94a3b8';

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getPaymentMethodDetails = (methodId?: string) => {
    if (!methodId || methodId === 'cash') {
      return { label: 'Dinheiro / Débito', color: '#22c55e', isCard: false };
    }
    const card = creditCards.find(c => c.id === methodId);
    return { 
      label: card ? card.name : 'Cartão desconhecido', 
      color: card ? card.color : '#64748b',
      isCard: true
    };
  };

  const filteredTransactions = transactions.filter(t => {
      if (filterPayment === 'all') return true;
      const tMethod = t.paymentMethodId || 'cash';
      
      // Filter for 'all_cards' (Anything that is not cash)
      if (filterPayment === 'all_cards') {
          return tMethod !== 'cash';
      }

      return tMethod === filterPayment;
  });

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💸</span>
        </div>
        <h3 className="text-lg font-medium text-slate-800">Nenhuma transação ainda</h3>
        <p className="text-slate-500">Adicione suas receitas e despesas para começar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden relative">
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2">
            <h3 className="text-base md:text-lg font-semibold text-slate-800">Histórico</h3>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
            {filteredTransactions.length} registros
            </span>
        </div>

        {/* Payment Method Filter */}
        <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
        >
            <option value="all">Todas as formas de pagto.</option>
            <option value="cash">Dinheiro / Débito</option>
            <option value="all_cards">Todos os cartões</option>
            {creditCards.map(card => (
                <option key={card.id} value={card.id}>Cartão: {card.name}</option>
            ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-4 py-3 md:px-6 whitespace-nowrap">Data</th>
              <th className="px-4 py-3 md:px-6 min-w-[140px]">Descrição</th>
              <th className="px-4 py-3 md:px-6">Categoria</th>
              <th className="px-4 py-3 md:px-6 min-w-[140px]">Pagamento</th>
              <th className="px-4 py-3 md:px-6">Status</th>
              <th className="px-4 py-3 md:px-6 text-right whitespace-nowrap">Valor</th>
              <th className="px-4 py-3 md:px-6 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500 italic">
                        Nenhuma transação encontrada com este filtro.
                    </td>
                </tr>
            ) : (
                filteredTransactions.map((t) => {
                const paymentInfo = getPaymentMethodDetails(t.paymentMethodId);
                
                return (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm text-slate-600 whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4">
                    <div className="flex items-center gap-2 md:gap-3">
                        {t.type === TransactionType.INCOME ? (
                        <ArrowUpCircle className="text-green-500 w-4 h-4 md:w-5 md:h-5 shrink-0" />
                        ) : (
                        <ArrowDownCircle className="text-red-500 w-4 h-4 md:w-5 md:h-5 shrink-0" />
                        )}
                        <div>
                            <span className="font-medium text-slate-800 block text-xs md:text-sm max-w-[150px] md:max-w-xs truncate" title={t.description}>
                                {t.description}
                            </span>
                            {t.installments && (
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] md:text-xs text-slate-400">
                                        Parcela {t.installments.current} de {t.installments.total}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4">
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap"
                        style={{
                        backgroundColor: `${getCategoryColor(t.category)}20`,
                        color: getCategoryColor(t.category)
                        }}
                    >
                        {getCategoryLabel(t.category)}
                    </span>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4">
                        {t.type === TransactionType.EXPENSE && (
                            <div className="flex items-center gap-1.5 text-xs md:text-sm text-slate-600">
                                {paymentInfo.isCard ? (
                                    <CreditCard size={14} style={{ color: paymentInfo.color }} />
                                ) : (
                                    <Banknote size={14} className="text-green-600" />
                                )}
                                <span className="whitespace-nowrap truncate max-w-[100px]" style={{ color: paymentInfo.isCard ? paymentInfo.color : undefined }}>
                                    {paymentInfo.label}
                                </span>
                            </div>
                        )}
                        {t.type === TransactionType.INCOME && <span className="text-slate-400 text-xs">-</span>}
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4">
                        {t.status && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap ${
                                t.status === 'Pago' || t.status === 'Recebido' ? 'bg-green-100 text-green-700' :
                                t.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                            }`}>
                                {t.status}
                            </span>
                        )}
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                    <span className={`font-semibold text-xs md:text-sm whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}
                    </span>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-center">
                    <button
                        onClick={() => onDelete(t.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1.5 md:p-2 hover:bg-red-50 rounded-full"
                        title="Excluir"
                    >
                        <Trash2 size={16} />
                    </button>
                    </td>
                </tr>
                )})
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};