const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

code = code.replace(
  "const handleAddIncome = (newIncome: Omit<IncomeReminder, 'id' | 'isReceived'>) => {",
  "const handleAddIncome = async (newIncome: Omit<IncomeReminder, 'id' | 'isReceived'>) => {"
);

fs.writeFileSync('App.tsx', code);
