const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

// Update handleAddBill
code = code.replace(
  "setBills(prev => [...prev, ...billsToAdd]);",
  "if (session) await db.addBills(billsToAdd, session.user.id);\n    setBills(prev => [...prev, ...billsToAdd]);"
);
code = code.replace(
  "const handleAddBill = (newBill: Omit<Bill, 'id' | 'isPaid'> & { id?: string }) => {",
  "const handleAddBill = async (newBill: Omit<Bill, 'id' | 'isPaid'> & { id?: string }) => {"
);

// Update handleEditBill
code = code.replace(
  "const handleEditBill = (updatedBill: Bill) => {\n    setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));\n  };",
  "const handleEditBill = async (updatedBill: Bill) => {\n    if (session) await db.updateBill(updatedBill, session.user.id);\n    setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));\n  };"
);

// Update handleDeleteBill
code = code.replace(
  "const handleDeleteBill = (id: string) => {\n    setBills(prev => prev.filter(b => b.id !== id));\n  };",
  "const handleDeleteBill = async (id: string) => {\n    if (session) await db.deleteBill(id);\n    setBills(prev => prev.filter(b => b.id !== id));\n  };"
);

// Update handlePayBill
code = code.replace(
  "const handlePayBill = (id: string) => {",
  "const handlePayBill = async (id: string) => {"
);
code = code.replace(
  "setBills(prev => prev.map(b => b.id === id ? { ...b, isPaid: true } : b));",
  "if (session) await db.updateBill({ ...bill, isPaid: true }, session.user.id);\n    setBills(prev => prev.map(b => b.id === id ? { ...b, isPaid: true } : b));"
);

// Update handleUnpayBill
code = code.replace(
  "const handleUnpayBill = (id: string) => {",
  "const handleUnpayBill = async (id: string) => {"
);
code = code.replace(
  "setBills(prev => prev.map(b => b.id === id ? { ...b, isPaid: false } : b));",
  "if (session) await db.updateBill({ ...bill, isPaid: false }, session.user.id);\n    setBills(prev => prev.map(b => b.id === id ? { ...b, isPaid: false } : b));"
);

// Update handleAddIncome
code = code.replace(
  "setIncomeReminders(prev => [...prev, ...incomesToAdd]);",
  "if (session) await db.addIncomeReminders(incomesToAdd, session.user.id);\n    setIncomeReminders(prev => [...prev, ...incomesToAdd]);"
);
code = code.replace(
  "const handleAddIncome = (newIncome: Omit<IncomeReminder, 'id' | 'isReceived'> & { id?: string }) => {",
  "const handleAddIncome = async (newIncome: Omit<IncomeReminder, 'id' | 'isReceived'> & { id?: string }) => {"
);

// Update handleEditIncome
code = code.replace(
  "const handleEditIncome = (updatedIncome: IncomeReminder) => {\n    setIncomeReminders(prev => prev.map(i => i.id === updatedIncome.id ? updatedIncome : i));\n  };",
  "const handleEditIncome = async (updatedIncome: IncomeReminder) => {\n    if (session) await db.updateIncomeReminder(updatedIncome, session.user.id);\n    setIncomeReminders(prev => prev.map(i => i.id === updatedIncome.id ? updatedIncome : i));\n  };"
);

// Update handleDeleteIncome
code = code.replace(
  "const handleDeleteIncome = (id: string) => {\n    setIncomeReminders(prev => prev.filter(i => i.id !== id));\n  };",
  "const handleDeleteIncome = async (id: string) => {\n    if (session) await db.deleteIncomeReminder(id);\n    setIncomeReminders(prev => prev.filter(i => i.id !== id));\n  };"
);

// Update handleReceiveIncome
code = code.replace(
  "const handleReceiveIncome = (id: string) => {",
  "const handleReceiveIncome = async (id: string) => {"
);
code = code.replace(
  "setIncomeReminders(prev => prev.map(i => i.id === id ? { ...i, isReceived: true } : i));",
  "if (session) await db.updateIncomeReminder({ ...income, isReceived: true }, session.user.id);\n    setIncomeReminders(prev => prev.map(i => i.id === id ? { ...i, isReceived: true } : i));"
);

// Update handleUnreceiveIncome
code = code.replace(
  "const handleUnreceiveIncome = (id: string) => {",
  "const handleUnreceiveIncome = async (id: string) => {"
);
code = code.replace(
  "setIncomeReminders(prev => prev.map(i => i.id === id ? { ...i, isReceived: false } : i));",
  "if (session) await db.updateIncomeReminder({ ...income, isReceived: false }, session.user.id);\n    setIncomeReminders(prev => prev.map(i => i.id === id ? { ...i, isReceived: false } : i));"
);

// Update handleAddInvestment
code = code.replace(
  "const handleAddInvestment = (inv: Investment) => setInvestments(prev => [...prev, inv]);",
  "const handleAddInvestment = async (inv: Investment) => {\n    if (session) await db.addInvestment(inv, session.user.id);\n    setInvestments(prev => [...prev, inv]);\n  };"
);

// Update handleDeleteInvestment
code = code.replace(
  "const handleDeleteInvestment = (id: string) => setInvestments(prev => prev.filter(i => i.id !== id));",
  "const handleDeleteInvestment = async (id: string) => {\n    if (session) await db.deleteInvestment(id);\n    setInvestments(prev => prev.filter(i => i.id !== id));\n  };"
);

// Update handleAddGoal
code = code.replace(
  "const handleAddGoal = (goal: InvestmentGoal) => setInvestmentGoals(prev => [...prev, goal]);",
  "const handleAddGoal = async (goal: InvestmentGoal) => {\n    if (session) await db.addInvestmentGoal(goal, session.user.id);\n    setInvestmentGoals(prev => [...prev, goal]);\n  };"
);

// Update handleDeleteGoal
code = code.replace(
  "const handleDeleteGoal = (id: string) => setInvestmentGoals(prev => prev.filter(g => g.id !== id));",
  "const handleDeleteGoal = async (id: string) => {\n    if (session) await db.deleteInvestmentGoal(id);\n    setInvestmentGoals(prev => prev.filter(g => g.id !== id));\n  };"
);

// Update useEffect to load the new data
const oldFetchEffect = `
          const cats = await db.getCategories();
          if (cats.length > 0) setCategories(cats);
          
          const cards = await db.getCreditCards();
          if (cards.length > 0) setCreditCards(cards);
`;
const newFetchEffect = `
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
`;
code = code.replace(oldFetchEffect, newFetchEffect);

fs.writeFileSync('App.tsx', code);
