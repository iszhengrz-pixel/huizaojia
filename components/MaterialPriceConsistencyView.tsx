import React from 'react';
import Icon from './Icon';

const MaterialPriceConsistencyView: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[28px] flex items-center justify-center mx-auto shadow-inner">
          <Icon name="Scale" size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800">相同材料单价一致性对比</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            该功能正在全力研发中。它将支持智能对比相同材料在不同清单项或不同文件中的单价差异，帮助您快速定位价格偏差，确保造价的一致性与准确性。
          </p>
        </div>
        <div className="pt-4">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-100 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialPriceConsistencyView;
