
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Icon from './components/Icon';
import ToolCard from './components/ToolCard';
import AIChatView from './components/AIChatView';
import DateCalculatorView from './components/DateCalculatorView';
import TaxCalculatorView from './components/TaxCalculatorView';
import AIVisionView from './components/AIVisionView';
import OKContractCompareView from './components/OKContractCompareView';
import ToolManagementView from './components/ToolManagementView';
import AllToolsView from './components/AllToolsView';
import ProfileView from './components/ProfileView';
import UserManagementView from './components/UserManagementView';
import RoleManagementView from './components/RoleManagementView';
import MenuManagementView from './components/MenuManagementView';
import { ALL_TOOLS, DEFAULT_HOT_TOOLS, DEFAULT_MY_TOOLS } from './constants';
import { ToolItem } from './types';

const App: React.FC = () => {
  const [activeId, setActiveId] = useState('home');
  const [activeSubId, setActiveSubId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [homeAIInput, setHomeAIInput] = useState('');
  const [greeting, setGreeting] = useState('早上好');
  
  // Tool Selection State (Favorites)
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(DEFAULT_MY_TOOLS);
  const [myToolsActiveTab, setMyToolsActiveTab] = useState('全部');
  const [view, setView] = useState<'default' | 'tool-management' | 'all-tools'>('default');

  // Modal States
  const [sharingTool, setSharingTool] = useState<ToolItem | null>(null);
  const [tutorialTool, setTutorialTool] = useState<ToolItem | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('早上好');
    else if (hour < 18) setGreeting('下午好');
    else setGreeting('晚上好');
  }, []);

  const handleSelect = (id: string, subId?: string) => {
    setActiveId(id);
    setActiveSubId(subId || '');
    setView('default');
  };

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedToolIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const openShareModal = (tool: ToolItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSharingTool(tool);
  };

  const openTutorialModal = (tool: ToolItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTutorialTool(tool);
  };

  const hotTools = ALL_TOOLS.filter(t => DEFAULT_HOT_TOOLS.includes(t.id));
  const myTools = ALL_TOOLS.filter(t => {
    const isSelected = selectedToolIds.includes(t.id);
    if (!isSelected) return false;
    if (myToolsActiveTab === '全部') return true;
    return t.category === myToolsActiveTab;
  });

  const toolTabs = ['全部', '汇计量', '汇计价', '汇通用'];

  const handleHomeAISend = () => {
    if (!homeAIInput.trim()) return;
    handleSelect('ai-qa', 'qa-2024-list');
  };

  const renderToolHeader = (title: string, toolId: string) => {
    const tool = ALL_TOOLS.find(t => t.id === toolId);
    const isFav = selectedToolIds.includes(toolId);
    return (
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center space-x-4">
          <button onClick={() => setActiveId('home')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all outline-none">
            <Icon name="ArrowLeft" size={24} />
          </button>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        </div>
        <div className="flex items-center space-x-3">
          {tool && (
            <button 
              onClick={(e) => openTutorialModal(tool, e)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold text-sm transition-all outline-none"
            >
              <Icon name="BookOpen" size={18} />
              <span>教程</span>
            </button>
          )}
          <button 
            onClick={(e) => toggleFavorite(toolId, e)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-sm transition-all outline-none ${
              isFav ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Icon name="Star" size={18} fill={isFav ? "currentColor" : "none"} />
            <span>{isFav ? '已收藏' : '收藏'}</span>
          </button>
          {tool && (
            <button 
              onClick={(e) => openShareModal(tool, e)}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-sm transition-all outline-none"
            >
              <Icon name="Share2" size={18} />
              <span>分享</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (view === 'tool-management') {
      return (
        <ToolManagementView 
          selectedToolIds={selectedToolIds}
          onToggleTool={(id) => toggleFavorite(id)}
          onBack={() => setView('default')}
        />
      );
    }

    if (view === 'all-tools') {
      return (
        <AllToolsView 
          onSelectTool={(tool) => {
            if(tool.id === 'ai-vision') handleSelect('quantity', 'ai-vision');
            else if(tool.id === 'ok-contract') handleSelect('pricing', 'ok-contract');
            else if(tool.id === 'ok-date-calc') handleSelect('general', 'ok-date-calc');
            else if(tool.id === 'ok-tax-calc') handleSelect('general', 'ok-tax-calc');
            else if(tool.category === 'AI问答') handleSelect('ai-qa', tool.id);
            else alert(`启动工具: ${tool.name}`);
          }}
          onBack={() => setView('default')}
        />
      );
    }

    if (activeSubId === 'ok-date-calc') {
      return (
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderToolHeader('日期计算器', 'ok-date-calc')}
          <DateCalculatorView />
        </div>
      );
    }
    
    if (activeSubId === 'ok-tax-calc') {
      return (
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderToolHeader('税费计算', 'ok-tax-calc')}
          <TaxCalculatorView />
        </div>
      );
    }

    if (activeSubId === 'ai-vision') {
      return (
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderToolHeader('AI识图算量', 'ai-vision')}
          <AIVisionView />
        </div>
      );
    }

    if (activeSubId === 'ok-contract') {
      return (
        <div className="flex-1 flex flex-col overflow-hidden">
          {renderToolHeader('合同价对比', 'ok-contract')}
          <OKContractCompareView />
        </div>
      );
    }

    if (activeSubId === 'profile') return <ProfileView />;
    if (activeSubId === 'user-management') return <UserManagementView />;
    if (activeSubId === 'role-management') return <RoleManagementView />;
    if (activeSubId === 'menu-management') return <MenuManagementView />;

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
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fcfdff]">
          <div className="max-w-7xl mx-auto px-8">
            
            {/* Minimalist AI Dialogue Hero (Further Reduced Height & Enhanced Background) */}
            <div className="py-7 flex flex-col items-center relative transition-all duration-300">
              {/* Enhanced Background Glows */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-400/20 blur-[90px] rounded-full pointer-events-none"></div>
              <div className="absolute top-10 left-[30%] w-[300px] h-[300px] bg-purple-400/15 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="absolute top-[-20px] right-[30%] w-[250px] h-[250px] bg-indigo-400/15 blur-[80px] rounded-full pointer-events-none"></div>

              {/* The "Pearl" Orb */}
              <div className="relative mb-4 w-14 h-14 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 via-indigo-300 to-white rounded-full opacity-90 blur-[1px] shadow-inner animate-pulse"></div>
                <div className="absolute inset-[2px] bg-gradient-to-bl from-white/90 via-transparent to-black/10 rounded-full"></div>
                <div className="absolute top-2 left-4 w-3 h-1.5 bg-white/70 blur-[3px] rounded-full rotate-45"></div>
              </div>

              {/* Typography Greeting */}
              <div className="text-center mb-6 relative z-10 transition-all duration-300">
                <h1 className="text-[28px] font-bold text-slate-800 tracking-tight leading-tight mb-0.5">
                  {greeting}，造价工程师
                </h1>
                <h2 className="text-[28px] font-bold tracking-tight leading-tight">
                  今天我可以 <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">为您提供什么帮助？</span>
                </h2>
              </div>

              {/* Central AI Input Card */}
              <div className="w-full max-w-4xl relative z-20 group">
                <div className="bg-white border border-slate-100 rounded-[24px] shadow-[0_12px_35px_rgba(0,0,0,0.03)] p-1 transition-all duration-500 hover:shadow-[0_18px_45px_rgba(0,0,0,0.05)] hover:border-blue-200">
                  <div className="flex items-center px-5 py-3">
                    <Icon name="Sparkles" size={18} className="text-blue-500/80 mr-3" />
                    <input 
                      type="text"
                      value={homeAIInput}
                      onChange={(e) => setHomeAIInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleHomeAISend()}
                      placeholder="发起咨询或向 AI 发送指令..."
                      className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-sm font-medium text-slate-700 placeholder-slate-400"
                    />
                  </div>

                  <div className="flex items-center justify-between px-3 pb-2 pt-0.5">
                    <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar pb-1">
                      <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all outline-none">
                        <Icon name="Paperclip" size={13} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500">识图算量</span>
                      </button>
                      <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all outline-none">
                        <Icon name="Search" size={13} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500">查定额</span>
                      </button>
                      <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all outline-none">
                        <Icon name="BrainCircuit" size={13} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500">AI推理</span>
                      </button>
                      <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all outline-none">
                        <Icon name="FileSearch" size={13} className="text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-500">深度研究</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 ml-3">
                      <button 
                        onClick={handleHomeAISend}
                        className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-blue-500/10 hover:scale-105 active:scale-95 transition-all outline-none"
                      >
                        <Icon name="Mic" size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub Tags */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                  {['2024清单变化', '深基坑支护定额', '土石方计算公式', '苗木表清单编制'].map((tag) => (
                    <button 
                      key={tag}
                      onClick={() => {
                        setHomeAIInput(tag);
                        handleHomeAISend();
                      }}
                      className="px-3 py-1 rounded-xl text-[11px] font-bold text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all outline-none"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* My Tools Section */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                  <h2 className="text-lg font-bold text-slate-800">我的工具</h2>
                  <div className="ml-6 flex bg-slate-100/60 p-0.5 rounded-lg">
                    {toolTabs.map(tab => (
                      <button
                        key={tab}
                        onClick={() => setMyToolsActiveTab(tab)}
                        className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all outline-none ${
                          myToolsActiveTab === tab 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={() => setView('tool-management')}
                  className="text-xs text-blue-600 font-medium hover:text-blue-800 flex items-center transition-colors outline-none"
                >
                  管理工具 <Icon name="PlusCircle" size={12} className="ml-1" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {myTools.map(tool => (
                  <ToolCard 
                    key={tool.id} 
                    tool={tool} 
                    onFavoriteToggle={(id, e) => toggleFavorite(id, e)}
                    isFavorite={selectedToolIds.includes(tool.id)}
                    onClick={() => {
                      if(tool.id === 'ok-contract') handleSelect('pricing', 'ok-contract');
                      else if(tool.id === 'ok-date-calc') handleSelect('general', 'ok-date-calc');
                      else if(tool.id === 'ok-tax-calc') handleSelect('general', 'ok-tax-calc');
                      else if(tool.id === 'ai-vision') handleSelect('quantity', 'ai-vision');
                      else alert(`启动工具: ${tool.name}`);
                    }} 
                  />
                ))}
                {myTools.length === 0 && (
                  <div 
                    onClick={() => setView('tool-management')}
                    className="col-span-full py-12 bg-white rounded-[24px] border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:border-blue-300 transition-all cursor-pointer group"
                  >
                    <Icon name="PlusCircle" size={40} className="mb-3 opacity-10 group-hover:scale-110 group-hover:text-blue-500 group-hover:opacity-40 transition-all" />
                    <p className="text-sm font-bold">该分类暂无定制工具，点击去添加</p>
                  </div>
                )}
              </div>
            </section>

            {/* Hot Tools Section */}
            <section className="mb-12 pb-12">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                  <h2 className="text-lg font-bold text-slate-800">热门推荐</h2>
                </div>
                <button 
                  onClick={() => setView('all-tools')}
                  className="text-xs text-blue-600 font-medium hover:text-blue-800 flex items-center transition-colors outline-none"
                >
                  查看全部 <Icon name="ChevronRight" size={12} className="ml-1" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {hotTools.map(tool => (
                  <ToolCard 
                    key={tool.id} 
                    tool={tool} 
                    onFavoriteToggle={(id, e) => toggleFavorite(id, e)}
                    isFavorite={selectedToolIds.includes(tool.id)}
                    onClick={() => {
                      if(tool.id === 'ai-vision') handleSelect('quantity', 'ai-vision');
                      else alert(`启动工具: ${tool.name}`);
                    }} 
                  />
                ))}
              </div>
            </section>
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
            className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 transform outline-none"
          >
            返回平台主页
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden text-slate-900 bg-white">
      {/* Global Header */}
      <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-50 shrink-0">
        <div className="flex items-center space-x-4">
          <div onClick={() => handleSelect('home')} className="flex items-center space-x-2 cursor-pointer group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold transition-transform group-hover:scale-110">汇</div>
            <span className="text-xl font-bold text-slate-800 tracking-tight">汇造价</span>
          </div>
        </div>

        <div className="flex-1 max-w-xl px-8">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Icon name="Search" size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="搜索工具、政策、清单、定额..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2 pl-12 pr-4 outline-none focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all text-sm text-slate-700"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative outline-none">
            <Icon name="Bell" size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all outline-none">
            <Icon name="Settings" size={20} />
          </button>
          <div className="h-8 w-px bg-slate-200 mx-2"></div>
          <button 
            onClick={() => handleSelect('settings', 'profile')}
            className="flex items-center space-x-3 pl-2 pr-1 py-1 hover:bg-slate-50 rounded-2xl transition-all group outline-none"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-700 group-hover:text-blue-600">造价工程师</p>
              <p className="text-[10px] text-slate-400">VIP 尊享版</p>
            </div>
            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200 group-hover:border-blue-300 transition-all">
              <Icon name="User" size={20} />
            </div>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeId={activeId} activeSubId={activeSubId} onSelect={handleSelect} />
        <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
          {renderContent()}
        </main>
      </div>

      {/* Tutorial Modal */}
      {tutorialTool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[48px] p-10 w-full max-w-2xl shadow-2xl border border-white/50 animate-in zoom-in-95 duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Icon name={tutorialTool.icon} size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{tutorialTool.name} 教程</h3>
                    <p className="text-blue-600 font-bold text-sm">功能介绍与使用说明</p>
                  </div>
                </div>
                <button onClick={() => setTutorialTool(null)} className="p-3 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all outline-none">
                  <Icon name="X" size={24} />
                </button>
              </div>
              <div className="space-y-8">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">功能概览</h4>
                  <p className="text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">{tutorialTool.tutorial?.overview || "该工具旨在提升工程造价流程中特定环节的效率，支持智能化处理。"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">操作步骤</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {(tutorialTool.tutorial?.steps || ["打开功能页面", "输入必要信息", "获取处理结果"]).map((step, idx) => (
                      <div key={idx} className="flex items-center space-x-4 p-4 rounded-2xl hover:bg-blue-50 transition-colors group">
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-blue-100 flex items-center justify-center text-blue-600 font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-all">{idx + 1}</div>
                        <p className="text-slate-700 font-bold">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => setTutorialTool(null)} className="mt-10 w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl outline-none">我知道了，开始使用</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {sharingTool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl border border-white/50 animate-in zoom-in-95 duration-300 text-center">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 mx-auto"><Icon name={sharingTool.icon} size={40} /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">分享 {sharingTool.name}</h3>
            <p className="text-slate-500 text-sm mb-8">邀请您的同事一起使用这款高效造价工具</p>
            <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center space-x-3 mb-8">
              <input type="text" readOnly value={`https://huizaojia.ai/tools/${sharingTool.id}`} className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm font-medium text-slate-600" />
              <button onClick={() => { navigator.clipboard.writeText(`https://huizaojia.ai/tools/${sharingTool.id}`); alert('链接已成功复制到剪贴板！'); }} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all active:scale-90"><Icon name="Copy" size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <button className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all outline-none"><Icon name="MessageCircle" size={24} className="text-emerald-500 mb-2" /><span className="text-xs font-bold text-slate-600">微信分享</span></button>
              <button className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all outline-none"><Icon name="Image" size={24} className="text-indigo-500 mb-2" /><span className="text-xs font-bold text-slate-600">生成海报</span></button>
            </div>
            <button onClick={() => setSharingTool(null)} className="mt-10 text-slate-400 font-bold text-sm hover:text-slate-600 transition-all outline-none">取消</button>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-4">
        <button className="w-14 h-14 bg-white text-slate-600 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 outline-none">
          <Icon name="Headset" size={24} />
        </button>
        <button onClick={() => document.querySelector('main > div')?.scrollTo({top: 0, behavior: 'smooth'})} className="w-14 h-14 bg-white text-slate-600 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 outline-none">
          <Icon name="ArrowUp" size={24} />
        </button>
      </div>
    </div>
  );
};

export default App;
