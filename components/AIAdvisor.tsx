import React, { useState } from 'react';
import { Sparkles, Loader2, MessageSquare } from 'lucide-react';
import { Transaction } from '../types';
import { analyzeFinances } from '../services/geminiService';
import ReactMarkdown from 'react-markdown'; // Wait, standard libraries only. We'll use simple text rendering or dangerouslySetInnerHTML is risky. We'll just split by newlines.

interface AIAdvisorProps {
  transactions: Transaction[];
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ transactions }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (transactions.length === 0) return;
    
    setLoading(true);
    try {
      const result = await analyzeFinances(transactions);
      setAdvice(result);
    } catch (e) {
      setAdvice("Não foi possível gerar a análise. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Basic markdown-ish parsing for bold and bullet points for display
      let content = line;
      const isBullet = line.trim().startsWith('*') || line.trim().startsWith('-');
      const isHeader = line.trim().startsWith('#') || line.trim().match(/^\d+\./);
      
      const className = isHeader 
        ? "font-bold text-slate-800 mt-2 block" 
        : isBullet 
          ? "ml-4 text-slate-600 block mb-1"
          : "text-slate-600 block mb-1";
          
       // Remove markdown symbols for cleaner view
       content = content.replace(/^#+\s/, '').replace(/^[\*\-]\s/, '• ');
       // Bold handling (**text**)
       const parts = content.split(/(\*\*.*?\*\*)/g);

      return (
        <p key={i} className={className}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-slate-800">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100 shadow-sm relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-100 rounded-full blur-2xl opacity-50"></div>

        <div className="flex items-start gap-4 relative z-10">
            <div className="bg-white p-3 rounded-lg shadow-sm text-indigo-600">
                <Sparkles size={24} />
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Consultor Financeiro AI</h3>
                <p className="text-sm text-slate-600 mb-4">
                    Obtenha insights personalizados sobre seus hábitos de consumo com a inteligência do Google Gemini.
                </p>

                {!advice && !loading && (
                    <button 
                        onClick={handleAnalyze}
                        disabled={transactions.length < 2}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MessageSquare size={16} />
                        Gerar Análise
                    </button>
                )}

                {loading && (
                    <div className="flex items-center gap-2 text-indigo-600 font-medium animate-pulse">
                        <Loader2 size={18} className="animate-spin" />
                        Analisando seus dados...
                    </div>
                )}

                {advice && !loading && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-indigo-100 text-sm leading-relaxed shadow-sm">
                        {renderContent(advice)}
                        <button 
                            onClick={() => setAdvice(null)}
                            className="mt-4 text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                        >
                            Gerar nova análise
                        </button>
                    </div>
                )}
                
                {transactions.length < 2 && !advice && (
                   <p className="text-xs text-slate-400 mt-2">
                     Adicione pelo menos 2 transações para habilitar a análise.
                   </p>
                )}
            </div>
        </div>
    </div>
  );
};