import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Icon from './components/Icon';
import ToolCard from './components/ToolCard';
import AIChatView from './components/AIChatView';
import DateCalculatorView from './components/DateCalculatorView';
import TaxCalculatorView from './components/TaxCalculatorView';
import FeeCalculatorView from './components/FeeCalculatorView';
import AIVisionView from './components/AIVisionView';
import HomeRenovationCalculatorView from './components/HomeRenovationCalculatorView';
import AICadTableExtractionView from './components/AICadTableExtractionView';
import OKContractCompareView from './components/OKContractCompareView';
import OneVsOneCompareView from './components/OneVsOneCompareView';
import PriceFileCompareView from './components/PriceFileCompareView';
import PriceFileCompareView2 from './components/PriceFileCompareView2';
import ProjectListView from './components/ProjectListView';
import ToolManagementView from './components/ToolManagementView';
import AllToolsView from './components/AllToolsView';
import ProfileView from './components/ProfileView';
import UserManagementView from './components/UserManagementView';
import RoleManagementView from './components/RoleManagementView';
import MenuManagementView from './components/MenuManagementView';
import AmountConverterView from './components/AmountConverterView';
import LibraryView from './components/LibraryView';
import LibraryDetailView from './components/LibraryDetailView';
import HardwareCalculatorView from './components/HardwareCalculatorView';
import SmartCadView from './components/SmartCadView';
import FeedbackView from './components/FeedbackView';
import MaterialAdjustmentView from './components/MaterialAdjustmentView';
import ListOptimizationView from './components/ListOptimizationView';
import MaterialPriceConsistencyView from './components/MaterialPriceConsistencyView';
import RebiddingAnalysisView from './components/RebiddingAnalysisView';
import { ALL_TOOLS, DEFAULT_HOT_TOOLS, DEFAULT_MY_TOOLS } from './constants';
import { ToolItem } from './types';

const App: React.FC = () => {
  // 从 localStorage 恢复状态，如果没有则默认为 'home'
  const [activeId, setActiveId] = useState(() => localStorage.getItem('activeId') || 'home');
  const [activeSubId, setActiveSubId] = useState(() => localStorage.getItem('activeSubId') || '');
  const [homeAIInput, setHomeAIInput] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [greeting, setGreeting] = useState('早上好');
  
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(DEFAULT_MY_TOOLS);
  const [myToolsActiveTab, setMyToolsActiveTab] = useState('全部');
  const [view, setView] = useState<'default' | 'tool-management' | 'all-tools'>('default');

  const [viewingLibFile, setViewingLibFile] = useState<any | null>(null);

  const [sharingTool, setSharingTool] = useState<ToolItem | null>(null);
  const [tutorialTool, setTutorialTool] = useState<ToolItem | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [contactModal, setContactModal] = useState<{type: 'wechat' | 'group' | 'qq', title: string, id: string} | null>(null);

  const userMenuRef = useRef<HTMLDivElement>(null);

  // 监听状态变化并保存到 localStorage
  useEffect(() => {
    localStorage.setItem('activeId', activeId);
    localStorage.setItem('activeSubId', activeSubId);
  }, [activeId, activeSubId]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('早上好');
    else if (hour < 18) setGreeting('下午好');
    else setGreeting('晚上好');

    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string, subId?: string) => {
    setActiveId(id);
    setActiveSubId(subId || '');
    setView('default');
    setViewingLibFile(null);
    setIsUserMenuOpen(false);
  };

  const handleLaunchTool = (tool: ToolItem) => {
    if (tool.parentId) {
      handleSelect(tool.parentId, tool.id);
    }
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

  const handleHomeAISend = (initialTag: string = '') => {
    handleSelect('ai-qa', initialTag);
  };

  const handleLogout = () => {
    if (confirm('确定要退出账号吗？')) {
      alert('已退出账号');
      setIsUserMenuOpen(false);
    }
  };

  const renderHeader = () => (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-[60]">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 mr-4">
          <div className="w-10 h-10 bg-blue-600 rounded-[14px] flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Icon name="Box" size={22} className="text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
             <span className="text-[20px] font-black tracking-tighter text-slate-800 leading-none">汇造价</span>
             <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded leading-none">PRO</span>
            </div>
            <span className="text-[10px] font-normal text-slate-500 mt-1 leading-none tracking-tight">造价提质增效AI神器</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-xl px-12">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <Icon name="Search" size={18} />
          </div>
          <input 
            type="text" 
            placeholder="搜索您需要的造价工具、法规、清单..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 pl-12 pr-4 text-sm font-medium focus:bg-white focus:border-blue-400 outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      <div className="flex items-center space-x-1">
        <button 
          onClick={() => handleSelect('feedback')}
          className={`p-2.5 rounded-xl transition-all ${activeId === 'feedback' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} 
          title="意见反馈"
        >
          <Icon name="MessageSquareMore" size={20} />
        </button>

        <button 
          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" 
          title="系统设置" 
          onClick={() => handleSelect('settings', 'profile')}
        >
          <Icon name="Settings" size={20} />
        </button>
        
        <div className="h-6 w-px bg-slate-100 mx-2"></div>
        
        <div className="relative" ref={userMenuRef}>
          <button 
            className={`flex items-center space-x-3 pl-3 pr-1 py-1 rounded-2xl transition-all group ${isUserMenuOpen ? 'bg-blue-50 shadow-sm' : 'hover:bg-slate-50'}`} 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className="text-right hidden sm:block">
              <p className={`text-xs font-black leading-none transition-colors ${isUserMenuOpen ? 'text-blue-600' : 'text-slate-800'}`}>管理员</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">造价工程师</p>
            </div>
            <div className={`w-10 h-10 border rounded-xl overflow-hidden flex items-center justify-center transition-all ${isUserMenuOpen ? 'bg-blue-100 border-blue-200' : 'bg-slate-100 border-slate-200 group-hover:scale-105'}`}>
               <Icon name="User" size={20} className={isUserMenuOpen ? 'text-blue-600' : 'text-slate-400'} />
            </div>
          </button>

          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 py-3 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-5 py-4 border-b border-slate-50 mb-2 flex items-center space-x-4">
                 <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Icon name="User" size={24} />
                 </div>
                 <div className="min-w-0">
                    <h4 className="text-sm font-black text-slate-800 truncate">管理员</h4>
                    <p className="text-xs text-slate-400 font-bold mt-1">ID: 10245893</p>
                 </div>
              </div>

              <div className="px-2 space-y-1">
                <button 
                  onClick={() => handleSelect('settings', 'profile')}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all group"
                >
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100/50 transition-colors">
                    <Icon name="UserCircle" size={20} />
                  </div>
                  <span className="text-sm font-bold">个人中心</span>
                </button>
                
                <div className="h-px bg-slate-50 mx-4 my-2"></div>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all group"
                >
                  <div className="w-8 h-8 bg-rose-50/50 rounded-lg flex items-center justify-center group-hover:bg-rose-100/50 transition-colors">
                    <Icon name="LogOut" size={20} />
                  </div>
                  <span className="text-sm font-bold">退出账号</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  const renderToolHeader = (title: string, toolId: string) => {
    const tool = ALL_TOOLS.find(t => t.id === toolId);
    const isFav = selectedToolIds.includes(toolId);
    return (
      <div className="bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={() => setActiveId('home')} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all outline-none">
            <Icon name="ArrowLeft" size={20} />
          </button>
          <h1 className="text-base font-black text-slate-900">{title}</h1>
        </div>
        <div className="flex items-center space-x-2">
          {tool && (
            <button 
              onClick={(e) => openTutorialModal(tool, e)}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-black text-xs transition-all outline-none"
            >
              <Icon name="BookOpen" size={14} />
              <span>教程</span>
            </button>
          )}
          <button 
            onClick={(e) => toggleFavorite(toolId, e)}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg font-black text-xs transition-all outline-none ${
              isFav ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Icon name="Star" size={14} fill={isFav ? "currentColor" : "none"} />
            <span>{isFav ? '已收藏' : '收藏'}</span>
          </button>
          {tool && (
            <button 
              onClick={(e) => openShareModal(tool, e)}
              className="p-1.5 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-lg transition-all outline-none"
            >
              <Icon name="Share2" size={16} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (activeId === 'library' && viewingLibFile) {
      return <LibraryDetailView file={viewingLibFile} onBack={() => setViewingLibFile(null)} />;
    }

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
          onSelectTool={handleLaunchTool}
          onBack={() => setView('default')}
        />
      );
    }

    switch (activeId) {
      case 'home':
        return renderHome();
      case 'feedback':
        return <FeedbackView onOpenContact={() => setContactModal({type: 'group', title: '造价技术交流群', id: 'hzj_group_2024'})} />;
      case 'ai-qa':
        return <AIChatView initialTag={activeSubId} />;
      case 'library':
        return <LibraryView activeSubId={activeSubId} onReadFile={(file) => setViewingLibFile(file)} />;
      case 'quantity':
        if (activeSubId === 'ai-vision') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('AI识图算量', 'ai-vision')}<AIVisionView /></div>;
        if (activeSubId === 'home-calc') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('家装计算器', 'home-calc')}<HomeRenovationCalculatorView /></div>;
        if (activeSubId === 'ai-cad') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('AI批量提取CAD表', 'ai-cad')}<AICadTableExtractionView /></div>;
        if (activeSubId === 'list-compare') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('清单工程量超额调差对比', 'list-compare')}<ProjectListView /></div>;
        if (activeSubId === 'hardware-calc') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('五金计算器', 'hardware-calc')}<HardwareCalculatorView /></div>;
        break;
      case 'pricing':
        if (activeSubId === 'material-diff') return <MaterialAdjustmentView />;
        if (activeSubId === 'list-optimization') return <ListOptimizationView onSelectTool={(toolId) => handleSelect('pricing', toolId)} />;
        if (activeSubId === 'ok-contract') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('相同清单量价一致性对比', 'ok-contract')}<OKContractCompareView /></div>;
        if (activeSubId === 'one-vs-one-compare') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('1V1文件对比', 'one-vs-one-compare')}<OneVsOneCompareView /></div>;
        if (activeSubId === 'price-file-compare') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('计价文件对比', 'price-file-compare')}<PriceFileCompareView /></div>;
        if (activeSubId === 'price-file-compare-2') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('计价分析报告', 'price-file-compare-2')}<PriceFileCompareView2 /></div>;
        if (activeSubId === 'material-price-consistency') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('相同材料单价一致性对比', 'material-price-consistency')}<MaterialPriceConsistencyView /></div>;
        if (activeSubId === 'rebidding-analysis') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('回标分析', 'rebidding-analysis')}<RebiddingAnalysisView /></div>;
        break;
      case 'general':
        if (activeSubId === 'ok-date-calc') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('日期计算器', 'ok-date-calc')}<DateCalculatorView /></div>;
        if (activeSubId === 'ok-tax-calc') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('税费计算', 'ok-tax-calc')}<TaxCalculatorView /></div>;
        if (activeSubId === 'fee-calc') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('收费计算器', 'fee-calc')}<FeeCalculatorView /></div>;
        if (activeSubId === 'amount-converter') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('金额大小写转换', 'amount-converter')}<AmountConverterView /></div>;
        if (activeSubId === 'smart-cad') return <div className="flex-1 flex flex-col overflow-hidden">{renderToolHeader('智能CAD', 'smart-cad')}<SmartCadView /></div>;
        break;
      case 'settings':
        if (activeSubId === 'profile') return <ProfileView />;
        if (activeSubId === 'user-management') return <UserManagementView />;
        if (activeSubId === 'role-management') return <RoleManagementView />;
        if (activeSubId === 'menu-management') return <MenuManagementView />;
        break;
    }

    return (
      <div className="flex-1 flex items-center justify-center text-slate-300">
        <div className="text-center">
          <Icon name="Construction" size={64} className="mx-auto mb-4 opacity-10" />
          <p className="text-sm font-bold tracking-tight">该功能模块正在升级建设中...</p>
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fcfdff] relative">
      <div className="w-full px-6 py-4 pb-24">
        <div className="py-7 flex flex-col items-center relative transition-all duration-300">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-400/20 blur-[90px] rounded-full pointer-events-none"></div>
          <div className="absolute top-10 left-[30%] w-[300px] h-[300px] bg-purple-400/15 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute top-[-20px] right-[30%] w-[250px] h-[250px] bg-indigo-400/15 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative mb-4 w-14 h-14 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 via-indigo-300 to-white rounded-full opacity-90 blur-[1px] shadow-inner animate-pulse"></div>
            <div className="absolute inset-[2px] bg-gradient-to-bl from-white/90 via-transparent to-black/10 rounded-full"></div>
            <div className="absolute top-2 left-4 w-3 h-1.5 bg-white/70 blur-[3px] rounded-full rotate-45"></div>
          </div>

          <div className="text-center mb-6 relative z-10 transition-all duration-300">
            <h1 className="text-[28px] font-bold text-slate-800 tracking-tight leading-tight mb-0.5">
              {greeting}，造价工程师
            </h1>
            <h2 className="text-[28px] font-bold tracking-tight leading-tight">
              今天我可以 <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">为您提供什么帮助？</span>
            </h2>
          </div>

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
                  <button onClick={() => handleHomeAISend('清单定额')} className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all outline-none">
                    <span className="text-[12px] font-bold text-slate-500">清单定额</span>
                  </button>
                  <button onClick={() => handleHomeAISend('材价指标')} className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all outline-none">
                    <span className="text-[12px] font-bold text-slate-500">材价指标</span>
                  </button>
                  <button onClick={() => handleHomeAISend('材料品牌')} className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all outline-none">
                    <span className="text-[12px] font-bold text-slate-500">材料品牌</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2 shrink-0 ml-3">
                  <button onClick={() => handleHomeAISend()} className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-blue-500/10 hover:scale-105 active:scale-95 transition-all outline-none">
                    <Icon name="Send" size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mb-10 px-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
              <h2 className="text-lg font-bold text-slate-800">我的工具</h2>
              <div className="ml-6 flex bg-slate-100/60 p-0.5 rounded-lg">
                {toolTabs.map(tab => (
                  <button key={tab} onClick={() => setMyToolsActiveTab(tab)} className={`px-3 py-1 text-[12px] font-bold rounded-md transition-all outline-none ${myToolsActiveTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setView('tool-management')} className="text-[12px] text-blue-600 font-bold hover:text-blue-800 flex items-center transition-colors outline-none">
              管理工具 <Icon name="PlusCircle" size={12} className="ml-1" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {myTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} onFavoriteToggle={(id, e) => toggleFavorite(id, e)} isFavorite={selectedToolIds.includes(tool.id)} onClick={() => handleLaunchTool(tool)} />
            ))}
          </div>
        </section>

        <section className="mb-12 pb-12 px-2">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-3">
              <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
              <h2 className="text-lg font-bold text-slate-800">热门推荐</h2>
            </div>
            <button onClick={() => setView('all-tools')} className="text-[12px] text-blue-600 font-bold hover:text-blue-800 flex items-center transition-colors outline-none">
              查看全部 <Icon name="ChevronRight" size={12} className="ml-1" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {hotTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} onFavoriteToggle={(id, e) => toggleFavorite(id, e)} isFavorite={selectedToolIds.includes(tool.id)} onClick={() => handleLaunchTool(tool)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar activeId={activeId} activeSubId={activeSubId} onSelect={handleSelect} />
      <div className="flex-1 flex flex-col min-w-0">
        {renderHeader()}
        {renderContent()}
      </div>

      {activeId === 'home' && (
       <div className="fixed bottom-10 right-8 flex flex-col space-y-3 z-[150] animate-in slide-in-from-bottom-6 duration-700">
          <button 
           onClick={() => setContactModal({type: 'wechat', title: '专属客服微信', id: 'hzj_service_pro'})}
           className="flex items-center justify-center bg-white text-slate-700 p-3 rounded-[22px] shadow-[0_10px_25px_rgba(0,0,0,0.12)] border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all group active:scale-95"
          >
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="MessageCircle" size={20} />
            </div>
          </button>

          <button 
           onClick={() => setContactModal({type: 'group', title: '造价技术交流群', id: 'hzj_group_2024'})}
           className="flex items-center justify-center bg-white text-slate-700 p-3 rounded-[22px] shadow-[0_10px_25px_rgba(0,0,0,0.12)] border border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all group active:scale-95"
          >
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Icon name="Users" size={20} />
            </div>
          </button>
       </div>
     )}

      {contactModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 flex flex-col items-center border border-slate-200 animate-in zoom-in-95">
             <div className="flex items-center justify-between w-full mb-6">
                <h3 className="text-lg font-black text-slate-800">{contactModal.title}</h3>
                <button onClick={() => setContactModal(null)} className="text-slate-300 hover:text-rose-500 transition-colors"><Icon name="X" size={24} /></button>
             </div>
             <div className="w-48 h-48 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner relative group">
                <Icon name="QrCode" size={100} className="text-slate-200 group-hover:text-blue-500/20 transition-all" strokeWidth={1} />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-[10px] font-black text-blue-600 bg-white px-3 py-1.5 rounded-full shadow-lg border border-blue-100">正在生成二维码</span>
                </div>
             </div>
             <div className="text-center space-y-1 mb-8">
                <p className="text-sm font-bold text-slate-700">扫码或搜索ID: <span className="text-blue-600 select-all">{contactModal.id}</span></p>
                <p className="text-xs text-slate-400 font-medium">竭诚为您提供专业造价技术支持</p>
             </div>
             <button onClick={() => { navigator.clipboard.writeText(contactModal.id); alert('ID已复制到剪贴板'); }} className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95">复制联系方式</button>
          </div>
        </div>
      )}

      {sharingTool && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md p-8 flex flex-col border border-slate-200 animate-in zoom-in-95">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-slate-800">分享工具</h3>
                <button onClick={() => setSharingTool(null)} className="text-slate-300 hover:text-rose-500 transition-colors"><Icon name="X" size={24} /></button>
             </div>
             <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8 flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm"><Icon name={sharingTool.icon} size={24} /></div>
                <div className="min-w-0">
                   <p className="text-sm font-black text-slate-800 truncate">{sharingTool.name}</p>
                   <p className="text-xs text-slate-400 font-medium truncate mt-0.5">{sharingTool.description || '高效造价智能助手'}</p>
                </div>
             </div>
             <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { name: '微信', icon: 'MessageCircle', color: 'text-emerald-500' },
                  { name: '朋友圈', icon: 'Aperture', color: 'text-emerald-600' },
                  { name: 'QQ', icon: 'LayoutGrid', color: 'text-blue-500' },
                  { name: '复制链接', icon: 'Link', color: 'text-slate-600' }
                ].map(p => (
                  <button key={p.name} onClick={() => { alert(`分享到${p.name}成功`); setSharingTool(null); }} className="flex flex-col items-center space-y-2 group">
                    <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center transition-all group-hover:scale-110 ${p.color} group-hover:bg-white group-hover:shadow-lg`}><Icon name={p.icon} size={20} /></div>
                    <span className="text-[10px] font-bold text-slate-500">{p.name}</span>
                  </button>
                ))}
             </div>
             <button onClick={() => setSharingTool(null)} className="w-full py-3 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs hover:bg-slate-100 transition-all outline-none">取消分享</button>
          </div>
        </div>
      )}

      {tutorialTool && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-slate-200 animate-in zoom-in-95 overflow-hidden">
             <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center space-x-3">
                   <Icon name="BookOpen" size={24} className="text-blue-600" />
                   <h3 className="text-lg font-black text-slate-800">使用教程：{tutorialTool.name}</h3>
                </div>
                <button onClick={() => setTutorialTool(null)} className="text-slate-300 hover:text-rose-500 transition-colors"><Icon name="X" size={28} /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-8">
                <section>
                   <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2 mb-4">
                     <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                     <span>工具简介</span>
                   </h4>
                   <p className="text-sm text-slate-600 leading-loose pl-3.5 border-l-2 border-slate-100 italic">
                     {tutorialTool.description || '该工具是汇造价平台专为造价工程师研发的提效利器，旨在通过数字化与智能化手段解决业务痛点。'}
                   </p>
                </section>
                <section>
                   <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2 mb-6">
                     <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                     <span>操作步骤</span>
                   </h4>
                   <div className="space-y-6">
                      {[
                        { step: 1, title: '准备工作', content: '确认您的网络连接稳定，并准备好需要处理的源文件（DWG/Excel/PDF等）。' },
                        { step: 2, title: '导入数据', content: '点击工具页面的“导入”或“添加”按钮，选择您的本地文件进行上传。' },
                        { step: 3, title: '参数配置', content: '根据项目实际需求调整左侧或顶部的参数系数，系统将实时进行测算。' },
                        { step: 4, title: '结果确认', content: '在主视图区域查看解析或计算结果，支持对异常项进行手动干预校对。' },
                        { step: 5, title: '一键导出', content: '确认无误后点击“导出”按钮，即可获取标准格式的成果文件。' }
                      ].map(s => (
                        <div key={s.step} className="flex space-x-4">
                           <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black shrink-0 shadow-sm border border-blue-100">{s.step}</div>
                           <div className="space-y-1">
                              <p className="text-sm font-black text-slate-800">{s.title}</p>
                              <p className="text-[13px] text-slate-500 leading-relaxed">{s.content}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>
             </div>
             <div className="px-8 py-6 border-t border-slate-50 bg-slate-50/30 flex justify-end">
                <button onClick={() => setTutorialTool(null)} className="px-12 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 outline-none hover:bg-blue-700 transition-all">我已了解</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;