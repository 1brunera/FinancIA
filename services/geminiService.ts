import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Bill } from '../types';

export interface DailyTipData {
  title: string;
  tip: string;
  actionableStep: string;
  categoryHighlighted?: string;
  potentialSavingEstimate?: string;
}

const getClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

export const analyzeFinances = async (transactions: Transaction[]): Promise<string> => {
  try {
    const ai = getClient();
    if (!ai) {
      return "Para utilizar o consultor com IA, verifique a configuração da chave Gemini no servidor.";
    }
    
    // Prepare data for the prompt
    const transactionSummary = transactions.map(t => 
      `- ${t.date}: ${t.description} (${t.type}) - R$ ${t.amount.toFixed(2)} [Categoria: ${t.category}]`
    ).join('\n');

    const prompt = `
      Atue como um consultor financeiro pessoal experiente.
      Analise a seguinte lista de transações financeiras recentes e forneça um resumo conciso e 3 conselhos práticos para melhorar a saúde financeira.
      
      Transações:
      ${transactionSummary}

      Formato da resposta:
      1. Uma breve análise do saldo e hábitos (máx 2 frases).
      2. Três bullet points com conselhos acionáveis.
      
      Mantenha o tom profissional, encorajador e direto. Responda em Português.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar uma análise no momento.";
  } catch (error) {
    console.error("Error analyzing finances:", error);
    return "Desculpe, ocorreu um erro ao conectar com o assistente inteligente.";
  }
};

export const getDailySavingTip = async (
  monthName: string,
  currentIncome: number,
  currentExpense: number,
  transactions: Transaction[],
  bills: Bill[]
): Promise<DailyTipData> => {
  // Aggregate expenses by category
  const expensesByCategory: Record<string, number> = {};
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  expenseTransactions.forEach(t => {
    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
  });

  const sortedCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => `${cat}: R$ ${amount.toFixed(2)}`)
    .join(', ');

  const pendingBills = bills.filter(b => !b.isPaid).map(b => `${b.description} (R$ ${b.amount.toFixed(2)})`).join(', ');

  try {
    const ai = getClient();
    if (ai) {
      const prompt = `
        Você é um especialista em finanças pessoais e economia comportamental brasileira.
        Analise o cenário financeiro do usuário referente ao mês de ${monthName}:
        - Receitas no mês: R$ ${currentIncome.toFixed(2)}
        - Despesas no mês: R$ ${currentExpense.toFixed(2)}
        - Maiores categorias de gastos: ${sortedCategories || 'Sem despesas cadastradas ainda'}
        - Contas a pagar pendentes: ${pendingBills || 'Nenhuma'}

        Sua missão: Gerar UMA DICA DO DIA prática, inteligente e com foco em ação imediata de economia para este mês.
        Retorne estritamente um JSON no seguinte formato:
        {
          "title": "Título chamativo e direto (máx 6 palavras)",
          "tip": "Explicação da dica conectada ao comportamento financeiro (2 a 3 frases claras)",
          "actionableStep": "Uma ação prática específica para fazer hoje (1 frase)",
          "categoryHighlighted": "Categoria principal relacionada (ex: Alimentação, Lazer, Assinaturas, Mercado, Reserva)"
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              tip: { type: Type.STRING },
              actionableStep: { type: Type.STRING },
              categoryHighlighted: { type: Type.STRING }
            },
            required: ["title", "tip", "actionableStep", "categoryHighlighted"]
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim()) as DailyTipData;
        if (parsed.title && parsed.tip && parsed.actionableStep) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.error("Gemini daily tip error, using fallback:", err);
  }

  // High quality context-aware fallback if offline or during API delay
  const topCategory = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a)[0];
  if (topCategory && topCategory[1] > 0) {
    return {
      title: `Otimize seus gastos em ${topCategory[0]}`,
      tip: `Sua maior categoria de despesas em ${monthName} é ${topCategory[0]} (R$ ${topCategory[1].toFixed(2)}). Reduzir pequenos excessos nessa área pode gerar uma economia imediata de até 15% sem abrir mão da qualidade.`,
      actionableStep: `Revise seus últimos 3 gastos em ${topCategory[0]} e identifique um item supérfluo para cortar ou substituir nesta semana.`,
      categoryHighlighted: topCategory[0]
    };
  }

  if (currentExpense > currentIncome && currentIncome > 0) {
    return {
      title: 'Equilíbrio de Gastos Urgente',
      tip: `Neste mês suas despesas superaram as receitas. Focar em congelar compras não essenciais pelos próximos 7 dias restabelece o fluxo positivo.`,
      actionableStep: 'Liste apenas as despesas essenciais obrigatórias para o restante do mês e adie qualquer compra por impulso.',
      categoryHighlighted: 'Orçamento Geral'
    };
  }

  return {
    title: 'A Regra das 24 Horas para Compras',
    tip: `Evitar gastos por impulso é o método mais rápido de poupar até 20% do orçamento mensal. Ao sentir vontade de comprar algo não essencial, espere 24 horas antes de decidir.`,
    actionableStep: 'Anote qualquer desejo de compra em uma lista de espera de 24 horas antes de passar o cartão hoje.',
    categoryHighlighted: 'Consumo Consciente'
  };
};
