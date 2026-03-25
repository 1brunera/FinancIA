const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Add import
code = code.replace("import { supabase } from './services/supabase';", "import { supabase } from './services/supabase';\nimport { db } from './services/db';");

// Update handleAddTransactions
code = code.replace(
  "const handleAddTransactions = (newTransactionsData: Omit<Transaction, 'id'>[]) => {\n    const newTransactions = newTransactionsData.map(t => ({\n        ...t,\n        id: crypto.randomUUID()\n    }));\n    setTransactions(prev => [...newTransactions, ...prev]);\n  };",
  "const handleAddTransactions = async (newTransactionsData: Omit<Transaction, 'id'>[]) => {\n    const newTransactions = newTransactionsData.map(t => ({\n        ...t,\n        id: crypto.randomUUID()\n    }));\n    if (session) await db.addTransactions(newTransactions, session.user.id);\n    setTransactions(prev => [...newTransactions, ...prev]);\n  };"
);

// Update handleEditTransaction
code = code.replace(
  "const handleEditTransaction = (updatedTransaction: Transaction) => {\n    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));\n  };",
  "const handleEditTransaction = async (updatedTransaction: Transaction) => {\n    if (session) await db.updateTransaction(updatedTransaction, session.user.id);\n    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));\n  };"
);

// Update handleDeleteTransaction
code = code.replace(
  "const handleDeleteTransaction = (id: string) => {\n    setTransactions(prev => prev.filter(t => t.id !== id));\n  };",
  "const handleDeleteTransaction = async (id: string) => {\n    if (session) await db.deleteTransaction(id);\n    setTransactions(prev => prev.filter(t => t.id !== id));\n  };"
);

// Update handleUpdateTransactionStatus
code = code.replace(
  "const handleUpdateTransactionStatus = (id: string, newStatus: TransactionStatus) => {\n    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));\n  };",
  "const handleUpdateTransactionStatus = async (id: string, newStatus: TransactionStatus) => {\n    setTransactions(prev => {\n      const updated = prev.map(t => t.id === id ? { ...t, status: newStatus } : t);\n      const tx = updated.find(t => t.id === id);\n      if (tx && session) db.updateTransaction(tx, session.user.id);\n      return updated;\n    });\n  };"
);

// Update handleAddCategory
code = code.replace(
  "const handleAddCategory = (category: CategoryOption) => {\n    setCategories(prev => [...prev, category]);\n  };",
  "const handleAddCategory = async (category: CategoryOption) => {\n    if (session) await db.addCategory(category, session.user.id);\n    setCategories(prev => [...prev, category]);\n  };"
);

// Update handleEditCategory
code = code.replace(
  "const handleEditCategory = (updatedCategory: CategoryOption) => {\n    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));\n  };",
  "const handleEditCategory = async (updatedCategory: CategoryOption) => {\n    if (session) await db.updateCategory(updatedCategory, session.user.id);\n    setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));\n  };"
);

// Update handleDeleteCategory
code = code.replace(
  "const handleDeleteCategory = (id: string) => {\n    setCategories(prev => prev.filter(c => c.id !== id));\n  };",
  "const handleDeleteCategory = async (id: string) => {\n    if (session) await db.deleteCategory(id);\n    setCategories(prev => prev.filter(c => c.id !== id));\n  };"
);

// Update handleAddCreditCard
code = code.replace(
  "const handleAddCreditCard = (card: Omit<CreditCard, 'id'>) => {\n    const newCard = { ...card, id: crypto.randomUUID() };\n    setCreditCards(prev => [...prev, newCard]);\n  };",
  "const handleAddCreditCard = async (card: Omit<CreditCard, 'id'>) => {\n    const newCard = { ...card, id: crypto.randomUUID() };\n    if (session) await db.addCreditCard(newCard, session.user.id);\n    setCreditCards(prev => [...prev, newCard]);\n  };"
);

// Update handleUpdateCreditCard
code = code.replace(
  "const handleUpdateCreditCard = (updatedCard: CreditCard) => {\n    setCreditCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));\n  };",
  "const handleUpdateCreditCard = async (updatedCard: CreditCard) => {\n    if (session) await db.updateCreditCard(updatedCard, session.user.id);\n    setCreditCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));\n  };"
);

// Update handleDeleteCreditCard
code = code.replace(
  "const handleDeleteCreditCard = (id: string) => {\n    setCreditCards(prev => prev.filter(c => c.id !== id));\n  };",
  "const handleDeleteCreditCard = async (id: string) => {\n    if (session) await db.deleteCreditCard(id);\n    setCreditCards(prev => prev.filter(c => c.id !== id));\n  };"
);

// Add useEffect to fetch data on session change
const fetchEffect = `
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
        } catch (e) {
          console.error("Error loading data from Supabase", e);
        }
      };
      loadData();
    }
  }, [session]);
`;

code = code.replace("  // --- Persistence ---", fetchEffect + "\n  // --- Persistence ---");

fs.writeFileSync('App.tsx', code);
