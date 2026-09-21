import { CreditCard, Transaction, TransactionType } from '../types';

export interface CardInvoiceInfo {
  invoiceMonthStr: string; // 'YYYY-MM', e.g. '2026-10'
  invoiceMonthName: string; // 'Outubro de 2026'
  invoiceShortLabel: string; // 'Out/26'
  dueDateStr: string; // 'YYYY-MM-DD'
  formattedDueDate: string; // '25/10/2026'
  isAfterClosing: boolean;
  closingDay: number;
  dueDay: number;
  periodStartFormatted: string; // e.g. '20/09'
  periodEndFormatted: string; // e.g. '19/10'
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const SHORT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Dez'];

/**
 * Calculates credit card invoice details based on card closing day, due day,
 * and the transaction date or an explicit invoice month.
 */
export function getCardInvoiceInfo(
  card: CreditCard,
  transactionDateStr: string,
  explicitInvoiceMonth?: string
): CardInvoiceInfo {
  const tDate = new Date(transactionDateStr + 'T12:00:00');
  const day = tDate.getDate();
  const isAfterClosing = day > card.closingDay;

  let year: number;
  let month: number; // 0-indexed

  if (explicitInvoiceMonth && /^\d{4}-\d{2}$/.test(explicitInvoiceMonth)) {
    const [y, m] = explicitInvoiceMonth.split('-').map(Number);
    year = y;
    month = m - 1;
  } else {
    year = tDate.getFullYear();
    month = tDate.getMonth();
    // If purchase was made after closing day, it goes into next month's invoice
    if (isAfterClosing) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
  }

  // Calculate Due Date
  // In Brazil, if dueDay <= closingDay, the due date is in the month following the closing month
  let dueMonth = month;
  let dueYear = year;
  if (card.dueDay <= card.closingDay) {
    dueMonth += 1;
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear += 1;
    }
  }

  const invoiceMonthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const dueDateStr = `${dueYear}-${String(dueMonth + 1).padStart(2, '0')}-${String(card.dueDay).padStart(2, '0')}`;
  const formattedDueDate = `${String(card.dueDay).padStart(2, '0')}/${String(dueMonth + 1).padStart(2, '0')}/${dueYear}`;

  const invoiceMonthName = `${MONTH_NAMES[month]} de ${year}`;
  const invoiceShortLabel = `${SHORT_MONTHS[month]}/${String(year).slice(-2)}`;

  // Period calculation (from previous month closingDay + 1 to this month closingDay)
  const prevMonthDate = new Date(year, month - 1, card.closingDay + 1);
  const endMonthDate = new Date(year, month, card.closingDay);

  const periodStartFormatted = `${String(prevMonthDate.getDate()).padStart(2, '0')}/${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const periodEndFormatted = `${String(endMonthDate.getDate()).padStart(2, '0')}/${String(endMonthDate.getMonth() + 1).padStart(2, '0')}`;

  return {
    invoiceMonthStr,
    invoiceMonthName,
    invoiceShortLabel,
    dueDateStr,
    formattedDueDate,
    isAfterClosing,
    closingDay: card.closingDay,
    dueDay: card.dueDay,
    periodStartFormatted,
    periodEndFormatted
  };
}

/**
 * Returns available invoice month options around a reference date for UI selection.
 */
export function getInvoiceMonthOptions(
  card: CreditCard,
  transactionDateStr: string,
  countMonthsAhead = 6
): Array<{ value: string; label: string; isAuto: boolean }> {
  const autoInfo = getCardInvoiceInfo(card, transactionDateStr);
  const tDate = new Date(transactionDateStr + 'T12:00:00');
  
  const options: Array<{ value: string; label: string; isAuto: boolean }> = [];
  
  // Starting from previous month of transaction up to countMonthsAhead
  for (let offset = -1; offset <= countMonthsAhead; offset++) {
    const d = new Date(tDate.getFullYear(), tDate.getMonth() + offset, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const isAuto = val === autoInfo.invoiceMonthStr;
    const monthName = MONTH_NAMES[d.getMonth()];
    
    options.push({
      value: val,
      label: `${monthName} / ${d.getFullYear()}${isAuto ? ' (Automático / Recomendado)' : ''}`,
      isAuto
    });
  }

  return options;
}
