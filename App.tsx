
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Icon from './components/Icon';
import ToolCard from './components/ToolCard';
import AIChatView from './components/AIChatView';
import DateCalculatorView from './components/DateCalculatorView';
import TaxCalculatorView from './components/TaxCalculatorView';
import AIVisionView from './components/AIVisionView';
import OKContractCompareView from './components/OKContractCompareView';
import ProfileView from './components/ProfileView';
import { HOT_TOOLS, MY_TOOLS } from './constants';

const App: React.FC = () => {
  const [activeId, setActiveId] = useState('home');
  const [activeSubId, setActiveSubId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (id: string, subId?: string) => {
    setActiveId(id);
    setActiveSubId(subId || '');
  };

  const renderContent = () => {
    // Sub-view Routing
    if (activeSubId === 'ok-date-calc') {
      return <DateCalculatorView />;
    }
    
    if (activeSubId === 'ok-tax-calc') {
      return <TaxCalculatorView />;
    }

    if (activeSubId === 'ai-vision') {
      return <AIVisionView />;
    }

    if (activeSubId === 'ok-contract') {
      return <OKContractCompareView />;
    }

    if (activeSubId === 'profile') {
      return <ProfileView />;
    }

    if (activeId === 'ai-qa' && activeSubId) {
      const categoryLabels: Record<string, string> = {
        'qa-2024-list': '2024清单咨询',
        'qa-quota': '定额解释',
        'qa-indicators': '指标数据',
        'qa-policy': '政策文件',
      };
      return <AIChatView category={categoryLabels[activeSubId] || '造价咨询'} />;
    }

    if (activeId === 'home') {
      return (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header / Search */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">智能造价工具箱</h1>
                  <p className="text-slate-500 mt-2">汇聚全行业最前沿的造价、计量、计价智能助手</p>
                </div>
                <div className="flex items-center space-x-4">
                  <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all relative">
                    <Icon name="Bell" size={22} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  </button>
                  <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                    <Icon name="Settings" size={22} />
                  </button>
                </div>
              </div>

              <div className="relative group max-w-3xl">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <Icon name="Search" size={20} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="搜索工程量计算器、定额、2024清单政策..."
                  className="block w-full pl-14 pr-32 py-4 bg-white border border-slate-200 rounded-3xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-base text-slate-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="absolute right-3 top-2.5 bottom-2.5 bg-blue-600 text-white px-8 rounded-2xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 active:scale-95 transform">
                  搜索
                </button>
              </div>
            </div>

            {/* Hot Tools Section */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">热门工具</h2>
                </div>
                <button className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center transition-colors">
                  查看全部 <Icon name="ChevronRight" size={14} className="ml-1" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {HOT_TOOLS.map(tool => (
                  <ToolCard key={tool.id} tool={tool} onClick={() => {
                    if(tool.id === 'h6') handleSelect('quantity', 'ai-vision');
                    else alert(`启动工具: ${tool.name}`);
                  }} />
                ))}
              </div>
            </section>

            {/* My Tools Section */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                  <h2 className="text-xl font-bold text-slate-800">我的工具</h2>
                </div>
                <button className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center transition-colors">
                  管理工具 <Icon name="PlusCircle" size={14} className="ml-1" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {MY_TOOLS.map(tool => (
                  <ToolCard key={tool.id} tool={tool} onClick={() => {
                    if(tool.id === 'm7') handleSelect('pricing', 'ok-contract');
                    else alert(`启动工具: ${tool.name}`);
                  }} />
                ))}
              </div>
            </section>

            {/* Banner Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
              
              <div className="mb-6 md:mb-0 relative z-10">
                <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold mb-4 border border-white/30 tracking-wider">
                  NEW UPDATE
                </div>
                <h3 className="text-3xl font-bold mb-3">汇造价 AI 识图算量 2.0 现已上线</h3>
                <p className="text-blue-100 max-w-xl text-lg opacity-90">支持批量识别 CAD 图纸、PDF 及手写工程单，识别准确率高达 99.8%。一键生成工程量明细，告别繁琐。 </p>
                <div className="flex space-x-4 mt-8">
                  <button 
                    onClick={() => handleSelect('quantity', 'ai-vision')}
                    className="bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl active:scale-95 transform"
                  >
                    立即体验
                  </button>
                  <button className="bg-transparent border border-white/30 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-white/10 transition-all">
                    了解更多
                  </button>
                </div>
              </div>
              <div className="hidden lg:block relative z-10">
                <div className="bg-white/10 p-10 rounded-[40px] backdrop-blur-md border border-white/20 shadow-inner">
                  <Icon name="ScanLine" size={100} className="text-white opacity-90 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
        <div className="bg-white p-12 rounded-[48px] shadow-sm border border-slate-100 flex flex-col items-center">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-6">
            <Icon name="Construction" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{activeSubId || activeId} 功能模块</h2>
          <p className="text-slate-500 mt-3 text-center max-w-xs">该功能模块正在深度集成 AI 算力中，预计将于近期开放使用。</p>
          <button 
            onClick={() => setActiveId('home')}
            className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 transform"
          >
            返回平台主页
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden text-slate-900 bg-[#f8fafc]">
      <Sidebar activeId={activeId} activeSubId={activeSubId} onSelect={handleSelect} />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {renderContent()}
      </main>
      
      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-4">
        <div className="group relative">
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            联系客服
          </div>
          <button className="w-14 h-14 bg-white text-slate-600 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-110">
            <Icon name="Headset" size={24} />
          </button>
        </div>
        <div className="group relative">
           <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            回到顶部
          </div>
          <button 
            onClick={() => document.querySelector('main > div')?.scrollTo({top: 0, behavior: 'smooth'})}
            className="w-14 h-14 bg-white text-slate-600 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-110"
          >
            <Icon name="ArrowUp" size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
