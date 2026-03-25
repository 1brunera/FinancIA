import { supabase } from './supabase';
import { Transaction, CategoryOption, CreditCard, TransactionType, TransactionStatus, Bill, IncomeReminder, Investment, InvestmentGoal, RecurrenceType, InvestmentType } from '../types';

// Map TS objects to DB columns
const mapTxToDb = (t: Transaction, userId: string) => ({
  id: t.id,
  user_id: userId,
  description: t.description,
  amount: t.amount,
  type: t.type,
  category: t.category,
  date: t.date,
  paymentMethod: t.paymentMethodId === 'cash' ? 'cash' : 'credit_card',
  creditCardId: t.paymentMethodId !== 'cash' ? t.paymentMethodId : null,
  installments: t.installments?.total || null,
  currentInstallment: t.installments?.current || null,
  status: t.status || 'Pago',
  installments_id: t.installments?.id || null
});

const mapDbToTx = (row: any): Transaction => ({
  id: row.id,
  description: row.description,
  amount: Number(row.amount),
  type: row.type as TransactionType,
  category: row.category,
  date: row.date,
  paymentMethodId: row.paymentMethod === 'cash' ? 'cash' : row.creditCardId,
  status: (row.status as TransactionStatus) || 'Pago',
  installments: row.installments ? {
    total: row.installments,
    current: row.currentInstallment,
    id: row.installments_id || ''
  } : undefined
});

const mapCatToDb = (c: CategoryOption, userId: string) => ({
  id: c.id,
  user_id: userId,
  name: c.label,
  color: c.color,
  type: 'expense', // default
  budget: c.budget || null,
  is_custom: c.isCustom || false,
  budget_group: c.budgetGroup || 'none'
});

const mapDbToCat = (row: any): CategoryOption => ({
  id: row.id,
  label: row.name,
  color: row.color,
  budget: row.budget ? Number(row.budget) : undefined,
  isCustom: row.is_custom || false,
  budgetGroup: row.budget_group || 'none'
});

const mapCardToDb = (c: CreditCard, userId: string) => ({
  id: c.id,
  user_id: userId,
  name: c.name,
  limit_amount: c.limit,
  closing_day: c.closingDay,
  due_day: c.dueDay,
  color: c.color
});

const mapDbToCard = (row: any): CreditCard => ({
  id: row.id,
  name: row.name,
  limit: Number(row.limit_amount),
  closingDay: row.closing_day,
  dueDay: row.due_day,
  color: row.color
});

const mapBillToDb = (b: Bill, userId: string) => ({
  id: b.id,
  user_id: userId,
  description: b.description,
  amount: b.amount,
  due_date: b.dueDate,
  notify_days_before: b.notifyDaysBefore,
  is_paid: b.isPaid,
  recurrence: b.recurrence,
  custom_alert_message: b.customAlertMessage || null,
  payment_method_id: b.paymentMethodId || null,
  category: b.category || null,
  group_id: b.groupId || null,
  is_manual_amount: b.isManualAmount || false
});

const mapDbToBill = (row: any): Bill => ({
  id: row.id,
  description: row.description,
  amount: Number(row.amount),
  dueDate: row.due_date,
  notifyDaysBefore: row.notify_days_before,
  isPaid: row.is_paid,
  recurrence: row.recurrence as RecurrenceType,
  customAlertMessage: row.custom_alert_message,
  paymentMethodId: row.payment_method_id,
  category: row.category,
  groupId: row.group_id,
  isManualAmount: row.is_manual_amount
});

const mapIncomeToDb = (i: IncomeReminder, userId: string) => ({
  id: i.id,
  user_id: userId,
  description: i.description,
  amount: i.amount,
  due_date: i.dueDate,
  is_received: i.isReceived,
  recurrence: i.recurrence,
  category: i.category || null,
  group_id: i.groupId || null
});

const mapDbToIncome = (row: any): IncomeReminder => ({
  id: row.id,
  description: row.description,
  amount: Number(row.amount),
  dueDate: row.due_date,
  isReceived: row.is_received,
  recurrence: row.recurrence as RecurrenceType,
  category: row.category,
  groupId: row.group_id
});

const mapInvestmentToDb = (i: Investment, userId: string) => ({
  id: i.id,
  user_id: userId,
  name: i.name,
  amount: i.amount,
  type: i.type,
  is_liquidity: i.isLiquidity,
  institution: i.institution || null,
  profitability: i.profitability || null
});

const mapDbToInvestment = (row: any): Investment => ({
  id: row.id,
  name: row.name,
  amount: Number(row.amount),
  type: row.type as InvestmentType,
  isLiquidity: row.is_liquidity,
  institution: row.institution,
  profitability: row.profitability
});

const mapGoalToDb = (g: InvestmentGoal, userId: string) => ({
  id: g.id,
  user_id: userId,
  name: g.name,
  target_amount: g.targetAmount,
  current_amount: g.currentAmount,
  deadline: g.deadline,
  icon: g.icon || null,
  redemption_date: g.redemptionDate || null,
  period: g.period || null,
  institution: g.institution || null,
  profitability: g.profitability || null,
  type: g.type || null
});

const mapDbToGoal = (row: any): InvestmentGoal => ({
  id: row.id,
  name: row.name,
  targetAmount: Number(row.target_amount),
  currentAmount: Number(row.current_amount),
  deadline: row.deadline,
  icon: row.icon,
  redemptionDate: row.redemption_date,
  period: row.period,
  institution: row.institution,
  profitability: row.profitability,
  type: row.type as InvestmentType
});

export const db = {
  // Transactions
  async getTransactions() {
    const { data } = await supabase.from('transactions').select('*');
    return data ? data.map(mapDbToTx) : [];
  },
  async addTransactions(txs: Transaction[], userId: string) {
    await supabase.from('transactions').insert(txs.map(t => mapTxToDb(t, userId)));
  },
  async updateTransaction(tx: Transaction, userId: string) {
    await supabase.from('transactions').update(mapTxToDb(tx, userId)).eq('id', tx.id);
  },
  async deleteTransaction(id: string) {
    await supabase.from('transactions').delete().eq('id', id);
  },
  
  // Categories
  async getCategories() {
    const { data } = await supabase.from('categories').select('*');
    return data ? data.map(mapDbToCat) : [];
  },
  async addCategory(cat: CategoryOption, userId: string) {
    await supabase.from('categories').insert(mapCatToDb(cat, userId));
  },
  async updateCategory(cat: CategoryOption, userId: string) {
    await supabase.from('categories').update(mapCatToDb(cat, userId)).eq('id', cat.id);
  },
  async deleteCategory(id: string) {
    await supabase.from('categories').delete().eq('id', id);
  },
  
  // Credit Cards
  async getCreditCards() {
    const { data } = await supabase.from('credit_cards').select('*');
    return data ? data.map(mapDbToCard) : [];
  },
  async addCreditCard(card: CreditCard, userId: string) {
    await supabase.from('credit_cards').insert(mapCardToDb(card, userId));
  },
  async updateCreditCard(card: CreditCard, userId: string) {
    await supabase.from('credit_cards').update(mapCardToDb(card, userId)).eq('id', card.id);
  },
  async deleteCreditCard(id: string) {
    await supabase.from('credit_cards').delete().eq('id', id);
  },

  // Bills
  async getBills() {
    const { data } = await supabase.from('bills').select('*');
    return data ? data.map(mapDbToBill) : [];
  },
  async addBills(bills: Bill[], userId: string) {
    await supabase.from('bills').insert(bills.map(b => mapBillToDb(b, userId)));
  },
  async updateBill(bill: Bill, userId: string) {
    await supabase.from('bills').update(mapBillToDb(bill, userId)).eq('id', bill.id);
  },
  async deleteBill(id: string) {
    await supabase.from('bills').delete().eq('id', id);
  },

  // Income Reminders
  async getIncomeReminders() {
    const { data } = await supabase.from('income_reminders').select('*');
    return data ? data.map(mapDbToIncome) : [];
  },
  async addIncomeReminders(incomes: IncomeReminder[], userId: string) {
    await supabase.from('income_reminders').insert(incomes.map(i => mapIncomeToDb(i, userId)));
  },
  async updateIncomeReminder(income: IncomeReminder, userId: string) {
    await supabase.from('income_reminders').update(mapIncomeToDb(income, userId)).eq('id', income.id);
  },
  async deleteIncomeReminder(id: string) {
    await supabase.from('income_reminders').delete().eq('id', id);
  },

  // Investments
  async getInvestments() {
    const { data } = await supabase.from('investments').select('*');
    return data ? data.map(mapDbToInvestment) : [];
  },
  async addInvestment(inv: Investment, userId: string) {
    await supabase.from('investments').insert(mapInvestmentToDb(inv, userId));
  },
  async updateInvestment(inv: Investment, userId: string) {
    await supabase.from('investments').update(mapInvestmentToDb(inv, userId)).eq('id', inv.id);
  },
  async deleteInvestment(id: string) {
    await supabase.from('investments').delete().eq('id', id);
  },

  // Investment Goals
  async getInvestmentGoals() {
    const { data } = await supabase.from('investment_goals').select('*');
    return data ? data.map(mapDbToGoal) : [];
  },
  async addInvestmentGoal(goal: InvestmentGoal, userId: string) {
    await supabase.from('investment_goals').insert(mapGoalToDb(goal, userId));
  },
  async updateInvestmentGoal(goal: InvestmentGoal, userId: string) {
    await supabase.from('investment_goals').update(mapGoalToDb(goal, userId)).eq('id', goal.id);
  },
  async deleteInvestmentGoal(id: string) {
    await supabase.from('investment_goals').delete().eq('id', id);
  }
};
