import React, { useEffect, useState } from 'react';
import { Bell, X, Check, AlertCircle, Calendar } from 'lucide-react';
import { Bill } from '../types';

interface PushNotificationToastProps {
  bills: Bill[];
  onPayBill: (id: string) => void;
  onDismiss: () => void;
}

export const PushNotificationToast: React.FC<PushNotificationToastProps> = ({
  bills,
  onPayBill,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [activeBillIndex, setActiveBillIndex] = useState(0);

  if (!bills || bills.length === 0 || !isVisible) return null;

  const currentBill = bills[activeBillIndex] || bills[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(currentBill.dueDate + 'T00:00:00');
  dueDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getUrgencyBadge = () => {
    if (diffDays < 0) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white">VENCIDA HÁ {Math.abs(diffDays)} DIAS</span>;
    }
    if (diffDays === 0) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white animate-pulse">VENCE HOJE</span>;
    }
    if (diffDays === 1) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">VENCE AMANHÃ</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">VENCE EM 2 DIAS</span>;
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] animate-bounce-in shadow-2xl rounded-2xl overflow-hidden border border-amber-300 dark:border-amber-700/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-4 py-2.5 flex items-center justify-between text-white">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <span className="p-1 bg-white/20 rounded-lg backdrop-blur-xs">
            <Bell size={14} className="animate-wiggle" />
          </span>
          <span>Notificação Push • Contas a Pagar</span>
        </div>
        <div className="flex items-center gap-1.5">
          {bills.length > 1 && (
            <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-semibold">
              {activeBillIndex + 1} de {bills.length}
            </span>
          )}
          <button 
            onClick={() => {
              setIsVisible(false);
              onDismiss();
            }}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer text-white/90 hover:text-white"
            title="Fechar notificação"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-bold text-slate-800 dark:text-white text-base">
                {currentBill.description}
              </h4>
              {getUrgencyBadge()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar size={13} />
              Vencimento: <strong>{new Date(currentBill.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs text-slate-400 block font-medium">Valor</span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(currentBill.amount)}
            </span>
          </div>
        </div>

        {currentBill.customAlertMessage && (
          <div className="mb-3 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-medium">
            "{currentBill.customAlertMessage}"
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <div className="flex items-center gap-1">
            {bills.length > 1 && activeBillIndex > 0 && (
              <button
                onClick={() => setActiveBillIndex(prev => prev - 1)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Anterior
              </button>
            )}
            {bills.length > 1 && activeBillIndex < bills.length - 1 && (
              <button
                onClick={() => setActiveBillIndex(prev => prev + 1)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Próxima ({bills.length - activeBillIndex - 1})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                if (bills.length > 1 && activeBillIndex < bills.length - 1) {
                  setActiveBillIndex(prev => prev + 1);
                } else {
                  setIsVisible(false);
                  onDismiss();
                }
              }}
              className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Lembrar mais tarde
            </button>
            <button
              onClick={() => {
                onPayBill(currentBill.id);
                if (bills.length > 1) {
                  if (activeBillIndex >= bills.length - 1) {
                    setActiveBillIndex(Math.max(0, bills.length - 2));
                  }
                } else {
                  setIsVisible(false);
                }
              }}
              className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-3.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} /> Marcar como Pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
