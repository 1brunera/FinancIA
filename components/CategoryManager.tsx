import React, { useState } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { CategoryOption, BudgetGroup } from '../types';
import { COLOR_PALETTE } from '../constants';

interface CategoryManagerProps {
  categories: CategoryOption[];
  onAddCategory: (category: CategoryOption) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  categories, 
  onAddCategory, 
  onDeleteCategory, 
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [budgetGroup, setBudgetGroup] = useState<BudgetGroup>('wants');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel) return;
    
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
      budgetGroup: budgetGroup
    });
    setNewLabel('');
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <Tag className="text-primary-600" size={24} />
             Gerenciar categorias
           </h2>
           <p className="text-slate-500 text-sm mt-1">Personalize os grupos de suas receitas e despesas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-24">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800">Nova categoria</h3>
                </div>
                <form onSubmit={handleAdd} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome</label>
                        <input
                            type="text"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            placeholder="Ex: Viagem, Assinaturas"
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Grupo de Orçamento</label>
                        <select
                            value={budgetGroup}
                            onChange={(e) => setBudgetGroup(e.target.value as BudgetGroup)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white"
                        >
                            <option value="needs">Essencial (Necessidades)</option>
                            <option value="wants">Estilo de Vida (Desejos)</option>
                            <option value="savings">Objetivos (Dívidas/Investimentos)</option>
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">Define onde esta categoria se encaixa no modelo 50/30/20.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cor da etiqueta</label>
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
                        <Plus size={18} /> Criar categoria
                    </button>
                </form>
            </div>
        </div>

        {/* Categories Grid */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Categorias ativas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {categories.map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white hover:shadow-md transition-all group">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-4 mb-1">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: cat.color + '20' }}>
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                    </div>
                                    <span className="text-slate-700 font-semibold text-sm">{cat.label}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 ml-12 uppercase tracking-wide">
                                    {cat.budgetGroup === 'needs' ? 'Essencial' : 
                                     cat.budgetGroup === 'wants' ? 'Estilo de Vida' : 
                                     cat.budgetGroup === 'savings' ? 'Objetivos' : 'Geral'}
                                </span>
                            </div>
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
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};