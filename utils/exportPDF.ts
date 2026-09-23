import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Bill, IncomeReminder, CategoryOption, CreditCard, TransactionType } from '../types';

interface PDFExportData {
  currentDate: Date;
  budgetForecast: number;
  totalAccumulatedBalance: number;
  totalInvested: number;
  currentIncome: number;
  currentExpense: number;
  currentBalance: number;
  monthlyTransactions: Transaction[];
  categories: CategoryOption[];
  creditCards: CreditCard[];
  monthlyBills: Bill[];
  monthlyIncomes: IncomeReminder[];
  userName?: string;
}

export const exportMonthlySummaryPDF = (data: PDFExportData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const monthName = data.currentDate.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const year = data.currentDate.getFullYear();
  const periodStr = `${capitalizedMonth} de ${year}`;
  const generationDate = new Date().toLocaleString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // --- Header Styling ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 38, 'F');

  // Title & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Relatório Financeiro Mensal', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Período de Referência: ${periodStr}`, 14, 24);
  if (data.userName) {
    doc.text(`Usuário: ${data.userName}`, 14, 30);
  }

  // Right Side: Generation Timestamp
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`Gerado em: ${generationDate}`, 196, 24, { align: 'right' });
  doc.text('Finanças IA - Gestão Inteligente', 196, 30, { align: 'right' });

  // --- KPI Summary Box (Grid of 4 main metrics) ---
  const startY = 46;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50

  const cardWidth = 43;
  const cardHeight = 26;
  const cardGap = 4;
  const marginX = 14;

  const kpis = [
    {
      title: 'PREVISÃO ORÇAMENTO',
      value: formatCurrency(data.budgetForecast),
      sub: 'Acumulado + Pendências',
      color: [15, 23, 42],
      accent: [99, 102, 241] // indigo
    },
    {
      title: 'RECEITAS DO MÊS',
      value: formatCurrency(data.currentIncome),
      sub: 'Total de entradas',
      color: [5, 150, 105], // emerald-600
      accent: [16, 185, 129]
    },
    {
      title: 'DESPESAS DO MÊS',
      value: formatCurrency(data.currentExpense),
      sub: 'Total de saídas à vista',
      color: [225, 29, 72], // rose-600
      accent: [244, 63, 94]
    },
    {
      title: 'SALDO DO MÊS',
      value: formatCurrency(data.currentBalance),
      sub: data.currentBalance >= 0 ? 'Resultado Positivo' : 'Resultado Negativo',
      color: data.currentBalance >= 0 ? [5, 150, 105] : [225, 29, 72],
      accent: data.currentBalance >= 0 ? [16, 185, 129] : [244, 63, 94],
      isHighlight: true
    }
  ];

  kpis.forEach((kpi, index) => {
    const x = marginX + index * (cardWidth + cardGap);
    
    if (kpi.isHighlight) {
      if (data.currentBalance >= 0) {
        doc.setFillColor(236, 253, 245); // emerald-50
        doc.setDrawColor(167, 243, 208); // emerald-200
      } else {
        doc.setFillColor(255, 241, 242); // rose-50
        doc.setDrawColor(254, 205, 211); // rose-200
      }
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
    }

    doc.roundedRect(x, startY, cardWidth, cardHeight, 2.5, 2.5, 'FD');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, x + 3.5, startY + 6.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, x + 3.5, startY + 15);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, x + 3.5, startY + 21.5);
  });

  // Secondary summary line (Accumulated & Investments)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Saldo em Conta Atual: ${formatCurrency(data.totalAccumulatedBalance)}   |   Total Investido: ${formatCurrency(data.totalInvested)}`,
    marginX,
    startY + cardHeight + 6
  );

  // --- Category Breakdown Table (Expenses) ---
  const expenseByCategoryMap: Record<string, number> = {};
  data.monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .forEach(t => {
      const catName = data.categories.find(c => c.id === t.category)?.label || t.category || 'Outros';
      expenseByCategoryMap[catName] = (expenseByCategoryMap[catName] || 0) + t.amount;
    });

  const categoryEntries = Object.entries(expenseByCategoryMap)
    .sort((a, b) => b[1] - a[1]);

  const categoryRows = categoryEntries.map(([name, amt]) => {
    const pct = data.currentExpense > 0 ? ((amt / data.currentExpense) * 100).toFixed(1) + '%' : '0%';
    return [name, formatCurrency(amt), pct];
  });

  let currentY = startY + cardHeight + 12;

  if (categoryRows.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Despesas por Categoria', marginX, currentY);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Categoria', 'Valor Total', '% do Total de Despesas']],
      body: categoryRows,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontSize: 8.5,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 42, halign: 'center' }
      },
      margin: { left: marginX, right: marginX }
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- Transactions Statement Table ---
  const sortedTransactions = [...data.monthlyTransactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const txRows = sortedTransactions.map(t => {
    const formattedDate = new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
    const catLabel = data.categories.find(c => c.id === t.category)?.label || t.category || '-';
    let paymentMethod = 'Dinheiro / Conta';
    if (t.paymentMethodId && t.paymentMethodId !== 'cash') {
      const card = data.creditCards.find(c => c.id === t.paymentMethodId);
      paymentMethod = card ? `Cartão: ${card.name}` : 'Cartão de Crédito';
    }
    const isIncome = t.type === TransactionType.INCOME;
    const typeLabel = isIncome ? 'Receita' : 'Despesa';
    const amountStr = (isIncome ? '+ ' : '- ') + formatCurrency(t.amount);

    return [formattedDate, t.description, catLabel, paymentMethod, typeLabel, amountStr];
  });

  // Check if we need page break or can fit transactions
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Extrato de Lançamentos do Mês (${sortedTransactions.length})`, marginX, currentY);

  if (txRows.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Nenhuma movimentação registrada para este mês.', marginX, currentY + 7);
  } else {
    autoTable(doc, {
      startY: currentY + 3,
      head: [['Data', 'Descrição', 'Categoria', 'Forma Pagto.', 'Tipo', 'Valor']],
      body: txRows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255,
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85]
      },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center' },
        1: { cellWidth: 54 },
        2: { cellWidth: 32 },
        3: { cellWidth: 34 },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (hookData) => {
        if (hookData.section === 'body' && hookData.column.index === 5) {
          const rawVal = hookData.cell.raw as string;
          if (rawVal && rawVal.startsWith('+')) {
            hookData.cell.styles.textColor = [5, 150, 105]; // green
          } else {
            hookData.cell.styles.textColor = [225, 29, 72]; // red
          }
        }
      },
      margin: { left: marginX, right: marginX }
    });
  }

  // --- Add Page Numbers & Footer ---
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    
    // Line above footer
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, 287, 196, 287);

    doc.text('Finanças IA • Documento Oficial para Impressão e Auditoria', marginX, 292);
    doc.text(`Página ${i} de ${totalPages}`, 196, 292, { align: 'right' });
  }

  // Save the PDF
  const filename = `Resumo_Financeiro_${capitalizedMonth}_${year}.pdf`;
  doc.save(filename);
};
