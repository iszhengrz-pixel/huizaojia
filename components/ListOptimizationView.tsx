import React from 'react';
import Icon from './Icon';
import { ALL_TOOLS } from '../constants';

interface ListOptimizationViewProps {
  onSelectTool: (toolId: string) => void;
}

const LIST_OPTIMIZATION_TOOLS = [
  'ok-contract',
  'price-file-compare',
  'price-file-compare-2',
  'material-price-consistency'
];

const ListOptimizationView: React.FC<ListOptimizationViewProps> = ({ onSelectTool }) => {
  const tools = ALL_TOOLS.filter(t => LIST_OPTIMIZATION_TOOLS.includes(t.id));

  // Define some gradients and colors for the cards to make them look nice like FeeCalculator
  const toolStyles: Record<string, { color: string, gradient: string }> = {
    'ok-contract': { color: 'text-blue-600', gradient: 'from-blue-50 to-indigo-50' },
    'price-file-compare': { color: 'text-emerald-600', gradient: 'from-emerald-50 to-teal-50' },
    'price-file-compare-2': { color: 'text-amber-600', gradient: 'from-amber-50 to-orange-50' },
    'material-price-consistency': { color: 'text-rose-600', gradient: 'from-rose-50 to-pink-50' },
    'rebidding-analysis': { color: 'text-violet-600', gradient: 'from-violet-50 to-purple-50' },
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            <h2 className="text-xl font-bold text-slate-800">清单优算</h2>
          </div>
          <p className="text-slate-500 text-sm ml-4 font-medium">
            智能对比清单量价差异，深度解析计价文件，为您提供全方位的清单优化与审核解决方案。
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-12">
          {tools.map((tool) => {
            const style = toolStyles[tool.id] || { color: 'text-blue-600', gradient: 'from-blue-50 to-indigo-50' };
            return (
              <div 
                key={tool.id} 
                onClick={() => onSelectTool(tool.id)}
                className="group bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-300 transition-all duration-500 cursor-pointer flex flex-col h-full active:scale-95"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center ${style.color} mb-5 transition-transform group-hover:scale-110 shadow-sm`}>
                  <Icon name={tool.icon} size={24} />
                </div>
                <h3 className="text-base font-black text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{tool.name}</h3>
                <p className="text-slate-400 text-[11px] font-medium leading-relaxed flex-1 line-clamp-2">{tool.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ListOptimizationView;
