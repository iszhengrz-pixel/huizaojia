
import React from 'react';
import Icon from './Icon';
import ToolCard from './ToolCard';
import { ALL_TOOLS_CATEGORIZED } from '../constants';
import { ToolItem } from '../types';

interface AllToolsViewProps {
  onSelectTool: (tool: ToolItem) => void;
  onBack: () => void;
}

const AllToolsView: React.FC<AllToolsViewProps> = ({ 
  onSelectTool, 
  onBack 
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
          >
            <Icon name="ArrowLeft" size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">全部工具</h1>
            <p className="text-slate-500 text-sm">汇聚工程造价全流程提效工具</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
          {ALL_TOOLS_CATEGORIZED.map((cat, idx) => (
            <section key={cat.category} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-1.5 h-6 rounded-full ${
                  idx === 0 ? 'bg-blue-600' : 
                  idx === 1 ? 'bg-emerald-500' : 
                  idx === 2 ? 'bg-amber-500' : 'bg-indigo-500'
                }`}></div>
                <h2 className="text-xl font-bold text-slate-800">{cat.category}</h2>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {cat.tools.length}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {cat.tools.map(tool => (
                  <ToolCard 
                    key={tool.id} 
                    tool={tool} 
                    onClick={() => onSelectTool(tool)}
                    selectable={false}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AllToolsView;
