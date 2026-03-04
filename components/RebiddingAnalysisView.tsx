import React from 'react';
import Icon from './Icon';

const RebiddingAnalysisView: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="w-20 h-20 bg-violet-50 text-violet-600 rounded-[28px] flex items-center justify-center mx-auto shadow-inner">
          <Icon name="BarChartHorizontal" size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800">回标分析</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            回标分析模块正在建设中。系统将通过多维度数据建模，自动比对各投标单位的报价规律，精准识别不平衡报价、围标串标风险及单价异常波动，为评标决策提供科学依据。
          </p>
        </div>
        <div className="pt-4">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-100 rounded-full shadow-sm">
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Under Construction</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RebiddingAnalysisView;
