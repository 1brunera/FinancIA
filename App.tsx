import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Bell, Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Menu, History, PiggyBank, Sun, Moon, CreditCard as CreditCardIcon, Settings2, Eye, EyeOff, FileDown, RotateCw, Trash2, CheckCircle2, AlertTriangle, LayoutDashboard, List } from 'lucide-react';
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
import { db } from './services/db';
import { AuthScreen } from './components/AuthScreen';
import { Session } from '@supabase/supabase-js';
import { getCardInvoiceInfo } from './utils/creditCard';
import { exportMonthlySummaryPDF } from './utils/exportPDF';
import { checkAndNotifyUpcomingBills } from './utils/notifications';
import { PushNotificationToast } from './components/PushNotificationToast';

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
        if (saved) {
            const parsed = JSON.parse(saved) as Transaction[];
            // Sanitize recurring descriptions to remove '(Recorrente X/Y)' or '(X/Y)' if not installment
            return parsed.map(t => {
                let desc = t.description;
                if (desc.includes('(Recorrente')) {
                    desc = desc.replace(/\s*\(Recorrente(\s+\d+\/\d+)?\)/gi, '').trim();
                }
                if (!t.installments && /\s*\(\d+\/\d+\)$/.test(desc)) {
                    desc = desc.replace(/\s*\(\d+\/\d+\)$/, '').trim();
                }
                return { ...t, description: desc };
            });
        }
        return MOCK_TRANSACTIONS;
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
      if (saved) {
        const parsed = JSON.parse(saved) as Bill[];
        // Filter out recurring bill instances beyond December of their starting year
        const groupMinYear: Record<string, number> = {};
        parsed.forEach(b => {
          if (b.groupId && b.recurrence !== 'none') {
            const y = parseInt(b.dueDate.split('-')[0], 10);
            if (!groupMinYear[b.groupId] || y < groupMinYear[b.groupId]) {
              groupMinYear[b.groupId] = y;
            }
          }
        });

        return parsed.filter(b => {
          if (b.groupId && b.recurrence !== 'none' && groupMinYear[b.groupId]) {
            const y = parseInt(b.dueDate.split('-')[0], 10);
            return y === groupMinYear[b.groupId];
          }
          return true;
        }).map(b => {
          let desc = b.description;
          if (desc.includes('(Recorrente')) {
            desc = desc.replace(/\s*\(Recorrente(\s+\d+\/\d+)?\)/gi, '').trim();
          }
          return { ...b, description: desc };
        });
      }
      return [];
    } catch {
      return [];
    }
  });

  const [incomeReminders, setIncomeReminders] = useState<IncomeReminder[]>(() => {
    try {
      const saved = localStorage.getItem('finance_income_reminders');
      if (saved) {
        const parsed = JSON.parse(saved) as IncomeReminder[];
        const groupMinYear: Record<string, number> = {};
        parsed.forEach(i => {
          if (i.groupId && i.recurrence !== 'none') {
            const y = parseInt(i.dueDate.split('-')[0], 10);
            if (!groupMinYear[i.groupId] || y < groupMinYear[i.groupId]) {
              groupMinYear[i.groupId] = y;
            }
          }
        });

        return parsed.filter(i => {
          if (i.groupId && i.recurrence !== 'none' && groupMinYear[i.groupId]) {
            const y = parseInt(i.dueDate.split('-')[0], 10);
            return y === groupMinYear[i.groupId];
          }
          return true;
        });
      }
      return [];
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

  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState<number>(() => {
    return Number(localStorage.getItem('finance_monthly_budget_limit')) || 0;
  });

  const handleMonthlyBudgetLimitChange = async (limit: number) => {
    setMonthlyBudgetLimit(limit);
    saveToLocal('finance_monthly_budget_limit', limit.toString());
    if (session) {
      await supabase.auth.updateUser({
        data: { monthlyBudgetLimit: limit }
      });
    }
  };

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

  // Push notifications state for upcoming bills (< 2 days)
  const [urgentBillsForToast, setUrgentBillsForToast] = useState<Bill[]>([]);
  const [hasDismissedToast, setHasDismissedToast] = useState(false);

  useEffect(() => {
    if (bills.length > 0) {
      const urgent = checkAndNotifyUpcomingBills(bills);
      if (urgent.length > 0 && !hasDismissedToast) {
        setUrgentBillsForToast(urgent);
      }
    }
  }, [bills, hasDismissedToast]);

  const toggleDashboardConfig = (key: keyof typeof dashboardConfig) => {
    const newConfig = { ...dashboardConfig, [key]: !dashboardConfig[key] };
    setDashboardConfig(newConfig);
    saveToLocal('finance_dashboard_config', newConfig);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveToLocal('finance_theme', theme);
  }, [theme]);


  useEffect(() => {
    if (session) {
      const loadData = async () => {
        try {
          const txs = await db.getTransactions();
          if (txs.length > 0) setTransactions(txs);
          
          const cats = await db.getCategories();
          if (cats.length > 0) setCategories(cats);
          
          const cards = await db.getCreditCards();
          if (cards.length > 0) setCreditCards(cards);
          
          const fetchedBills = await db.getBills();
          if (fetchedBills.length > 0) setBills(fetchedBills);
          
          const fetchedIncomes = await db.getIncomeReminders();
          if (fetchedIncomes.length > 0) setIncomeReminders(fetchedIncomes);
          
          const fetchedInvestments = await db.getInvestments();
          if (fetchedInvestments.length > 0) setInvestments(fetchedInvestments);
          
          const fetchedGoals = await db.getInvestmentGoals();
          if (fetchedGoals.length > 0) setInvestmentGoals(fetchedGoals);

          if (session?.user?.user_metadata?.monthlyBudgetLimit !== undefined) {
            setMonthlyBudgetLimit(Number(session.user.user_metadata.monthlyBudgetLimit));
          }
        } catch (e) {
          console.error("Error loading data from Supabase", e);
        }
      };
      loadData();
    }
  }, [session]);

  // --- Persistence ---
  const saveToLocal = (key: string, data: any) => {
    try {
      localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
    } catch (error) {
      if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.error('LocalStorage quota exceeded:', key);
        alert('Aviso: O limite de armazenamento do navegador foi atingido! Seus últimos dados podem não ter sido salvos. Recomendamos fazer login para salvar na nuvem.');
      }
    }
  };

  useEffect(() => {
    saveToLocal('finance_transactions', transactions);
  }, [transactions]);

  useEffect(() => {
    saveToLocal('finance_categories', categories);
  }, [categories]);

  useEffect(() => {
    saveToLocal('finance_bills', bills);
  }, [bills]);

  // Sync credit card bills based on transactions
  useEffect(() => {
    setBills(prevBills => {
      const nonCcBills = prevBills.filter(b => !b.id.startsWith('cc-invoice-'));
      const ccBillsMap = new Map<string, Bill>();

      // Retain existing cc bills to keep their isPaid and isManualAmount status
      prevBills.filter(b => b.id.startsWith('cc-invoice-')).forEach(b => {
        ccBillsMap.set(b.id, { ...b, amount: b.isManualAmount ? b.amount : 0 }); // Reset amount to recalculate only if not manual
      });

      transactions.forEach(t => {
        if (t.type === TransactionType.EXPENSE && t.paymentMethodId && t.paymentMethodId !== 'cash') {
          const card = creditCards.find(c => c.id === t.paymentMethodId);
          if (card) {
            const invoiceInfo = getCardInvoiceInfo(card, t.date, t.invoiceMonth);
            const invoiceId = `cc-invoice-${card.id}-${invoiceInfo.invoiceMonthStr}`;
            
            // Check if there is an existing bill under invoiceId or previous format
            let targetKey = invoiceId;
            if (!ccBillsMap.has(targetKey)) {
              for (const [k, v] of ccBillsMap.entries()) {
                if (k.startsWith(`cc-invoice-${card.id}-`) && v.dueDate === invoiceInfo.dueDateStr) {
                  targetKey = k;
                  break;
                }
              }
            }

            if (ccBillsMap.has(targetKey)) {
                const target = ccBillsMap.get(targetKey)!;
                if (!target.isManualAmount) {
                    target.amount += t.amount;
                }
            } else {
                ccBillsMap.set(invoiceId, {
                    id: invoiceId,
                    description: `Fatura ${card.name} (${invoiceInfo.invoiceShortLabel})`,
                    amount: t.amount,
                    dueDate: invoiceInfo.dueDateStr,
                    notifyDaysBefore: 3,
                    isPaid: false,
                    recurrence: 'none',
                    category: 'Cartão de Crédito',
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
    saveToLocal('finance_income_reminders', incomeReminders);
  }, [incomeReminders]);

  useEffect(() => {
    saveToLocal('finance_credit_cards', creditCards);
  }, [creditCards]);

  useEffect(() => {
    saveToLocal('finance_investments', investments);
  }, [investments]);

  useEffect(() => {
    saveToLocal('finance_investment_goals', investmentGoals);
  }, [investmentGoals]);

  // --- Handlers ---
  const handleNavigate = (view: string) => {
      setActiveView(view);
      setIsMobileSidebarOpen(false); // Close sidebar on mobile nav
  };

  const handleAddTransactions = async (newTransactionsData: Omit<Transaction, 'id'>[]) => {
    const newTransactions = newTransactionsData.map(t => ({
        ...t,
        id: crypto.randomUUID()
    }));
    if (session) await db.addTransactions(newTransactions, session.user.id);
    setTransactions(prev => [...newTransactions, ...prev]);
  };

  const handleEditTransaction = async (updatedTransaction: Transaction) => {
    if (session) await db.updateTransaction(updatedTransaction, session.user.id);
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  };

  const handleDeleteTransaction = async (id: string) => {
    if (session) await db.deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateTransactionStatus = async (id: string, newStatus: TransactionStatus) => {
    setTransactions(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, status: newStatus } : t);
      const tx = updated.find(t => t.id === id);
      if (tx && session) db.updateTransaction(tx, session.user.id);
      return updated;
    });
  };

  const handleAddCategory = async (category: CategoryOption) => {
    if (session) await db.addCategory(category, session.user.id);
    setCategories(prev => [...prev, category]);
  };

  const handleEditCategory = async (updatedCategory: CategoryOption) => {
    if (session) await db.updateCategory(updatedCategory, session.user.id);
    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };

  const handleDeleteCategory = async (id: string) => {
    if (session) await db.deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleAddBill = async (newBill: Omit<Bill, 'id' | 'isPaid'> & { id?: string }) => {
    const groupId = crypto.randomUUID();
    const billsToAdd: Bill[] = [];
    
    if (newBill.recurrence === 'none') {
        billsToAdd.push({
            ...newBill,
            id: newBill.id || crypto.randomUUID(),
            isPaid: false,
            groupId
        });
    } else if (newBill.recurrence === 'monthly') {
        const startDueDate = new Date(newBill.dueDate + 'T12:00:00');
        const startYear = startDueDate.getFullYear();
        let currentDueDate = new Date(startDueDate);
        
        // Contas recorrentes vão somente até dezembro do ano em questão
        while (currentDueDate.getFullYear() === startYear) {
            billsToAdd.push({
                ...newBill,
                id: crypto.randomUUID(),
                isPaid: false,
                dueDate: currentDueDate.toISOString().split('T')[0],
                groupId
            });
            
            const nextDate = new Date(currentDueDate);
            nextDate.setMonth(nextDate.getMonth() + 1);
            currentDueDate = nextDate;
        }
    } else if (newBill.recurrence === 'yearly') {
        // Apenas para o ano em questão
        billsToAdd.push({
            ...newBill,
            id: newBill.id || crypto.randomUUID(),
            isPaid: false,
            dueDate: newBill.dueDate,
            groupId
        });
    }
    
    if (session) await db.addBills(billsToAdd, session.user.id);
    setBills(prev => [...prev, ...billsToAdd]);
  };

  const handleEditBill = async (updatedBill: Bill) => {
    if (session) await db.updateBill(updatedBill, session.user.id);
    setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
  };

  const handleDeleteBill = async (id: string) => {
    if (session) await db.deleteBill(id);
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const handlePayBill = async (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;

    if (session) await db.updateBill({ ...bill, isPaid: true }, session.user.id);
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

  const handleUnpayBill = async (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;

    if (session) await db.updateBill({ ...bill, isPaid: false }, session.user.id);
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
  const handleAddIncome = async (newIncome: Omit<IncomeReminder, 'id' | 'isReceived'>) => {
    const groupId = crypto.randomUUID();
    const incomesToAdd: IncomeReminder[] = [];
    
    if (newIncome.recurrence === 'none') {
        incomesToAdd.push({
            ...newIncome,
            id: crypto.randomUUID(),
            isReceived: false,
            groupId
        });
    } else if (newIncome.recurrence === 'monthly') {
        const startDueDate = new Date(newIncome.dueDate + 'T12:00:00');
        const startYear = startDueDate.getFullYear();
        let currentDueDate = new Date(startDueDate);
        
        // Receitas recorrentes vão somente até dezembro do ano em questão
        while (currentDueDate.getFullYear() === startYear) {
            incomesToAdd.push({
                ...newIncome,
                id: crypto.randomUUID(),
                isReceived: false,
                dueDate: currentDueDate.toISOString().split('T')[0],
                groupId
            });
            
            const nextDate = new Date(currentDueDate);
            nextDate.setMonth(nextDate.getMonth() + 1);
            currentDueDate = nextDate;
        }
    } else if (newIncome.recurrence === 'yearly') {
        // Apenas para o ano em questão
        incomesToAdd.push({
            ...newIncome,
            id: crypto.randomUUID(),
            isReceived: false,
            dueDate: newIncome.dueDate,
            groupId
        });
    }
    
    if (session) await db.addIncomeReminders(incomesToAdd, session.user.id);
    setIncomeReminders(prev => [...prev, ...incomesToAdd]);
  };

  const handleEditIncome = async (updatedIncome: IncomeReminder) => {
    if (session) await db.updateIncomeReminder(updatedIncome, session.user.id);
    setIncomeReminders(prev => prev.map(i => i.id === updatedIncome.id ? updatedIncome : i));
  };

  const handleDeleteIncome = async (id: string) => {
    if (session) await db.deleteIncomeReminder(id);
    setIncomeReminders(prev => prev.filter(i => i.id !== id));
  };

  const handleReceiveIncome = async (id: string) => {
    const income = incomeReminders.find(i => i.id === id);
    if (!income) return;

    if (session) await db.updateIncomeReminder({ ...income, isReceived: true }, session.user.id);
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

  const handleUnreceiveIncome = async (id: string) => {
    const income = incomeReminders.find(i => i.id === id);
    if (!income) return;

    if (session) await db.updateIncomeReminder({ ...income, isReceived: false }, session.user.id);
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

  const handleUpdateCreditCard = async (updatedCard: CreditCard) => {
    if (session) await db.updateCreditCard(updatedCard, session.user.id);
    setCreditCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
  };

  const handleDeleteCreditCard = async (id: string) => {
    if (session) await db.deleteCreditCard(id);
    setCreditCards(prev => prev.filter(c => c.id !== id));
  };

  // Investment Handlers (Mocked for now as UI only requested display)
  const handleAddInvestment = async (inv: Investment) => {
    if (session) await db.addInvestment(inv, session.user.id);
    setInvestments(prev => [...prev, inv]);
  };
  const handleEditInvestment = async (updatedInv: Investment) => {
    if (session) await db.updateInvestment(updatedInv, session.user.id);
    setInvestments(prev => prev.map(i => i.id === updatedInv.id ? updatedInv : i));
  };
  const handleDeleteInvestment = async (id: string) => {
    if (session) await db.deleteInvestment(id);
    setInvestments(prev => prev.filter(i => i.id !== id));
  };
  const handleAddGoal = async (goal: InvestmentGoal) => {
    if (session) await db.addInvestmentGoal(goal, session.user.id);
    setInvestmentGoals(prev => [...prev, goal]);
  };
  const handleEditGoal = async (updatedGoal: InvestmentGoal) => {
    if (session) await db.updateInvestmentGoal(updatedGoal, session.user.id);
    setInvestmentGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g));
  };
  const handleDeleteGoal = async (id: string) => {
    if (session) await db.deleteInvestmentGoal(id);
    setInvestmentGoals(prev => prev.filter(g => g.id !== id));
  };

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

    // 2. Current Month Transactions (Realized)
    const currentTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        const tDateNormalized = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
        return tDateNormalized >= startOfSelectedMonth && tDateNormalized < startOfNextMonth;
    });

    const realizedIncome = currentTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

    const realizedExpense = currentTransactions
        .filter(t => t.type === TransactionType.EXPENSE && (!t.paymentMethodId || t.paymentMethodId === 'cash'))
        .reduce((sum, t) => sum + t.amount, 0);
    
    const realizedBalance = realizedIncome - realizedExpense;

    // 3. Pending bills & income for the selected month
    const pendingBillsThisMonth = bills.filter(b => {
      if (b.isPaid) return false;
      const bDate = new Date(b.dueDate + 'T12:00:00');
      return bDate.getFullYear() === year && bDate.getMonth() === month;
    }).reduce((sum, b) => sum + b.amount, 0);

    const pendingIncomeThisMonth = incomeReminders.filter(i => {
      if (i.isReceived) return false;
      const iDate = new Date(i.dueDate + 'T12:00:00');
      return iDate.getFullYear() === year && iDate.getMonth() === month;
    }).reduce((sum, i) => sum + i.amount, 0);

    // 4. Consolidated values for the month (Realized + Pending to receive/pay)
    const currentIncome = realizedIncome + pendingIncomeThisMonth;
    const currentExpense = realizedExpense + pendingBillsThisMonth;
    const currentBalance = currentIncome - currentExpense;

    // 5. Total Accumulated Balance (Available realized balance now)
    const totalAccumulatedBalance = previousBalance + realizedBalance;

    // 6. Budget Forecast (Previsão de orçamento)
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

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0) + investmentGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);

    return {
        previousBalance,
        realizedIncome,
        realizedExpense,
        realizedBalance,
        currentIncome,
        currentExpense,
        currentBalance,
        totalAccumulatedBalance,
        budgetForecast,
        pendingIncome: pendingIncomeThisMonth,
        pendingBills: pendingBillsThisMonth,
        totalInvested,
        monthlyTransactions: currentTransactions
    };

  }, [transactions, currentDate, bills, incomeReminders, investments, investmentGoals]);

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

  // --- Handlers & Export ---
  const handleReloadPage = () => {
    window.location.reload();
  };

  const handleExportPDF = () => {
    exportMonthlySummaryPDF({
      currentDate,
      budgetForecast: financialData.budgetForecast,
      totalAccumulatedBalance: financialData.totalAccumulatedBalance,
      totalInvested: financialData.totalInvested,
      currentIncome: financialData.currentIncome,
      currentExpense: financialData.currentExpense,
      currentBalance: financialData.currentBalance,
      monthlyTransactions: financialData.monthlyTransactions,
      categories,
      creditCards,
      monthlyBills,
      monthlyIncomes,
      userName: session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0]
    });
  };

  // --- Reusable Components ---
  const MonthSelector = () => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 md:mb-8">
        <div className="hidden sm:block w-36" />
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-colors" title="Mês anterior">
                <ChevronLeft size={20} />
            </button>
            <span className="w-40 md:w-48 text-center font-bold text-slate-800 dark:text-white select-none text-sm md:text-base">
                {formatCurrentMonth()}
            </span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-colors" title="Próximo mês">
                <ChevronRight size={20} />
            </button>
        </div>
        <div className="flex items-center justify-end gap-2 flex-wrap">
            <button
                onClick={() => setShowValues(!showValues)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm font-semibold text-xs md:text-sm transition-all hover:shadow active:scale-[0.98] cursor-pointer"
                title={showValues ? 'Ocultar valores' : 'Ver valores'}
            >
                {showValues ? <EyeOff size={16} className="text-slate-500 dark:text-slate-400" /> : <Eye size={16} className="text-slate-500 dark:text-slate-400" />}
                <span>{showValues ? 'Ocultar valores' : 'Ver valores'}</span>
            </button>
            <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm font-semibold text-xs md:text-sm transition-all hover:shadow hover:border-primary-400 dark:hover:border-primary-500 active:scale-[0.98]"
                title="Exportar Resumo do Mês em PDF (amigável para impressão)"
            >
                <FileDown size={18} className="text-primary-600 dark:text-primary-400" />
                <span>Exportar PDF</span>
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

                    {/* Alert for Monthly Budget Limit Exceeded */}
                    {monthlyBudgetLimit > 0 && financialData.currentExpense > monthlyBudgetLimit && (
                        <div className="mb-6 bg-gradient-to-r from-red-500/15 via-rose-500/10 to-red-500/5 border border-red-500/30 rounded-2xl p-4 md:p-5 shadow-sm animate-fade-in-down">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-red-500 text-white rounded-xl shrink-0 shadow-xs mt-0.5">
                                        <AlertTriangle size={22} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-red-900 dark:text-red-200 text-sm md:text-base flex items-center gap-2 flex-wrap">
                                            <span>Atenção: Limite de orçamento mensal ultrapassado!</span>
                                            <span className="text-xs px-2 py-0.5 rounded-full font-extrabold bg-red-600 text-white">
                                                {((financialData.currentExpense / monthlyBudgetLimit) * 100).toFixed(0)}% do limite
                                            </span>
                                        </h4>
                                        <p className="text-xs md:text-sm text-red-700 dark:text-red-300 mt-1">
                                            As despesas consolidadas de {formatCurrentMonth()} atingiram <strong>{showValues ? formatCurrency(financialData.currentExpense) : '••••'}</strong>, superando o teto definido de <strong>{showValues ? formatCurrency(monthlyBudgetLimit) : '••••'}</strong> em <strong>{showValues ? formatCurrency(financialData.currentExpense - monthlyBudgetLimit) : '••••'}</strong>.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveView('settings')}
                                    className="self-start sm:self-center text-xs font-bold text-red-700 dark:text-red-300 bg-red-100 hover:bg-red-200 dark:bg-red-950/60 dark:hover:bg-red-900/60 px-3.5 py-2 rounded-xl transition-colors border border-red-200 dark:border-red-800 shrink-0 cursor-pointer"
                                >
                                    Ajustar Limite
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Summary Cards - Updated with Rollover Logic */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        
                        {/* Accumulated Balance (Main) */}
                        <div className="no-invert bg-slate-900 p-5 md:p-6 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-none text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2 md:mb-3 flex-wrap">
                                    <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider">Previsão de orçamento</p>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-200 border border-slate-700 whitespace-nowrap shrink-0">
                                        Mês atual
                                    </span>
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4 tracking-tight">
                                    {showValues ? formatCurrency(financialData.budgetForecast) : 'R$ •••••'}
                                </h2>
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                        <History size={14} />
                                        <span>Saldo Atual: {showValues ? formatCurrency(financialData.totalAccumulatedBalance) : 'R$ •••••'}</span>
                                    </div>
                                    {(financialData.pendingIncome > 0 || financialData.pendingBills > 0) && (
                                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300">
                                            {financialData.pendingIncome > 0 && (
                                                <span className="text-emerald-400">+{showValues ? formatCurrency(financialData.pendingIncome) : '••••'} a entrar</span>
                                            )}
                                            {financialData.pendingIncome > 0 && financialData.pendingBills > 0 && <span>|</span>}
                                            {financialData.pendingBills > 0 && (
                                                <span className="text-amber-400">-{showValues ? formatCurrency(financialData.pendingBills) : '••••'} a pagar</span>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                        <TrendingUp size={14} className="text-green-400" />
                                        <span>Investimentos: {showValues ? formatCurrency(financialData.totalInvested) : 'R$ •••••'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Current Month Income (Consolidated: Realized + Pending) */}
                        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                            <div className="absolute top-4 right-4 p-2 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
                                <TrendingUp size={24} />
                            </div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 md:mb-3">Receitas</p>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                                {showValues ? formatCurrency(financialData.currentIncome) : 'R$ •••••'}
                            </h2>
                            <div className="flex items-center justify-between text-xs mt-2 font-medium flex-wrap gap-1">
                                <span className="text-slate-500 dark:text-slate-400">
                                    {financialData.pendingIncome > 0 
                                        ? `Recebido: ${showValues ? formatCurrency(financialData.realizedIncome) : '••••'}` 
                                        : 'Entradas deste mês'}
                                </span>
                                {financialData.pendingIncome > 0 && (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                                        +{showValues ? formatCurrency(financialData.pendingIncome) : '••••'} a entrar
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Current Month Expense (Consolidated: Realized + Pending) */}
                        <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                            <div className="absolute top-4 right-4 p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
                                <TrendingDown size={24} />
                            </div>
                            <div className="flex items-center gap-2 mb-2 md:mb-3">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Despesas</p>
                                {monthlyBudgetLimit > 0 && financialData.currentExpense > monthlyBudgetLimit && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 flex items-center gap-1">
                                        <AlertTriangle size={10} /> Excedido
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                                {showValues ? formatCurrency(financialData.currentExpense) : 'R$ •••••'}
                            </h2>
                            <div className="flex items-center justify-between text-xs mt-2 font-medium flex-wrap gap-1">
                                <span className="text-slate-500 dark:text-slate-400">
                                    {financialData.pendingBills > 0 
                                        ? `Pago: ${showValues ? formatCurrency(financialData.realizedExpense) : '••••'}` 
                                        : 'Saídas deste mês'}
                                </span>
                                {financialData.pendingBills > 0 && (
                                    <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                                        +{showValues ? formatCurrency(financialData.pendingBills) : '••••'} a pagar
                                    </span>
                                )}
                            </div>
                            {monthlyBudgetLimit > 0 && (
                                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                                    <div className="flex items-center justify-between text-[11px] mb-1">
                                        <span className="text-slate-400 font-medium">Teto: {showValues ? formatCurrency(monthlyBudgetLimit) : '••••'}</span>
                                        <span className={`font-bold ${financialData.currentExpense > monthlyBudgetLimit ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {((financialData.currentExpense / monthlyBudgetLimit) * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${financialData.currentExpense > monthlyBudgetLimit ? 'bg-red-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${Math.min((financialData.currentExpense / monthlyBudgetLimit) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Current Month Balance (Consolidated) - Highlighted with prominent green/red styling */}
                        <div className={`p-5 md:p-6 rounded-3xl shadow-xl transition-all relative overflow-hidden ${
                            financialData.currentBalance >= 0 
                                ? 'bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white shadow-emerald-500/25 dark:shadow-emerald-950/40 border border-emerald-500/40 ring-1 ring-emerald-400/30' 
                                : 'bg-gradient-to-br from-rose-600 via-rose-600 to-red-700 text-white shadow-rose-500/25 dark:shadow-rose-950/40 border border-rose-500/40 ring-1 ring-rose-400/30'
                        }`}>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2 md:mb-3">
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs md:text-sm font-bold uppercase tracking-wider text-white/90">Saldo do Mês</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                            financialData.currentBalance >= 0 ? 'bg-emerald-500/40 text-emerald-100 border border-emerald-400/40' : 'bg-rose-500/40 text-rose-100 border border-rose-400/40'
                                        }`}>
                                            {financialData.currentBalance >= 0 ? 'Positivo' : 'Negativo'}
                                        </span>
                                    </div>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-1.5">
                                    {showValues ? formatCurrency(financialData.currentBalance) : 'R$ •••••'}
                                </h2>
                                <div className="flex items-center justify-between text-xs text-white/80 font-medium">
                                    <span>Receitas − Despesas consolidadas</span>
                                    {(financialData.pendingIncome > 0 || financialData.pendingBills > 0) && (
                                        <span className="text-white/90 text-[11px] font-semibold bg-white/10 px-1.5 py-0.5 rounded">
                                            Realizado: {showValues ? formatCurrency(financialData.realizedBalance) : '••••'}
                                        </span>
                                    )}
                                </div>
                            </div>
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
                        allTransactions={transactions}
                        currentDate={currentDate}
                        bills={bills}
                        incomeReminders={incomeReminders}
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
                        onEditInvestment={handleEditInvestment}
                        onDeleteInvestment={handleDeleteInvestment}
                        onAddGoal={handleAddGoal}
                        onEditGoal={handleEditGoal}
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
                        monthlyBudgetLimit={monthlyBudgetLimit}
                        onMonthlyBudgetLimitChange={handleMonthlyBudgetLimitChange}
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
        <header className="h-16 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between px-3 md:px-8 sticky top-0 z-30">
            <div className="flex items-center gap-2 md:gap-3">
                <button 
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    title="Menu"
                >
                    <Menu size={22} />
                </button>
                <h1 className="font-bold text-slate-800 dark:text-white text-base md:text-lg capitalize truncate max-w-[170px] sm:max-w-xs md:max-w-none">
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
                </div>
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-2">
                <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-800 transition-colors cursor-pointer"
                    title="Alternar tema claro/escuro"
                >
                    {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} className="text-slate-600" />}
                </button>
                <button
                    onClick={handleReloadPage}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-xl border border-slate-200/80 dark:border-slate-800 transition-all shadow-xs flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                    title="Recarregar a página"
                >
                    <RotateCw size={15} className="text-blue-500" />
                    <span className="hidden sm:inline">Recarregar</span>
                </button>
            </div>
        </header>

        {/* Dynamic Content */}
        <main className="p-3.5 sm:p-5 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full flex-1">
            {renderContent()}
        </main>

        {/* Global Footer */}
        <footer className="w-full py-6 mt-auto border-t border-slate-200 dark:border-slate-700 dark:border-slate-800 text-center text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Criado por <a href="https://www.linkedin.com/in/brunosergiosilva/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium">Bruno Sergio</a>
        </footer>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_25px_rgba(0,0,0,0.1)]">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeView === 'dashboard'
              ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px]">Início</span>
        </button>

        <button
          onClick={() => setActiveView('transactions')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeView === 'transactions'
              ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <List size={20} />
          <span className="text-[10px]">Extrato</span>
        </button>

        {/* Central Add Button */}
        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsFormOpen(true);
          }}
          className="flex flex-col items-center justify-center -mt-5 bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white w-12 h-12 rounded-full shadow-lg shadow-blue-600/40 active:scale-95 transition-all border-2 border-white dark:border-slate-900 cursor-pointer"
          title="Nova transação"
        >
          <Plus size={24} />
        </button>

        <button
          onClick={() => setActiveView('investments')}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeView === 'investments'
              ? 'text-blue-600 dark:text-blue-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <TrendingUp size={20} />
          <span className="text-[10px]">Investir</span>
        </button>

        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            ['bills', 'income-reminders', 'credit-cards', 'categories', 'ai-advisor', 'settings'].includes(activeView)
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          <Menu size={20} />
          <span className="text-[10px]">Menu</span>
        </button>
      </nav>

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

      {/* Push Notification Floating Alert */}
      <PushNotificationToast 
        bills={urgentBillsForToast} 
        onPayBill={handlePayBill} 
        onDismiss={() => setHasDismissedToast(true)} 
      />
    </div>
  );
};

export default App;