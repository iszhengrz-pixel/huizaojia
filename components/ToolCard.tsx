
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

  const isActivatedPaid = tool.pricingType === 'paid' && tool.isActivated;
  const isPendingPaid = tool.pricingType === 'paid' && !tool.isActivated;

  const renderTitleBadge = () => {
    if (!tool.pricingType) return null;

    if (isActivatedPaid) {
      // 已开通标识：橙色渐变风格
      return (
        <div className="inline-flex items-center h-[18px] ml-2 bg-gradient-to-r from-[#fff1dc] to-[#ffe4be] rounded-full pr-2 overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)] shrink-0 border border-[#ffcf87]/30">
          <div 
            className="h-full px-1 bg-gradient-to-br from-[#ffc86d] to-[#ff9d2d] flex items-center justify-center shadow-[inset_-1px_0_1px_rgba(0,0,0,0.05)]" 
            style={{ clipPath: 'polygon(0% 0%, 82% 0%, 100% 50%, 82% 100%, 0% 100%)' }}
          >
            <Icon name="Zap" size={8} className="text-[#8a5d13] fill-[#8a5d13]/40" strokeWidth={3} />
          </div>
          <span className="text-[10px] font-black text-[#8a5d13] ml-1 tracking-tighter leading-none">已开通</span>
        </div>
      );
    }

    if (isPendingPaid) {
      // 未开通标识：灰色风格
      return (
        <div className="inline-flex items-center h-[18px] ml-2 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full pr-2 overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] shrink-0 border border-slate-300/30">
          <div 
            className="h-full px-1 bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center" 
            style={{ clipPath: 'polygon(0% 0%, 82% 0%, 100% 50%, 82% 100%, 0% 100%)' }}
          >
             <Icon name="Lock" size={8} className="text-slate-700 fill-slate-700/20" strokeWidth={3} />
          </div>
          <span className="text-[10px] font-black text-slate-700 ml-1 tracking-tighter leading-none">未开通</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div 
      onClick={onClick}
      className={`group relative bg-white rounded-2xl p-4 border transition-all duration-500 cursor-pointer flex items-center space-x-4 overflow-hidden ${
        selectable && selected ? 'border-blue-500 shadow-md bg-blue-50/10' : 'border-slate-100'
      } ${
        isActivatedPaid 
          ? 'border-amber-200/50 shadow-[0_8px_20px_rgba(245,158,11,0.06)]' 
          : 'shadow-sm'
      } hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-0.5`}
    >
      {/* 图标容器 */}
      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm ${getIconColor(tool.id)}`}>
        <Icon name={tool.icon} size={24} />
      </div>

      {/* 文字区域 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-0.5 overflow-hidden">
          <h3 className={`font-bold text-sm truncate group-hover:text-blue-600 transition-colors ${isActivatedPaid ? 'text-slate-900' : 'text-slate-800'}`}>
            {tool.name}
          </h3>
          {renderTitleBadge()}
        </div>
        <p className="text-slate-400 text-[12px] truncate leading-tight">
          {tool.description || '高效智能造价辅助工具'}
        </p>
      </div>

      {/* 统一右侧动作按钮区域 */}
      <div className="flex items-center space-x-1 shrink-0">
        {selectable ? (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onToggle?.(e);
            }}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
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
      
      {/* 统一背景光效处理：移至末尾防止干扰 Flex space-x 布局 */}
      {isActivatedPaid && (
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-50/10 via-transparent to-transparent pointer-events-none"></div>
      )}

      {/* 热门标识 */}
      {tool.isHot && (
        <div className="absolute top-0 right-0 pointer-events-none">
          <div className="bg-gradient-to-tr from-red-600 to-rose-400 text-white text-[8px] px-1.5 py-0.5 rounded-bl-lg font-black shadow-sm uppercase tracking-tighter">
            Hot
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolCard;
