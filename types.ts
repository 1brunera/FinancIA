export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

export type TransactionStatus = 'Pendente' | 'Pago' | 'Recebido' | 'Cancelado';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  paymentMethodId?: string; // 'cash' or CreditCard.id
  date: string;
  status?: TransactionStatus;
  installments?: {
    current: number;
    total: number;
    id: string; // Group ID to link installments
  };
}

export type RecurrenceType = 'none' | 'monthly' | 'yearly';

export interface Bill {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  notifyDaysBefore: number;
  isPaid: boolean;
  recurrence: RecurrenceType;
  customAlertMessage?: string;
  paymentMethodId?: string; // 'cash' or CreditCard.id
  category?: string;
  groupId?: string;
  isManualAmount?: boolean;
}

// New interface for Income Reminders
export interface IncomeReminder {
  id: string;
  description: string;
  amount: number;
  dueDate: string; // Expected receipt date
  isReceived: boolean;
  recurrence: RecurrenceType;
  category?: string;
  groupId?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export type BudgetGroup = 'needs' | 'wants' | 'savings' | 'none';

export interface CategoryOption {
  id: string;
  label: string;
  color: string;
  isCustom?: boolean;
  budgetGroup?: BudgetGroup; 
  budget?: number;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
}

// --- Investment Types ---

export type InvestmentType = 'fixed' | 'stock' | 'fii' | 'crypto' | 'foreign' | 'fund' | 'renda_fixa' | 'renda_variavel' | 'cdb' | 'tesouro' | 'lci_lca' | 'poupanca';

export interface Investment {
  id: string;
  name: string; // e.g., "Tesouro Selic 2029", "AAPL"
  amount: number; // Current Value
  type: InvestmentType;
  isLiquidity: boolean; // For Emergency Fund calculation
  institution?: string; // e.g., "Banco Inter", "XP"
  profitability?: string; // e.g., "102% CDI", "IPCA + 5%"
}

export interface InvestmentGoal {
  id: string;
  name: string; // "Viagem Disney"
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO Date
  icon?: string; // e.g., 'plane', 'home'
  redemptionDate?: string;
  period?: string; // 'imediato', '3_meses', '6_meses', '1_ano', 'personalizado'
  institution?: string;
  profitability?: string;
  type?: InvestmentType;
}