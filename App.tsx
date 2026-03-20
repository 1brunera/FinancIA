import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Bell, Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Menu, History, PiggyBank, Sun, Moon, CreditCard as CreditCardIcon, Settings2, Eye, EyeOff } from 'lucide-react';
import { Transaction, TransactionType, CategoryOption, Bill, CreditCard, IncomeReminder, Investment, InvestmentGoal } from './types';
import { MOCK_TRANSACTIONS, DEFAULT_CATEGORIES, MOCK_INVESTMENTS, MOCK_GOALS } from './constants';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { FinancialCharts } from './components/FinancialCharts';
import { AIAdvisor } from './components/AIAdvisor';
import { CategoryManager } from './components/CategoryManager';
import { BillReminders } from './components/BillReminders';
import { IncomeReminders } from './components/IncomeReminders';
import { CreditCardManager } from './components/CreditCardManager';
import { InvestmentsDashboard } from './components/InvestmentsDashboard';
import { Sidebar } from './components/Sidebar';
import { Settings } from './components/Settings';
import { supabase } from './services/supabase';
import { AuthScreen } from './components/AuthScreen';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  // --- Auth State ---
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting session:", error);
        // If the refresh token is invalid, sign out to clear the local state
        if (error.message?.includes('Refresh Token') || error.message?.includes('refresh_token_not_found')) {
          supabase.auth.signOut();
        }
      }
      setSession(session);
      setIsAuthLoading(false);
    }).catch((err) => {
      console.error("Caught error getting session:", err);
      if (err.message?.includes('Refresh Token') || err.message?.includes('refresh_token_not_found')) {
        supabase.auth.signOut();
      }
      setIsAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      if (event === 'SIGNED_OUT') {
        setSession(null);
      } else {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- State Management ---
  const [activeView, setActiveView] = useState('dashboard');
  const [showValues, setShowValues] = useState(true);
  
  // Sidebar states
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true); // Desktop state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // Mobile state
  
  // Dashboard Date Filter
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Current Time for Header
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
        const saved = localStorage.getItem('finance_transactions');
        return saved ? JSON.parse(saved) : MOCK_TRANSACTIONS;
    } catch {
        return MOCK_TRANSACTIONS;
    }
  });

  const [categories, setCategories] = useState<CategoryOption[]>(() => {
    try {
        const saved = localStorage.getItem('finance_categories');
        if (saved) {
            const parsedCategories = JSON.parse(saved) as CategoryOption[];
            // Ensure all default categories exist in the saved categories
            const missingDefaults = DEFAULT_CATEGORIES.filter(
                defaultCat => !parsedCategories.some(savedCat => savedCat.id === defaultCat.id)
            );
            return [...parsedCategories, ...missingDefaults];
        }
        return DEFAULT_CATEGORIES;
    } catch {
        return DEFAULT_CATEGORIES;
    }
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    try {
      const saved = localStorage.getItem('finance_bills');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [incomeReminders, setIncomeReminders] = useState<IncomeReminder[]>(() => {
    try {
      const saved = localStorage.getItem('finance_income_reminders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [creditCards, setCreditCards] = useState<CreditCard[]>(() => {
    try {
      const saved = localStorage.getItem('finance_credit_cards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [investments, setInvestments] = useState<Investment[]>(() => {
    try {
      const saved = localStorage.getItem('finance_investments');
      return saved ? JSON.parse(saved) : MOCK_INVESTMENTS;
    } catch {
      return MOCK_INVESTMENTS;
    }
  });

  const [investmentGoals, setInvestmentGoals] = useState<InvestmentGoal[]>(() => {
    try {
      const saved = localStorage.getItem('finance_investment_goals');
      return saved ? JSON.parse(saved) : MOCK_GOALS;
    } catch {
      return MOCK_GOALS;
    }
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('finance_theme') || 'light';
  });

  const [dashboardConfig, setDashboardConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('finance_dashboard_config');
      return saved ? JSON.parse(saved) : {
        showInvoices: true,
        showBudget: true,
        showCategoryChart: true,
        showCardChart: true
      };
    } catch {
      return {
        showInvoices: true,
        showBudget: true,
        showCategoryChart: true,
        showCardChart: true
      };
    }
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const toggleDashboardConfig = (key: keyof typeof dashboardConfig) => {
    const newConfig = { ...dashboardConfig, [key]: !dashboardConfig[key] };
    setDashboardConfig(newConfig);
    localStorage.setItem('finance_dashboard_config', JSON.stringify(newConfig));
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('finance_theme', theme);
  }, [theme]);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('finance_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finance_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('finance_bills', JSON.stringify(bills));
  }, [bills]);

  // Sync credit card bills based on transactions
  useEffect(() => {
    setBills(prevBills => {
      const nonCcBills = prevBills.filter(b => !b.id.startsWith('cc-invoice-'));
      const ccBillsMap = new Map<string, Bill>();

      // Retain existing cc bills to keep their isPaid status
      prevBills.filter(b => b.id.startsWith('cc-invoice-')).forEach(b => {
        ccBillsMap.set(b.id, { ...b, amount: b.isManualAmount ? b.amount : 0 }); // Reset amount to recalculate only if not manual
      });

      transactions.forEach(t => {
        if (t.type === TransactionType.EXPENSE && t.paymentMethodId && t.paymentMethodId !== 'cash') {
          const card = creditCards.find(c => c.id === t.paymentMethodId);
          if (card) {
            const tDate = new Date(t.date + 'T12:00:00');
            let month = tDate.getMonth();
            let year = tDate.getFullYear();
            
            if (tDate.getDate() > card.closingDay) {
                month += 1;
                if (month > 11) {
                    month = 0;
                    year += 1;
                }
            }
            
            let dueMonth = month;
            let dueYear = year;
            if (card.dueDay <= card.closingDay) {
                dueMonth += 1;
                if (dueMonth > 11) {
                    dueMonth = 0;
                    dueYear += 1;
                }
            }
            
            const expectedDueDateStr = `${dueYear}-${String(dueMonth + 1).padStart(2, '0')}-${String(card.dueDay).padStart(2, '0')}`;
            const invoiceId = `cc-invoice-${card.id}-${year}-${month}`;
            
            if (ccBillsMap.has(invoiceId)) {
                if (!ccBillsMap.get(invoiceId)!.isManualAmount) {
                    ccBillsMap.get(invoiceId)!.amount += t.amount;
                }
            } else {
                ccBillsMap.set(invoiceId, {
                    id: invoiceId,
                    description: `Fatura ${card.name}`,
                    amount: t.amount,
                    dueDate: expectedDueDateStr,
                    notifyDaysBefore: 3,
                    isPaid: false,
                    recurrence: 'none',
                    category: 'outros',
                    paymentMethodId: 'cash' // The invoice itself is paid with cash/account balance
                });
            }
          }
        }
      });

      // Filter out cc bills that have 0 amount (no transactions anymore)
      const activeCcBills = Array.from(ccBillsMap.values()).filter(b => b.amount > 0);

      // Check if there are any changes to avoid infinite loops
      const newBills = [...nonCcBills, ...activeCcBills];
      if (JSON.stringify(newBills) !== JSON.stringify(prevBills)) {
          return newBills;
      }
      return prevBills;
    });
  }, [transactions, creditCards]);

  useEffect(() => {
    localStorage.setItem('finance_income_reminders', JSON.stringify(incomeReminders));
  }, [incomeReminders]);

  useEffect(() => {
    localStorage.setItem('finance_credit_cards', JSON.stringify(creditCards));
  }, [creditCards]);

  useEffect(() => {
    localStorage.setItem('finance_investments', JSON.stringify(investments));
  }, [investments]);

  useEffect(() => {
    localStorage.setItem('finance_investment_goals', JSON.stringify(investmentGoals));
  }, [investmentGoals]);

  // --- Handlers ---
  const handleNavigate = (view: string) => {
      setActiveView(view);
      setIsMobileSidebarOpen(false); // Close sidebar on mobile nav
  };

  const handleAddTransactions = (newTransactionsData: Omit<Transaction, 'id'>[]) => {
    const newTransactions = newTransactionsData.map(t => ({
        ...t,
        id: crypto.randomUUID()
    }));
    setTransactions(prev => [...newTransactions, ...prev]);
  };

  const handleEditTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTransactionStatus = (id: string, newStatus: TransactionStatus) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const handleAddCategory = (category: CategoryOption) => {
    setCategories(prev => [...prev, category]);
  };

  const handleEditCategory = (updatedCategory: CategoryOption) => {
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleAddBill = (newBill: Omit<Bill, 'id' | 'isPaid'> & { id?: string }) => {
    const groupId = crypto.randomUUID();
    const billsToAdd: Bill[] = [];
    
    if (newBill.recurrence === 'none') {
        billsToAdd.push({
            ...newBill,
            id: newBill.id || crypto.randomUUID(),
            isPaid: false,
            groupId
        });
    } else {
        const instances = newBill.recurrence === 'monthly' ? 60 : 10; // 5 years for monthly, 10 years for yearly
        let currentDueDate = new Date(newBill.dueDate + 'T12:00:00'); // Use noon to avoid timezone issues
        
        for (let i = 0; i < instances; i++) {
            billsToAdd.push({
                ...newBill,
                id: crypto.randomUUID(),
                isPaid: false,
                dueDate: currentDueDate.toISOString().split('T')[0],
                groupId
            });
            
            // Calculate next date
            const nextDate = new Date(currentDueDate);
            if (newBill.recurrence === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (newBill.recurrence === 'yearly') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            }
            currentDueDate = nextDate;
        }
    }
    
    setBills(prev => [...prev, ...billsToAdd]);
  };

  const handleEditBill = (updatedBill: Bill) => {
    setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
  };

  const handleDeleteBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const handlePayBill = (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;

    setBills(prev => prev.map(b => b.id === id ? { ...b, isPaid: true } : b));

    // Add a single transaction for bill payment
    handleAddTransactions([{
        description: `Pgto: ${bill.description}`,
        amount: bill.amount,
        type: TransactionType.EXPENSE,
        category: bill.category || 'outros',
        date: new Date().toISOString().split('T')[0],
        paymentMethodId: bill.paymentMethodId || 'cash',
        status: 'Pago'
    }]);
  };

  const handleUnpayBill = (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;

    setBills(prev => prev.map(b => b.id === id ? { ...b, isPaid: false } : b));

    // Try to remove the automatically generated transaction
    setTransactions(prev => {
        const matchingTxIndex = prev.findIndex(t => 
            t.description === `Pgto: ${bill.description}` && 
            t.amount === bill.amount && 
            t.type === TransactionType.EXPENSE
        );
        if (matchingTxIndex !== -1) {
            const newTxs = [...prev];
            newTxs.splice(matchingTxIndex, 1);
            return newTxs;
        }
        return prev;
    });
  };

  // Income Reminders Handlers
  const handleAddIncome = (newIncome: Omit<IncomeReminder, 'id' | 'isReceived'>) => {
    const groupId = crypto.randomUUID();
    const incomesToAdd: IncomeReminder[] = [];
    
    if (newIncome.recurrence === 'none') {
        incomesToAdd.push({
            ...newIncome,
            id: crypto.randomUUID(),
            isReceived: false,
            groupId
        });
    } else {
        const instances = newIncome.recurrence === 'monthly' ? 60 : 10; // 5 years for monthly, 10 years for yearly
        let currentDueDate = new Date(newIncome.dueDate + 'T12:00:00'); // Use noon to avoid timezone issues
        
        for (let i = 0; i < instances; i++) {
            incomesToAdd.push({
                ...newIncome,
                id: crypto.randomUUID(),
                isReceived: false,
                dueDate: currentDueDate.toISOString().split('T')[0],
                groupId
            });
            
            // Calculate next date
            const nextDate = new Date(currentDueDate);
            if (newIncome.recurrence === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (newIncome.recurrence === 'yearly') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            }
            currentDueDate = nextDate;
        }
    }
    
    setIncomeReminders(prev => [...prev, ...incomesToAdd]);
  };

  const handleEditIncome = (updatedIncome: IncomeReminder) => {
    setIncomeReminders(prev => prev.map(i => i.id === updatedIncome.id ? updatedIncome : i));
  };

  const handleDeleteIncome = (id: string) => {
    setIncomeReminders(prev => prev.filter(i => i.id !== id));
  };

  const handleReceiveIncome = (id: string) => {
    const income = incomeReminders.find(i => i.id === id);
    if (!income) return;

    setIncomeReminders(prev => prev.map(i => i.id === id ? { ...i, isReceived: true } : i));

    // Add transaction
    handleAddTransactions([{
        description: `Receb.: ${income.description}`,
        amount: income.amount,
        type: TransactionType.INCOME,
        category: income.category || 'outras_receitas',
        date: new Date().toISOString().split('T')[0],
        paymentMethodId: 'cash',
        status: 'Recebido'
    }]);
  };

  const handleUnreceiveIncome = (id: string) => {
    const income = incomeReminders.find(i => i.id === id);
    if (!income) return;

    setIncomeReminders(prev => prev.map(i => i.id === id ? { ...i, isReceived: false } : i));

    // Try to remove the automatically generated transaction
    setTransactions(prev => {
        const matchingTxIndex = prev.findIndex(t => 
            t.description === `Receb.: ${income.description}` && 
            t.amount === income.amount && 
            t.type === TransactionType.INCOME
        );
        if (matchingTxIndex !== -1) {
            const newTxs = [...prev];
            newTxs.splice(matchingTxIndex, 1);
            return newTxs;
        }
        return prev;
    });
  };

  const handleAddCreditCard = (newCard: Omit<CreditCard, 'id'>) => {
    const card: CreditCard = { ...newCard, id: crypto.randomUUID() };
    setCreditCards(prev => [...prev, card]);
  };

  const handleUpdateCreditCard = (updatedCard: CreditCard) => {
    setCreditCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
  };

  const handleDeleteCreditCard = (id: string) => {
    setCreditCards(prev => prev.filter(c => c.id !== id));
  };

  // Investment Handlers (Mocked for now as UI only requested display)
  const handleAddInvestment = (inv: Investment) => setInvestments(prev => [...prev, inv]);
  const handleDeleteInvestment = (id: string) => setInvestments(prev => prev.filter(i => i.id !== id));
  const handleAddGoal = (goal: InvestmentGoal) => setInvestmentGoals(prev => [...prev, goal]);
  const handleDeleteGoal = (id: string) => setInvestmentGoals(prev => prev.filter(g => g.id !== id));

  // --- Settings Handlers ---
  const handleClearData = () => {
    setTransactions([]);
    setCategories(DEFAULT_CATEGORIES);
    setBills([]);
    setIncomeReminders([]);
    setCreditCards([]);
    setInvestments([]);
    setInvestmentGoals([]);
    localStorage.clear();
    alert('Todos os dados foram apagados com sucesso.');
  };

  const handleExportData = () => {
    if (transactions.length === 0) {
      alert('Não há transações para exportar.');
      return;
    }
    const headers = ['ID', 'Descrição', 'Valor', 'Tipo', 'Categoria', 'Data', 'Método de Pagamento'];
    const rows = [headers.join(',')];
    
    transactions.forEach(t => {
      const row = [
        t.id,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount,
        t.type,
        t.category,
        t.date,
        t.paymentMethodId || ''
      ];
      rows.push(row.join(','));
    });

    const csvString = rows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financas_ia_transacoes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (csvData: string) => {
    try {
      const lines = csvData.split('\n');
      const newTransactions: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        let inQuotes = false;
        let currentValue = '';
        const rowValues = [];
        
        for (let char of line) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            rowValues.push(currentValue);
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        rowValues.push(currentValue);
        
        if (rowValues.length >= 6) {
          newTransactions.push({
            id: rowValues[0] || crypto.randomUUID(),
            description: rowValues[1].replace(/""/g, '"'),
            amount: Number(rowValues[2]),
            type: rowValues[3],
            category: rowValues[4],
            date: rowValues[5],
            paymentMethodId: rowValues[6] || undefined
          });
        }
      }

      if (newTransactions.length > 0) {
        setTransactions(prev => [...prev, ...newTransactions]);
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw new Error('Invalid CSV format');
    }
  };

  // --- Date Helpers ---
  const changeMonth = (offset: number) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + offset);
      setCurrentDate(newDate);
  };

  const formatCurrentMonth = () => {
      const month = currentDate.toLocaleDateString('pt-BR', { month: 'long' });
      const year = currentDate.getFullYear();
      // Capitalize month
      return `${month.charAt(0).toUpperCase() + month.slice(1)} - ${year}`;
  };
  
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // --- Derived Data (Rollover Logic) ---
  
  const financialData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Start of the currently selected month
    const startOfSelectedMonth = new Date(year, month, 1);
    const startOfNextMonth = new Date(year, month + 1, 1);

    // 1. Calculate Previous Balance (Rollover)
    // Sum of all incomes - expenses BEFORE the 1st of this month
    const previousTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        // Reset hours to avoid timezone issues affecting day comparison
        const tDateNormalized = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
        return tDateNormalized < startOfSelectedMonth;
    });

    const previousIncome = previousTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

    const previousExpense = previousTransactions
        .filter(t => t.type === TransactionType.EXPENSE && (!t.paymentMethodId || t.paymentMethodId === 'cash'))
        .reduce((sum, t) => sum + t.amount, 0);

    const previousBalance = previousIncome - previousExpense;

    // 2. Current Month Transactions
    const currentTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        const tDateNormalized = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
        return tDateNormalized >= startOfSelectedMonth && tDateNormalized < startOfNextMonth;
    });

    const currentIncome = currentTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

    const currentExpense = currentTransactions
        .filter(t => t.type === TransactionType.EXPENSE && (!t.paymentMethodId || t.paymentMethodId === 'cash'))
        .reduce((sum, t) => sum + t.amount, 0);
    
    const currentBalance = currentIncome - currentExpense;

    // 3. Total Accumulated Balance (Available Now)
    const totalAccumulatedBalance = previousBalance + currentBalance;

    // 4. Budget Forecast (Previsão de orçamento)
    // Includes pending bills and income up to the end of the selected month
    const endOfSelectedMonth = new Date(year, month + 1, 0, 23, 59, 59);

    const pendingBills = bills.filter(b => {
      if (b.isPaid) return false;
      const bDate = new Date(b.dueDate + 'T12:00:00');
      return bDate <= endOfSelectedMonth;
    }).reduce((sum, b) => sum + b.amount, 0);

    const pendingIncome = incomeReminders.filter(i => {
      if (i.isReceived) return false;
      const iDate = new Date(i.dueDate + 'T12:00:00');
      return iDate <= endOfSelectedMonth;
    }).reduce((sum, i) => sum + i.amount, 0);

    const budgetForecast = totalAccumulatedBalance + pendingIncome - pendingBills;

    return {
        previousBalance,
        currentIncome,
        currentExpense,
        currentBalance,
        totalAccumulatedBalance,
        budgetForecast,
        monthlyTransactions: currentTransactions
    };

  }, [transactions, currentDate, bills, incomeReminders]);

  const monthlyBills = useMemo(() => {
    return bills.filter(b => {
      const bDate = new Date(b.dueDate + 'T12:00:00');
      return bDate.getMonth() === currentDate.getMonth() && bDate.getFullYear() === currentDate.getFullYear();
    });
  }, [bills, currentDate]);

  const monthlyIncomes = useMemo(() => {
    return incomeReminders.filter(i => {
      const iDate = new Date(i.dueDate + 'T12:00:00');
      return iDate.getMonth() === currentDate.getMonth() && iDate.getFullYear() === currentDate.getFullYear();
    });
  }, [incomeReminders, currentDate]);

  const activeNotifications = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    return bills.filter(bill => {
        if (bill.isPaid) return false;
        const dueDate = new Date(bill.dueDate);
        dueDate.setHours(0,0,0,0);
        
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= bill.notifyDaysBefore;
    }).map(bill => {
        const dueDate = new Date(bill.dueDate);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return { ...bill, diffDays };
    });
  }, [bills]);

  // --- Reusable Components ---
  const MonthSelector = () => (
    <div className="flex items-center justify-center mb-6 md:mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-colors">
                <ChevronLeft size={20} />
            </button>
            <span className="w-40 md:w-48 text-center font-bold text-slate-800 dark:text-white select-none text-sm md:text-base">
                {formatCurrentMonth()}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-colors">
                <ChevronRight size={20} />
            </button>
        </div>
    </div>
  );

  // --- Render Views ---
  const renderContent = () => {
    switch(activeView) {
        case 'dashboard':
            return (
                <div className="space-y-6 md:space-y-8 animate-fade-in">
                    {/* Global Notifications for Bills */}
                    {activeNotifications.length > 0 && (
                        <div className="mb-6 md:mb-8 bg-orange-50 border border-orange-200 rounded-2xl p-4 md:p-5 animate-fade-in-down shadow-sm">
                            <div className="flex items-center gap-2 text-orange-800 font-bold mb-3">
                                <Bell size={20} />
                                <span>Atenção: contas próximas</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {activeNotifications.map(note => (
                                    <div key={note.id} className="flex items-center justify-between text-sm bg-white dark:bg-slate-900 p-3 rounded-xl border border-orange-100 shadow-sm">
                                        <div>
                                            <span className="text-slate-700 dark:text-slate-200 font-bold block">
                                                {note.description}
                                            </span>
                                            {note.customAlertMessage && (note.diffDays <= 1) && (
                                                <span className="text-xs text-orange-600 block mt-0.5 font-medium">"{note.customAlertMessage}"</span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                             <span className="block text-slate-500 dark:text-slate-400 text-xs mb-0.5">{showValues ? formatCurrency(note.amount) : 'R$ •••••'}</span>
                                             <span className={`font-bold text-xs ${note.diffDays < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                                                {note.diffDays < 0 
                                                    ? `Venceu há ${Math.abs(note.diffDays)} dias` 
                                                    : note.diffDays === 0 ? 'Vence hoje!' : `Em ${note.diffDays} dias`}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <MonthSelector />

                    {/* Summary Cards - Updated with Rollover Logic */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        
                        {/* Accumulated Balance (Main) */}
                        <div className="no-invert bg-slate-900 p-5 md:p-6 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-none text-white relative overflow-hidden group lg:col-span-2">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                <PiggyBank size={80} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2 md:mb-3">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider">Previsão de orçamento</p>
                                        <span className="bg-slate-800 text-[10px] px-2 py-0.5 rounded text-slate-300">Mês Atual</span>
                                    </div>
                                    <button 
                                        onClick={() => setShowValues(!showValues)}
                                        className="text-slate-400 hover:text-white transition-colors p-1"
                                    >
                                        {showValues ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 tracking-tight">
                                    {showValues ? formatCurrency(financialData.budgetForecast) : 'R$ •••••'}
                                </h2>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                    <History size={14} />
                                    <span>Saldo Atual: {showValues ? formatCurrency(financialData.totalAccumulatedBalance) : 'R$ •••••'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Current Month Income */}
                        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                            <div className="absolute top-4 right-4 p-2 bg-green-50 text-green-600 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 md:mb-3">Receitas</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                                {showValues ? formatCurrency(financialData.currentIncome) : 'R$ •••••'}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Entradas este mês</p>
                        </div>

                        {/* Current Month Expense */}
                        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                            <div className="absolute top-4 right-4 p-2 bg-red-50 text-red-600 rounded-xl">
                                <TrendingDown size={24} />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 md:mb-3">Despesas</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                                {showValues ? formatCurrency(financialData.currentExpense) : 'R$ •••••'}
                            </h2>
                             <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Saídas este mês</p>
                        </div>
                    </div>

                    {/* Dashboard Config Toggles */}
                    <div className="flex justify-end mt-4 mb-2 relative">
                        <button 
                            onClick={() => setIsConfigOpen(!isConfigOpen)}
                            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                        >
                            <Settings2 size={14} /> Personalizar Dashboard
                        </button>
                        
                        {isConfigOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 z-50 animate-fade-in">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Mostrar/Ocultar</h4>
                                <div className="space-y-1">
                                    <button 
                                        onClick={() => toggleDashboardConfig('showInvoices')}
                                        className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                                    >
                                        <span>Faturas de Cartão</span>
                                        {dashboardConfig.showInvoices ? <Eye size={16} className="text-primary-500" /> : <EyeOff size={16} className="text-slate-400" />}
                                    </button>
                                    <button 
                                        onClick={() => toggleDashboardConfig('showBudget')}
                                        className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                                    >
                                        <span>Modelo de Orçamento</span>
                                        {dashboardConfig.showBudget ? <Eye size={16} className="text-primary-500" /> : <EyeOff size={16} className="text-slate-400" />}
                                    </button>
                                    <button 
                                        onClick={() => toggleDashboardConfig('showCategoryChart')}
                                        className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                                    >
                                        <span>Despesas por Categoria</span>
                                        {dashboardConfig.showCategoryChart ? <Eye size={16} className="text-primary-500" /> : <EyeOff size={16} className="text-slate-400" />}
                                    </button>
                                    <button 
                                        onClick={() => toggleDashboardConfig('showCardChart')}
                                        className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-slate-700 dark:text-slate-200"
                                    >
                                        <span>Despesas por Cartão</span>
                                        {dashboardConfig.showCardChart ? <Eye size={16} className="text-primary-500" /> : <EyeOff size={16} className="text-slate-400" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Credit Card Invoices */}
                    {creditCards.length > 0 && dashboardConfig.showInvoices && (
                        <div className="mt-8">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Faturas de Cartão ({formatCurrentMonth()})</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {creditCards.map(card => {
                                    const invoice = bills.find(b => 
                                        b.id.startsWith(`cc-invoice-${card.id}-`) && 
                                        new Date(b.dueDate + 'T12:00:00').getMonth() === currentDate.getMonth() &&
                                        new Date(b.dueDate + 'T12:00:00').getFullYear() === currentDate.getFullYear()
                                    );
                                    
                                    const amount = invoice ? invoice.amount : 0;
                                    
                                    return (
                                        <div key={card.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-16 h-16 opacity-10 rounded-bl-full" style={{ backgroundColor: card.color }}></div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm" style={{ backgroundColor: card.color }}>
                                                    <CreditCardIcon size={16} />
                                                </div>
                                                <h4 className="font-bold text-slate-800 dark:text-white">{card.name}</h4>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Fatura Atual</p>
                                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                                                {showValues ? formatCurrency(amount) : 'R$ •••••'}
                                            </h3>
                                            <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                                                <span>Vence dia {card.dueDay}</span>
                                                <span>Melhor dia: <span className="text-green-500 font-bold">{card.closingDay === 31 ? 1 : card.closingDay + 1}</span></span>
                                            </div>
                                            <div className="mt-1 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                                                <span>Limite: {showValues ? formatCurrency(card.limit) : 'R$ •••••'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <FinancialCharts 
                        transactions={financialData.monthlyTransactions} 
                        categories={categories} 
                        monthlyIncome={financialData.currentIncome}
                        creditCards={creditCards}
                        config={dashboardConfig}
                        showValues={showValues}
                        session={session}
                    />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">Transações recentes</h2>
                        <button
                            onClick={() => { setActiveView('transactions'); setIsFormOpen(true); }}
                            className="no-invert hidden md:flex bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                        >
                            <Plus size={18} /> Nova transação
                        </button>
                    </div>
                    <TransactionList 
                        transactions={financialData.monthlyTransactions.slice(0, 5)} 
                        onDelete={handleDeleteTransaction}
                        onEdit={(t) => setEditingTransaction(t)}
                        onUpdateStatus={handleUpdateTransactionStatus}
                        categories={categories}
                        creditCards={creditCards}
                        showValues={showValues}
                    />
                </div>
            );
        case 'investments':
            return (
                <div className="space-y-6 animate-fade-in">
                    <InvestmentsDashboard 
                        investments={investments}
                        goals={investmentGoals}
                        transactions={transactions} // To calc avg expense
                        onAddInvestment={handleAddInvestment}
                        onDeleteInvestment={handleDeleteInvestment}
                        onAddGoal={handleAddGoal}
                        onDeleteGoal={handleDeleteGoal}
                        showValues={showValues}
                    />
                </div>
            );
        case 'transactions':
            return (
                <div className="space-y-6 animate-fade-in">
                    <MonthSelector />
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                        <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">Transações de {formatCurrentMonth()}</h2>
                        <button
                            onClick={() => setIsFormOpen(true)}
                            className="w-full sm:w-auto bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <Plus size={18} /> Adicionar
                        </button>
                    </div>
                    <TransactionList 
                        transactions={financialData.monthlyTransactions} 
                        onDelete={handleDeleteTransaction}
                        onEdit={(t) => setEditingTransaction(t)}
                        onUpdateStatus={handleUpdateTransactionStatus}
                        categories={categories}
                        creditCards={creditCards}
                    />
                </div>
            );
        case 'bills':
            return (
                <div className="space-y-6 animate-fade-in">
                    <MonthSelector />
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Contas a pagar de {formatCurrentMonth()}</h2>
                    </div>
                    <BillReminders 
                        bills={monthlyBills} 
                        onAddBill={handleAddBill} 
                        onEditBill={handleEditBill}
                        onDeleteBill={handleDeleteBill}
                        onPayBill={handlePayBill}
                        onUnpayBill={handleUnpayBill}
                        creditCards={creditCards}
                        categories={categories}
                    />
                </div>
            );
        case 'income-reminders':
            return (
                <div className="space-y-6 animate-fade-in">
                    <MonthSelector />
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Contas a receber de {formatCurrentMonth()}</h2>
                    </div>
                    <IncomeReminders 
                        incomes={monthlyIncomes}
                        onAddIncome={handleAddIncome}
                        onEditIncome={handleEditIncome}
                        onReceiveIncome={handleReceiveIncome}
                        onUnreceiveIncome={handleUnreceiveIncome}
                        onDeleteIncome={handleDeleteIncome}
                        categories={categories}
                    />
                </div>
            );
        case 'credit-cards':
            return (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Gerenciar cartões</h2>
                    <CreditCardManager 
                        cards={creditCards}
                        // Passing full transactions array here
                        transactions={transactions}
                        categories={categories}
                        bills={bills}
                        onAddCard={handleAddCreditCard}
                        onUpdateCard={handleUpdateCreditCard}
                        onDeleteCard={handleDeleteCreditCard}
                        onAddTransaction={handleAddTransactions}
                        onEditTransaction={(t) => setEditingTransaction(t)}
                        onDeleteTransaction={handleDeleteTransaction}
                        onAddBill={handleAddBill}
                        onEditBill={handleEditBill}
                    />
                </div>
            );
        case 'categories':
            return (
                <div className="animate-fade-in">
                    <CategoryManager 
                        categories={categories}
                        onAddCategory={handleAddCategory}
                        onEditCategory={handleEditCategory}
                        onDeleteCategory={handleDeleteCategory}
                    />
                </div>
            );
        case 'ai-advisor':
            return (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Consultoria inteligente</h2>
                    <AIAdvisor transactions={financialData.monthlyTransactions} />
                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                        <h3 className="text-indigo-900 font-bold mb-2">Sobre o Consultor IA</h3>
                        <p className="text-indigo-700/80 text-sm leading-relaxed">
                            Utilizamos a tecnologia Google Gemini para analisar seus padrões de gastos. 
                            A análise atual considera apenas as transações de <strong>{formatCurrentMonth()}</strong>.
                        </p>
                    </div>
                </div>
            );
        case 'settings':
            return (
                <div className="space-y-6 animate-fade-in">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Configurações</h2>
                    <Settings 
                        onClearData={handleClearData}
                        onExportData={handleExportData}
                        onImportData={handleImportData}
                        theme={theme}
                        onThemeChange={setTheme}
                    />
                </div>
            );
        default:
            return null;
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar 
        activeView={activeView} 
        onNavigate={handleNavigate} 
        isExpanded={isSidebarExpanded}
        toggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
        isMobileOpen={isMobileSidebarOpen}
        closeMobileSidebar={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Wrapper */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 w-full ${
            isSidebarExpanded ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-lg"
                >
                    <Menu size={24} />
                </button>
                <h1 className="font-bold text-slate-800 dark:text-white text-lg capitalize truncate max-w-[200px] md:max-w-none">
                    {activeView === 'credit-cards' ? 'Cartões' : 
                    activeView === 'ai-advisor' ? 'Consultor IA' : 
                    activeView === 'categories' ? 'Categorias' :
                    activeView === 'bills' ? 'Contas a pagar' :
                    activeView === 'income-reminders' ? 'Contas a receber' :
                    activeView === 'transactions' ? 'Transações' :
                    activeView === 'investments' ? 'Investimentos' :
                    activeView === 'settings' ? 'Configurações' :
                    'Dashboard'}
                </h1>
                <div className="hidden md:flex items-center gap-2 ml-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}
                    </span>
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Alternar tema"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                 {/* User profile or simple greeting could go here */}
            </div>
        </header>

        {/* Dynamic Content */}
        <main className="p-4 md:p-8 pb-8 max-w-7xl mx-auto w-full flex-1">
            {renderContent()}
        </main>

        {/* Global Footer */}
        <footer className="w-full py-6 mt-auto border-t border-slate-200 dark:border-slate-700 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
            Criado por <a href="https://www.linkedin.com/in/brunosergiosilva/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium">Bruno Sergio</a>
        </footer>
      </div>

      {/* Mobile Sticky FAB */}
      {(activeView === 'dashboard' || activeView === 'transactions') && (
        <button
            onClick={() => setIsFormOpen(true)}
            className="no-invert md:hidden fixed bottom-6 right-6 bg-slate-900 text-white w-14 h-14 rounded-full shadow-2xl shadow-slate-900/40 flex items-center justify-center z-50 transition-transform active:scale-95"
        >
            <Plus size={28} />
        </button>
      )}

      {/* Form Modal */}
      {(isFormOpen || editingTransaction) && (
        <TransactionForm
          initialData={editingTransaction || undefined}
          onAdd={handleAddTransactions}
          onEdit={handleEditTransaction}
          onClose={() => { setIsFormOpen(false); setEditingTransaction(null); }}
          categories={categories}
          creditCards={creditCards}
        />
      )}
    </div>
  );
};

export default App;