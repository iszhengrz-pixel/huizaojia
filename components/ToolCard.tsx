
import React from 'react';
import Icon from './Icon';
import { ToolItem } from '../types';

interface ToolCardProps {
  tool: ToolItem;
  onClick: () => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick }) => {
  const getIconColor = (id: string) => {
    const colors = [
      'bg-blue-50 text-blue-600',
      'bg-emerald-50 text-emerald-600',
      'bg-amber-50 text-amber-600',
      'bg-rose-50 text-rose-600',
      'bg-indigo-50 text-indigo-600',
      'bg-purple-50 text-purple-600',
      'bg-cyan-50 text-cyan-600',
    ];
    // Simple deterministic color choice
    const index = (tool.name.length + (tool.id.length)) % colors.length;
    return colors[index];
  };

  return (
    <div 
      onClick={onClick}
      className="group relative bg-white rounded-2xl p-4 border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer flex items-center space-x-4 overflow-hidden"
    >
      {/* Icon Container */}
      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${getIconColor(tool.id)}`}>
        <Icon name={tool.icon} size={24} />
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-slate-800 font-bold text-sm mb-0.5 truncate group-hover:text-blue-600 transition-colors">
          {tool.name}
        </h3>
        <p className="text-slate-400 text-[12px] truncate leading-tight">
          {tool.description || '高效智能造价辅助工具'}
        </p>
      </div>

      {/* Decorative Arrow (Appears on Hover) */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
        <Icon name="ChevronRight" size={16} className="text-blue-400" />
      </div>
      
      {/* Hot Badge */}
      {tool.isHot && (
        <div className="absolute top-0 right-0">
          <div className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-bl-lg font-bold shadow-sm">
            HOT
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolCard;
