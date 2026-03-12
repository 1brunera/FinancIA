import { CategoryOption, Investment, InvestmentGoal } from './types';

export const EXPENSE_CATEGORIES: CategoryOption[] = [
  { id: 'moradia', label: 'Moradia', color: '#3b82f6', budgetGroup: 'needs' }, // Essencial
  { id: 'alimentacao', label: 'Alimentação', color: '#ef4444', budgetGroup: 'needs' }, // Essencial
  { id: 'transporte', label: 'Transporte', color: '#f59e0b', budgetGroup: 'needs' }, // Essencial
  { id: 'saude', label: 'Saúde', color: '#10b981', budgetGroup: 'needs' }, // Essencial
  { id: 'educacao', label: 'Educação', color: '#06b6d4', budgetGroup: 'needs' }, // Essencial
  
  { id: 'lazer', label: 'Lazer', color: '#8b5cf6', budgetGroup: 'wants' }, // Desejo/Estilo de vida
  { id: 'compras', label: 'Compras', color: '#ec4899', budgetGroup: 'wants' }, // Desejo
  { id: 'assinaturas', label: 'Assinaturas', color: '#f43f5e', budgetGroup: 'wants' }, // Desejo
  
  { id: 'investimentos', label: 'Investimentos', color: '#6366f1', budgetGroup: 'savings' }, // Objetivos
  { id: 'dividas', label: 'Pagamento de Dívidas', color: '#475569', budgetGroup: 'savings' }, // Objetivos
  { id: 'impostos', label: 'Impostos', color: '#78716c', budgetGroup: 'needs' }, // Essencial
  
  { id: 'outros', label: 'Outros', color: '#64748b', budgetGroup: 'wants' }, // Default para Wants geralmente
];

export const INCOME_CATEGORIES: CategoryOption[] = [
  { id: 'salario', label: 'Salário', color: '#22c55e', budgetGroup: 'none' }, 
  { id: 'comissoes', label: 'Comissões', color: '#10b981', budgetGroup: 'none' },
  { id: 'servicos', label: 'Prestação de Serviços', color: '#0ea5e9', budgetGroup: 'none' }, 
  { id: 'dividendos', label: 'Dividendos', color: '#8b5cf6', budgetGroup: 'none' }, 
  { id: 'aluguel_recebido', label: 'Aluguéis', color: '#f59e0b', budgetGroup: 'none' },
  { id: 'outras_receitas', label: 'Outras Receitas', color: '#94a3b8', budgetGroup: 'none' }, 
];

export const DEFAULT_CATEGORIES: CategoryOption[] = [
  ...INCOME_CATEGORIES,
  ...EXPENSE_CATEGORIES
];

export const MOCK_TRANSACTIONS = [
  {
    id: '1',
    description: 'Salário Mensal',
    amount: 5000,
    type: 'income',
    category: 'salario',
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: '2',
    description: 'Aluguel',
    amount: 1500,
    type: 'expense',
    category: 'moradia',
    date: new Date().toISOString().split('T')[0]
  },
  {
    id: '3',
    description: 'Supermercado',
    amount: 600,
    type: 'expense',
    category: 'alimentacao',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0]
  },
  {
    id: '4',
    description: 'Uber',
    amount: 45,
    type: 'expense',
    category: 'transporte',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0]
  },
  {
    id: '5',
    description: 'Div. MXRF11',
    amount: 15.50,
    type: 'income',
    category: 'dividendos',
    date: new Date(Date.now() - 432000000).toISOString().split('T')[0] // 5 days ago
  }
];

export const MOCK_INVESTMENTS: Investment[] = [
  { id: '1', name: 'Tesouro Selic 2029', amount: 8000, type: 'fixed', isLiquidity: true },
  { id: '2', name: 'Nubank (Caixinha)', amount: 3500, type: 'fixed', isLiquidity: true },
  { id: '3', name: 'IVVB11', amount: 2500, type: 'foreign', isLiquidity: false },
  { id: '4', name: 'MXRF11', amount: 1200, type: 'fii', isLiquidity: false },
  { id: '5', name: 'Bitcoin', amount: 800, type: 'crypto', isLiquidity: false },
  { id: '6', name: 'PETR4', amount: 1500, type: 'stock', isLiquidity: false },
];

export const MOCK_GOALS: InvestmentGoal[] = [
  { 
    id: '1', 
    name: 'Viagem Europa', 
    targetAmount: 20000, 
    currentAmount: 4500, 
    deadline: '2025-12-31' 
  },
  { 
    id: '2', 
    name: 'Trocar de Carro', 
    targetAmount: 60000, 
    currentAmount: 12000, 
    deadline: '2026-06-30' 
  }
];

export const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', 
  '#10b981', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', 
  '#8b5cf6', '#d946ef', '#f43f5e', '#64748b'
];