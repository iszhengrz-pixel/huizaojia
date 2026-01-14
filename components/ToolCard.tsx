
import React from 'react';
import Icon from './Icon';
import { ToolItem } from '../types';

interface ToolCardProps {
  tool: ToolItem;
  onClick: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: (e: React.MouseEvent) => void;
  onShare?: (tool: ToolItem, e: React.MouseEvent) => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (toolId: string, e: React.MouseEvent) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ 
  tool, 
  onClick, 
  selectable, 
  selected, 
  onToggle,
  onShare,
  isFavorite,
  onFavoriteToggle
}) => {
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
    const index = (tool.name.length + (tool.id.length)) % colors.length;
    return colors[index];
  };

  return (
    <div 
      onClick={onClick}
      className={`group relative bg-white rounded-2xl p-4 border transition-all duration-300 cursor-pointer flex items-center space-x-4 overflow-hidden ${
        selectable && selected ? 'border-blue-500 shadow-md bg-blue-50/10' : 'border-slate-100'
      } hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5`}
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

      {/* Actions */}
      <div className="flex items-center space-x-1">
        {onFavoriteToggle && !selectable && (
          <button
            onClick={(e) => onFavoriteToggle(tool.id, e)}
            className={`p-1.5 rounded-lg transition-all ${
              isFavorite ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50 opacity-0 group-hover:opacity-100'
            }`}
            title={isFavorite ? "取消收藏" : "加入收藏"}
          >
            <Icon name="Star" size={16} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        )}
        
        {onShare && !selectable && (
          <button
            onClick={(e) => onShare(tool, e)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
            title="分享工具"
          >
            <Icon name="Share2" size={16} />
          </button>
        )}

        {selectable ? (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.(e);
            }}
            className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
              selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-white group-hover:border-blue-400'
            }`}
          >
            {selected && <Icon name="Check" size={14} strokeWidth={3} />}
          </div>
        ) : (
          <div className="text-slate-200 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300">
            <Icon name="ChevronRight" size={16} />
          </div>
        )}
      </div>
      
      {tool.isHot && (
        <div className="absolute top-0 right-0 pointer-events-none">
          <div className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-bl-lg font-bold shadow-sm">
            HOT
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolCard;
