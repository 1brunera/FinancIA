import React, { useState } from 'react';
import { Plus, Trash2, Tag, Edit2, X } from 'lucide-react';
import { CategoryOption, BudgetGroup } from '../types';
import { COLOR_PALETTE } from '../constants';

interface CategoryManagerProps {
  categories: CategoryOption[];
  onAddCategory: (category: CategoryOption) => void;
  onEditCategory: (category: CategoryOption) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  categories, 
  onAddCategory, 
  onEditCategory,
  onDeleteCategory, 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [budgetGroup, setBudgetGroup] = useState<BudgetGroup>('wants');
  const [budget, setBudget] = useState<string>('');

  const resetForm = () => {
    setEditingId(null);
    setNewLabel('');
    setSelectedColor(COLOR_PALETTE[0]);
    setBudgetGroup('wants');
    setBudget('');
  };

  const handleEditClick = (cat: CategoryOption) => {
    setEditingId(cat.id);
    setNewLabel(cat.label);
    setSelectedColor(cat.color);
    setBudgetGroup(cat.budgetGroup || 'wants');
    setBudget(cat.budget ? cat.budget.toString() : '');
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel) return;
    
    const parsedBudget = budget ? parseFloat(budget) : undefined;
    
    if (editingId) {
      const existingCat = categories.find(c => c.id === editingId);
      if (existingCat) {
        onEditCategory({
          ...existingCat,
          label: newLabel,
          color: selectedColor,
          budgetGroup: budgetGroup,
          budget: parsedBudget
        });
      }
      resetForm();
      return;
    }

    const id = newLabel.toLowerCase().trim().replace(/\s+/g, '-');
    
    if (categories.some(c => c.id === id)) {
        alert('Uma categoria com este nome já existe.');
        return;
    }

    onAddCategory({
      id,
      label: newLabel,
      color: selectedColor,
      isCustom: true,
      budgetGroup: budgetGroup,
      budget: parsedBudget
    });
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <Tag className="text-primary-600" size={24} />
             Gerenciar categorias
           </h2>
           <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Personalize os grupos de suas receitas e despesas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden sticky top-24">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800 dark:text-white">
                        {editingId ? 'Editar categoria' : 'Nova categoria'}
                    </h3>
                    {editingId && (
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <X size={16} />
                        </button>
                    )}
                </div>
                <form onSubmit={handleAdd} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nome</label>
                        <input
                            type="text"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            placeholder="Ex: Viagem, Assinaturas"
                            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Grupo de Orçamento</label>
                        <select
                            value={budgetGroup}
                            onChange={(e) => setBudgetGroup(e.target.value as BudgetGroup)}
                            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white dark:bg-slate-900"
                        >
                            <option value="needs">Essenciais</option>
                            <option value="wants">Lazer</option>
                            <option value="savings">Investimentos</option>
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">Define onde esta categoria se encaixa no modelo 50/30/20.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Orçamento Mensal (Opcional)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                placeholder="0,00"
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Cor da etiqueta</label>
                        <div className="flex flex-wrap gap-3">
                            {COLOR_PALETTE.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 rounded-full transition-all hover:scale-110 shadow-sm ${selectedColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                    <button 
                        type="submit"
                        className="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                    >
                        {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                        {editingId ? 'Salvar alterações' : 'Criar categoria'}
                    </button>
                </form>
            </div>
        </div>

        {/* Categories Grid */}
        <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Categorias ativas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-white dark:bg-slate-900 hover:shadow-md transition-all group">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-4 mb-1">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: cat.color + '20' }}>
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-200 font-semibold text-sm">{cat.label}</span>
                                </div>
                                <div className="flex items-center gap-2 ml-12">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                                        {cat.budgetGroup === 'needs' ? 'Essenciais' : 
                                         cat.budgetGroup === 'wants' ? 'Lazer' : 
                                         cat.budgetGroup === 'savings' ? 'Investimentos' : 'Geral'}
                                    </span>
                                    {cat.budget && (
                                        <span className="text-[10px] font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                                            R$ {cat.budget.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => handleEditClick(cat)}
                                    className="p-2 text-slate-300 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 size={18} />
                                </button>
                                {cat.isCustom ? (
                                    <button 
                                        onClick={() => onDeleteCategory(cat.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                ) : (
                                    <span className="text-xs text-slate-400 italic px-2">Padrão</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};