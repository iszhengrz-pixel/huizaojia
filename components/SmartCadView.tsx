import React, { useState } from 'react';
import Icon from './Icon';
import AICadDiffView from './AICadDiffView';
import AICadViewerView from './AICadViewerView';

type CadModule = 'selection' | 'viewer' | 'compare';

interface CadCategory {
  id: CadModule;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
}

const CAD_CATEGORIES: CadCategory[] = [
  {
    id: 'viewer',
    name: 'CAD智能看图',
    description: '智能识别 CAD 图纸构件，支持明细提取与秒级反查，大幅提升大型图纸阅读效率。',
    icon: 'Maximize',
    color: 'text-blue-600',
    gradient: 'from-blue-50 to-indigo-50',
  },
  {
    id: 'compare',
    name: 'AI图纸对比',
    description: '采用像素级对比技术，自动识别并高亮两版图纸间的增、删、改差异，辅助精准审核。',
    icon: 'Dna',
    color: 'text-amber-600',
    gradient: 'from-amber-50 to-orange-50',
  }
];

const SmartCadView: React.FC = () => {
  // 默认进入选择模式页面
  const [activeModule, setActiveModule] = useState<CadModule>('selection');

  const renderSelectionGrid = () => (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 bg-slate-50/50">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* 顶部介绍 */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            <h2 className="text-xl font-bold text-slate-800">智能 CAD 综合工具箱</h2>
          </div>
          <p className="text-slate-500 text-sm ml-4 font-medium">集成 AI 视觉与矢量解析技术，为您提供全方位的工程图纸处理解决方案。</p>
        </div>

        {/* 卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {CAD_CATEGORIES.map((cat) => (
            <div 
              key={cat.id} 
              onClick={() => setActiveModule(cat.id)}
              className="group bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-300 transition-all duration-500 cursor-pointer flex flex-col h-full active:scale-95"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center ${cat.color} mb-5 transition-transform group-hover:scale-110 shadow-sm`}>
                <Icon name={cat.icon} size={24} />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{cat.name}</h3>
              <p className="text-slate-400 text-[11px] font-medium leading-relaxed flex-1 line-clamp-2">{cat.description}</p>
            </div>
          ))}
        </div>

        {/* 底部宣传特性 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
          <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col justify-center min-h-[200px] shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-4">技术优势</h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3 text-slate-300 text-sm font-medium">
                  <Icon name="CheckCircle2" size={18} className="text-blue-400 shrink-0" />
                  <span>支持最新 2025 版本 DWG 文件直接识别</span>
                </li>
                <li className="flex items-center space-x-3 text-slate-300 text-sm font-medium">
                  <Icon name="CheckCircle2" size={18} className="text-blue-400 shrink-0" />
                  <span>像素级差异比对，错误率低于 0.01%</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="bg-blue-600 rounded-[40px] p-8 text-white relative overflow-hidden flex flex-col justify-center text-center shadow-xl shadow-blue-500/20">
             <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full -mr-32 -mb-32"></div>
             <div className="relative z-10">
               <div className="inline-block px-4 py-1 bg-white/20 rounded-lg text-[10px] font-black tracking-widest uppercase mb-4">生产力工具</div>
               <h3 className="text-2xl font-black mb-2">云端解析，极速看图</h3>
               <p className="text-blue-100 opacity-80 text-sm font-medium">告别笨重的本地软件，随时随地开启图纸审核。</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeModule) {
      case 'viewer':
        return (
          <AICadViewerView onBack={() => setActiveModule('selection')} />
        );
      case 'compare':
        return (
          <AICadDiffView onBack={() => setActiveModule('selection')} />
        );
      default:
        return renderSelectionGrid();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {renderContent()}
    </div>
  );
};

export default SmartCadView;