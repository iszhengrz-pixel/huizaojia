
import React from 'react';
import Icon from './Icon';
import ToolCard from './ToolCard';
import { ALL_TOOLS_CATEGORIZED } from '../constants';

interface ToolManagementViewProps {
  selectedToolIds: string[];
  onToggleTool: (id: string) => void;
  onBack: () => void;
}

const ToolManagementView: React.FC<ToolManagementViewProps> = ({ 
  selectedToolIds, 
  onToggleTool, 
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">管理工具</h1>
            <p className="text-slate-500 text-sm">选择并勾选工具卡片，定制您的专属工作面板</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-slate-400">
            已选中 <span className="text-blue-600 font-black">{selectedToolIds.length}</span> 个工具
          </span>
          <button 
            onClick={onBack}
            className="bg-blue-600 text-white px-8 py-2.5 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            完成设置
          </button>
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
                    onClick={() => onToggleTool(tool.id)}
                    selectable
                    selected={selectedToolIds.includes(tool.id)}
                    onToggle={() => onToggleTool(tool.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Floating Info Banner */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
        <div className="bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center">
              <Icon name="Lightbulb" size={20} className="text-white" />
            </div>
            <p className="text-sm font-medium">选中的工具将即时显示在“我的工具”区域</p>
          </div>
          <Icon name="Sparkles" size={20} className="text-blue-400 opacity-50" />
        </div>
      </div>
    </div>
  );
};

export default ToolManagementView;
