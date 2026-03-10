import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  Receipt, 
  BrainCircuit, 
  ChevronLeft, 
  ChevronRight,
  CreditCard,
  Tag,
  X,
  Banknote,
  ChevronDown,
  TrendingUp,
  List,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';
import { supabase } from '../services/supabase';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  isExpanded: boolean;
  toggleSidebar: () => void;
  isMobileOpen?: boolean;
  closeMobileSidebar?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onNavigate, 
  isExpanded, 
  toggleSidebar,
  isMobileOpen = false,
  closeMobileSidebar
}) => {
  const [isManagementOpen, setIsManagementOpen] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Helper to check if a child is active
  const isManagementActive = ['transactions', 'bills', 'income-reminders', 'credit-cards', 'categories'].includes(activeView);

  const managementItems = [
    { id: 'transactions', label: 'Histórico', icon: List },
    { id: 'bills', label: 'Contas a Pagar', icon: Receipt },
    { id: 'income-reminders', label: 'A Receber', icon: Banknote },
    { id: 'credit-cards', label: 'Cartões', icon: CreditCard },
    { id: 'categories', label: 'Categorias', icon: Tag },
  ];

  return (
    <div 
      className={`no-invert bg-black h-screen fixed left-0 top-0 text-white transition-all duration-300 z-50 flex flex-col 
      ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'} 
      ${isExpanded ? 'md:w-64' : 'md:w-20'}`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between md:justify-center border-b border-gray-900 px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="bg-primary-600 p-1.5 rounded-lg shrink-0">
             <Wallet className="w-6 h-6 text-white" />
          </div>
          {(isExpanded || isMobileOpen) && (
            <span className="font-bold text-xl tracking-tight whitespace-nowrap opacity-100 transition-opacity duration-300">
              Finanças<span className="text-primary-500">IA</span>
            </span>
          )}
        </div>
        
        {/* Mobile Close Button */}
        <button 
            onClick={closeMobileSidebar}
            className="md:hidden text-gray-400 hover:text-white"
        >
            <X size={24} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
        {/* Dashboard */}
        <button
          onClick={() => onNavigate('dashboard')}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
            activeView === 'dashboard' 
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' 
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
          }`}
          title={(!isExpanded && !isMobileOpen) ? 'Dashboard' : ''}
        >
          <LayoutDashboard size={22} className="shrink-0" />
          {(isExpanded || isMobileOpen) && (
            <span className="font-medium whitespace-nowrap overflow-hidden">Dashboard</span>
          )}
        </button>

        {/* Investments */}
        <button
          onClick={() => onNavigate('investments')}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
            activeView === 'investments' 
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/20' 
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
          }`}
          title={(!isExpanded && !isMobileOpen) ? 'Investimentos' : ''}
        >
          <TrendingUp size={22} className="shrink-0" />
          {(isExpanded || isMobileOpen) && (
            <span className="font-medium whitespace-nowrap overflow-hidden">Investimentos</span>
          )}
        </button>

        {/* Separator */}
        <div className="h-px bg-gray-900 my-2"></div>

        {/* Gestão Group (Collapsible) */}
        <div className="space-y-1">
            <button
                onClick={() => {
                    if (!isExpanded && !isMobileOpen) {
                        // If collapsed sidebar, clicking main icon goes to transactions list default
                        onNavigate('transactions'); 
                    } else {
                        setIsManagementOpen(!isManagementOpen);
                    }
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    isManagementActive ? 'text-white bg-gray-900' : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                }`}
                title={(!isExpanded && !isMobileOpen) ? 'Gestão' : ''}
            >
                <div className="flex items-center gap-3">
                    <Wallet size={22} className="shrink-0" />
                    {(isExpanded || isMobileOpen) && (
                        <span className="font-medium whitespace-nowrap overflow-hidden">Gestão</span>
                    )}
                </div>
                {(isExpanded || isMobileOpen) && (
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isManagementOpen ? 'rotate-180' : ''}`} />
                )}
            </button>

            {/* Submenu */}
            {((isExpanded || isMobileOpen) && isManagementOpen) && (
                <div className="ml-4 pl-4 border-l border-gray-800 space-y-1 mt-1 animate-fade-in">
                    {managementItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-all ${
                                    isActive 
                                    ? 'text-primary-400 font-bold bg-gray-900/50' 
                                    : 'text-gray-500 hover:text-white hover:bg-gray-900/30'
                                }`}
                            >
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>

        {/* AI Advisor */}
        <button
          onClick={() => onNavigate('ai-advisor')}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
            activeView === 'ai-advisor' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
              : 'text-indigo-400 hover:bg-indigo-900/20 hover:text-indigo-300'
          }`}
          title={(!isExpanded && !isMobileOpen) ? 'Consultor IA' : ''}
        >
          <BrainCircuit size={22} className="shrink-0" />
          {(isExpanded || isMobileOpen) && (
            <span className="font-medium whitespace-nowrap overflow-hidden">Consultor IA</span>
          )}
        </button>

        {/* Settings */}
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
            activeView === 'settings' 
              ? 'bg-gray-800 text-white shadow-lg shadow-gray-900/20' 
              : 'text-gray-400 hover:bg-gray-900 hover:text-white'
          }`}
          title={(!isExpanded && !isMobileOpen) ? 'Configurações' : ''}
        >
          <SettingsIcon size={22} className="shrink-0" />
          {(isExpanded || isMobileOpen) && (
            <span className="font-medium whitespace-nowrap overflow-hidden">Configurações</span>
          )}
        </button>

      </nav>

      {/* Footer / Toggle */}
      <div className="p-4 border-t border-gray-900 space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-red-400 hover:bg-red-900/20 hover:text-red-300"
          title={(!isExpanded && !isMobileOpen) ? 'Sair' : ''}
        >
          <LogOut size={22} className="shrink-0" />
          {(isExpanded || isMobileOpen) && (
            <span className="font-medium whitespace-nowrap overflow-hidden">Sair</span>
          )}
        </button>

        <button
          onClick={toggleSidebar}
          className="hidden md:flex w-full items-center justify-center p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </div>
  );
};