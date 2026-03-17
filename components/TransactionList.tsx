import React, { useState } from 'react';
import { Trash2, ArrowUpCircle, ArrowDownCircle, CreditCard, Banknote, ChevronDown, Pencil } from 'lucide-react';
import { Transaction, TransactionType, CategoryOption, CreditCard as CreditCardType, TransactionStatus } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit?: (transaction: Transaction) => void;
  onUpdateStatus?: (id: string, status: TransactionStatus) => void;
  categories: CategoryOption[];
  creditCards: CreditCardType[];
  showValues?: boolean;
  hidePaymentMethodFilter?: boolean;
  showInstallmentFilter?: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, onEdit, onUpdateStatus, categories, creditCards, showValues = true, hidePaymentMethodFilter = false, showInstallmentFilter = false }) => {
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterInstallment, setFilterInstallment] = useState<string>('all');

  const getCategoryLabel = (id: string) => categories.find(c => c.id === id)?.label || id;
  const getCategoryColor = (id: string) => categories.find(c => c.id === id)?.color || '#94a3b8';

  const formatCurrency = (value: number) => {
    if (!showValues) return 'R$ •••••';
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
      let passPayment = true;
      if (filterPayment !== 'all') {
          const tMethod = t.paymentMethodId || 'cash';
          if (filterPayment === 'all_cards') {
              passPayment = tMethod !== 'cash';
          } else {
              passPayment = tMethod === filterPayment;
          }
      }

      let passInstallment = true;
      if (showInstallmentFilter && filterInstallment !== 'all') {
          if (filterInstallment === 'one_time') {
              passInstallment = !t.installments || t.installments.total === 1;
          } else if (filterInstallment === 'installment') {
              passInstallment = t.installments && t.installments.total > 1;
          }
      }

      return passPayment && passInstallment;
  });

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💸</span>
        </div>
        <h3 className="text-lg font-medium text-slate-800 dark:text-white">Nenhuma transação ainda</h3>
        <p className="text-slate-500 dark:text-slate-400">Adicione suas receitas e despesas para começar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden relative">
      <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <div className="flex items-center gap-2">
            <h3 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white">Histórico</h3>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
            {filteredTransactions.length} registros
            </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* Payment Method Filter */}
            {!hidePaymentMethodFilter && (
                <select
                    value={filterPayment}
                    onChange={(e) => setFilterPayment(e.target.value)}
                    className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-2 px-3 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                >
                    <option value="all">Todas as formas de pagto.</option>
                    <option value="cash">Dinheiro / Débito</option>
                    <option value="all_cards">Todos os cartões</option>
                    {creditCards.map(card => (
                        <option key={card.id} value={card.id}>Cartão: {card.name}</option>
                    ))}
                </select>
            )}

            {/* Installment Filter */}
            {showInstallmentFilter && (
                <select
                    value={filterInstallment}
                    onChange={(e) => setFilterInstallment(e.target.value)}
                    className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold py-2 px-3 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                >
                    <option value="all">Todos os tipos</option>
                    <option value="one_time">À vista</option>
                    <option value="installment">Parcelado</option>
                </select>
            )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
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
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 italic">
                        Nenhuma transação encontrada com este filtro.
                    </td>
                </tr>
            ) : (
                filteredTransactions.map((t) => {
                const paymentInfo = getPaymentMethodDetails(t.paymentMethodId);
                
                return (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 md:px-6 md:py-4 text-xs md:text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4">
                    <div className="flex items-center gap-2 md:gap-3">
                        {t.type === TransactionType.INCOME ? (
                        <ArrowUpCircle className="text-green-500 w-4 h-4 md:w-5 md:h-5 shrink-0" />
                        ) : (
                        <ArrowDownCircle className="text-red-500 w-4 h-4 md:w-5 md:h-5 shrink-0" />
                        )}
                        <div>
                            <span className="font-medium text-slate-800 dark:text-white block text-xs md:text-sm max-w-[150px] md:max-w-xs truncate" title={t.description}>
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
                            <div className="flex items-center gap-1.5 text-xs md:text-sm text-slate-600 dark:text-slate-300">
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
                        {t.status && onUpdateStatus ? (
                            <div className="relative inline-block w-full max-w-[120px]">
                                <select
                                    value={t.status}
                                    onChange={(e) => onUpdateStatus(t.id, e.target.value as TransactionStatus)}
                                    className={`appearance-none w-full px-2 py-1 pr-6 rounded-full text-[10px] md:text-xs font-bold outline-none cursor-pointer border-2 transition-colors ${
                                        t.status === 'Pago' || t.status === 'Recebido' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                                        t.status === 'Pendente' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' :
                                        'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                    }`}
                                >
                                    <option value="Pendente">Pendente</option>
                                    <option value="Pago">Pago</option>
                                    <option value="Recebido">Recebido</option>
                                    <option value="Cancelado">Cancelado</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                            </div>
                        ) : t.status ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium whitespace-nowrap ${
                                t.status === 'Pago' || t.status === 'Recebido' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                                t.status === 'Pendente' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                                {t.status}
                            </span>
                        ) : null}
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                    <span className={`font-semibold text-xs md:text-sm whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}
                    </span>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(t)}
                                    className="text-slate-400 hover:text-indigo-500 transition-colors p-1.5 md:p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full"
                                    title="Editar"
                                >
                                    <Pencil size={16} />
                                </button>
                            )}
                            <button
                                onClick={() => onDelete(t.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors p-1.5 md:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                                title="Excluir"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
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