import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeFinances = async (transactions: Transaction[]): Promise<string> => {
  try {
    const ai = getClient();
    
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
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar uma análise no momento.";
  } catch (error) {
    console.error("Error analyzing finances:", error);
    return "Desculpe, ocorreu um erro ao conectar com o assistente inteligente. Verifique sua chave de API.";
  }
};