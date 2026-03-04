import React, { useState, useMemo, useRef, useEffect } from 'react';
import Icon from './Icon';
import MaterialAdjustmentDetailView from './MaterialAdjustmentDetailView';
import LaborAdjustmentDetailView from './LaborAdjustmentDetailView';

interface MaterialCategory {
  name: string;
  amount: number;
}

interface AdjustmentGroup {
  id: string;
  name: string;
  isExpanded: boolean;
  materials: MaterialCategory[];
}

// 新型人工调差子项结构
interface LaborCategoryItem {
  name: string;
  amount: number;
}

// 新型人工调差楼栋结构
interface LaborBuildingGroup {
  id: string;
  name: string;
  isExpanded: boolean;
  categories: LaborCategoryItem[];
}

// 新型人工调差阶段结构
interface LaborPhase {
  id: string;
  name: string;
  isExpanded: boolean;
  buildings: LaborBuildingGroup[];
}

interface RuleConfig {
  floatingRate: number;
  taxRate: number;
}

interface ProjectItem {
  id: string;
  name: string;
  createTime: string;
  type: string;
  laborAmount: number | null;
  materialAmount: number | null;
}

const MaterialAdjustmentView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'material' | 'labor'>('material');
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'labor-detail'>('list');
  const [activeProjectName, setActiveProjectName] = useState('示例项目：海港城2#-G地块');

  // 多项目状态
  const [projects, setProjects] = useState<ProjectItem[]>([
    { id: 'p1', name: '示例项目：海港城2#-G地块', createTime: '2024-05-20 10:00:00', type: 'material', laborAmount: 1627985, materialAmount: -5420967 },
  ]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>('p1');
  const [projectSearch, setProjectSearch] = useState('');
  const [isProjDropdownOpen, setIsProjDropdownOpen] = useState(false);
  const projDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projDropdownRef.current && !projDropdownRef.current.contains(event.target as Node)) {
        setIsProjDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProjectsForDropdown = useMemo(() => {
    return projects
      .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
      .sort((a, b) => b.createTime.localeCompare(a.createTime));
  }, [projects, projectSearch]);

  const currentProject = projects.find(p => p.id === selectedProjectId);

  // 独立的规则状态
  const [rules, setRules] = useState<{ material: RuleConfig; labor: RuleConfig }>({
    material: { floatingRate: -10.26, taxRate: 9 },
    labor: { floatingRate: -10.26, taxRate: 9 }
  });

  const currentRules = rules[activeTab];

  const handleUpdateRule = (field: keyof RuleConfig, value: number) => {
    setRules(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value
      }
    }));
  };

  const [materialGroups, setMaterialGroups] = useState<AdjustmentGroup[]>([
    {
      id: 'g1',
      name: '地下部分',
      isExpanded: true,
      materials: [
        { name: '钢材', amount: -1293010 },
        { name: '混凝土', amount: -25121 },
        { name: '砌块', amount: 0 },
        { name: '水泥', amount: 64 },
      ]
    },
    {
      id: 'g2',
      name: '地上部分',
      isExpanded: true,
      materials: [
        { name: '钢材', amount: -4258101 },
        { name: '混凝土', amount: -1112687 },
        { name: '砌块', amount: -50 },
        { name: '水泥', amount: 0 },
      ]
    }
  ]);

  // 重构后的人工调差数据
  const [laborPhases, setLaborPhases] = useState<LaborPhase[]>([
    {
      id: 'lp1',
      name: '开工至地下室地下室顶板完成',
      isExpanded: true,
      buildings: [
        {
          id: 'b1',
          name: '1#楼',
          isExpanded: true,
          categories: [
            { name: '一类人工', amount: 9750.43 },
            { name: '二类人工', amount: 174523.67 },
            { name: '三类人工', amount: 3543.21 },
          ]
        },
        {
          id: 'b2',
          name: '2#楼',
          isExpanded: true,
          categories: [
            { name: '一类人工', amount: 8200.12 },
            { name: '二类人工', amount: 154210.00 },
          ]
        }
      ]
    }
  ]);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isNewDetailModalOpen, setIsNewDetailModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharingItem, setSharingItem] = useState<string | null>(null);

  const [newProjectForm, setNewProjectForm] = useState({
    name: ''
  });

  const [newDetailForm, setNewDetailForm] = useState({
    type: 'material', 
    part: '',         
    stage: ''         
  });

  const handleCreateProject = () => {
    if (!newProjectForm.name) {
      alert('请输入项目名称');
      return;
    }
    const newId = `p-${Date.now()}`;
    const newProj: ProjectItem = {
      id: newId,
      name: newProjectForm.name,
      createTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      type: 'material', 
      laborAmount: null,
      materialAmount: null
    };
    setProjects(prev => [newProj, ...prev]);
    setSelectedProjectId(newId);
    setActiveProjectName(newProjectForm.name);

    setIsNewModalOpen(false);
    setNewProjectForm({ name: '' });
  };

  const handleCreateDetail = () => {
    setIsNewDetailModalOpen(false);
    setViewMode(newDetailForm.type === 'material' ? 'detail' : 'labor-detail');
    setNewDetailForm({ type: 'material', part: '', stage: '' });
  };

  const formatNum = (num: number) => {
    const val = Math.round(num);
    return val.toLocaleString();
  };

  const hasCurrentData = useMemo(() => {
    return selectedProjectId === 'p1';
  }, [selectedProjectId]);

  // 计算合计逻辑（人工）
  const laborSubTotal = useMemo(() => {
    if (!hasCurrentData) return 0;
    return laborPhases.reduce((acc, phase) => 
      acc + phase.buildings.reduce((bAcc, b) => 
        bAcc + b.categories.reduce((cAcc, c) => cAcc + c.amount, 0), 0), 0);
  }, [laborPhases, hasCurrentData]);

  const laborTaxAmount = useMemo(() => laborSubTotal * (rules.labor.taxRate / 100), [laborSubTotal, rules.labor.taxRate]);
  const laborFloatingAmount = useMemo(() => laborSubTotal * (rules.labor.floatingRate / 100), [laborSubTotal, rules.labor.floatingRate]);
  const laborFinalTotal = useMemo(() => laborSubTotal + laborTaxAmount + laborFloatingAmount, [laborSubTotal, laborTaxAmount, laborFloatingAmount]);

  // 计算合计逻辑（材料）
  const materialSubTotal = useMemo(() => {
    if (!hasCurrentData) return 0;
    return materialGroups.reduce((acc, g) => acc + g.materials.reduce((sum, m) => sum + m.amount, 0), 0);
  }, [materialGroups, hasCurrentData]);

  const materialTaxAmount = useMemo(() => materialSubTotal * (rules.material.taxRate / 100), [materialSubTotal, rules.material.taxRate]);
  const materialFloatingAmount = useMemo(() => materialSubTotal * (rules.material.floatingRate / 100), [materialSubTotal, rules.material.floatingRate]);
  const materialFinalTotal = useMemo(() => materialSubTotal + materialTaxAmount + materialFloatingAmount, [materialSubTotal, materialTaxAmount, materialFloatingAmount]);

  const ROMAN_NUMS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  if (viewMode === 'detail') {
    return <MaterialAdjustmentDetailView projectName={activeProjectName} onBack={() => setViewMode('list')} />;
  }

  if (viewMode === 'labor-detail') {
    return <LaborAdjustmentDetailView projectName={activeProjectName} onBack={() => setViewMode('list')} />;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden animate-in fade-in duration-500">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-slate-100 px-8 py-5 shrink-0 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center space-x-3 text-left">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Icon name="TrendingUp" size={24} />
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">智能调差汇总表</h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative" ref={projDropdownRef}>
            <div 
              onClick={() => projects.length > 0 && setIsProjDropdownOpen(!isProjDropdownOpen)}
              className={`w-[200px] h-10 bg-white border rounded-xl px-4 flex items-center justify-between transition-all shadow-sm group ${projects.length > 0 ? 'cursor-pointer hover:border-blue-400 border-slate-200' : 'cursor-not-allowed border-slate-100 bg-slate-50'}`}
            >
              <span className={`text-xs font-bold truncate ${currentProject ? 'text-slate-700' : 'text-slate-400'}`}>
                {projects.length === 0 ? '暂无可选项目' : (currentProject?.name || '请选择项目')}
              </span>
              <Icon name="ChevronDown" size={14} className={`text-slate-300 transition-transform duration-300 ${isProjDropdownOpen ? 'rotate-180 text-blue-500' : 'group-hover:text-slate-400'}`} />
            </div>

            {isProjDropdownOpen && projects.length > 0 && (
              <div className="absolute top-full right-0 mt-2 w-[280px] bg-white border border-slate-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-2 z-[100] animate-in fade-in zoom-in-95 duration-200">
                <div className="relative mb-2 px-1 pt-1">
                  <Icon name="Search" size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="模糊搜索项目名称..." 
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="w-full h-8 bg-slate-50 border border-slate-100 rounded-lg pl-8 pr-3 text-[11px] font-bold focus:outline-none focus:border-blue-400 transition-all"
                  />
                </div>
                <div className="max-h-[240px] overflow-y-auto custom-scrollbar space-y-0.5 mt-1">
                  {filteredProjectsForDropdown.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setActiveProjectName(p.name);
                        setIsProjDropdownOpen(false);
                        setProjectSearch('');
                      }}
                      className={`px-3 py-2.5 rounded-xl cursor-pointer transition-all flex flex-col space-y-0.5 ${selectedProjectId === p.id ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50 border border-transparent'}`}
                    >
                      <span className={`text-xs font-bold truncate ${selectedProjectId === p.id ? 'text-blue-700' : 'text-slate-600'}`}>{p.name}</span>
                      <span className="text-[9px] font-bold text-slate-300 italic">{p.createTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="bg-blue-600 text-white px-8 py-2.5 rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center space-x-2 outline-none"
          >
            <Icon name="Plus" size={18} strokeWidth={3} />
            <span>新建项目</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-6 lg:p-8">
        <div className="flex-1 flex flex-col bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
          
          {/* 项目展示区 */}
          <div className="px-8 pt-8 pb-0 shrink-0">
            <div className="rounded-[24px] overflow-hidden bg-white mb-6 border border-slate-200 shadow-none">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">项目名称</th>
                    <th className="px-6 py-4 text-right">人工调差金额 (元)</th>
                    <th className="px-6 py-4 text-right">材料调差金额 (元)</th>
                    <th className="px-6 py-4 text-right">合计 (元)</th>
                    <th className="px-6 py-4 text-center w-64">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentProject ? (
                    <tr className="bg-blue-50/20">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-[13px] font-black text-blue-700">{currentProject.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-[12px] font-bold text-slate-500">
                        {currentProject.laborAmount !== null ? currentProject.laborAmount.toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-[12px] font-bold text-slate-500">
                        {currentProject.materialAmount !== null ? currentProject.materialAmount.toLocaleString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-right text-[13px] font-black text-slate-800">
                        {(currentProject.laborAmount !== null || currentProject.materialAmount !== null) 
                          ? ((currentProject.laborAmount || 0) + (currentProject.materialAmount || 0)).toLocaleString() 
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setIsNewDetailModalOpen(true);
                            }} 
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-black hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                          >
                            新建调差明细
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setSharingItem(currentProject.name); setIsShareModalOpen(true); }} className="p-1.5 text-slate-300 hover:text-blue-500 transition-all"><Icon name="Share2" size={14} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setProjects(projects.filter(item => item.id !== currentProject.id)); setSelectedProjectId(projects.find(p => p.id !== currentProject.id)?.id || null); }} className="p-1.5 text-slate-300 hover:text-rose-500 transition-all"><Icon name="Trash2" size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-300 space-y-2">
                           <Icon name="Inbox" size={48} strokeWidth={1} />
                           <p className="text-sm font-bold">请从下拉框中选择一个项目</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 汇总工具栏 */}
          <div className="px-8 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white min-h-[64px]">
            <div className="flex space-x-10">
              <button 
                onClick={() => setActiveTab('material')}
                className={`relative py-5 text-sm font-black transition-all ${activeTab === 'material' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                材料调差汇总
                {activeTab === 'material' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
              </button>
              <button 
                onClick={() => setActiveTab('labor')}
                className={`relative py-5 text-sm font-black transition-all ${activeTab === 'labor' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                人工调差汇总
                {activeTab === 'labor' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
              </button>
            </div>
            
            <div className="flex items-center bg-blue-50 px-3 py-1.5 rounded-2xl border border-blue-100 shadow-sm space-x-4 animate-in fade-in slide-in-from-right-2 duration-300">
              <div className="flex items-center space-x-2">
                <Icon name="Zap" size={14} className="text-blue-600" />
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-tighter">当前浮动率:</span>
                <div className="relative group">
                   <input 
                    type="number" 
                    step="0.01"
                    value={currentRules.floatingRate}
                    onChange={(e) => handleUpdateRule('floatingRate', parseFloat(e.target.value) || 0)}
                    className="w-20 h-7 bg-white border border-blue-200 rounded-lg px-2 text-[12px] font-black text-blue-800 outline-none focus:border-blue-500 transition-all text-center"
                   />
                   <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-300 pointer-events-none">%</span>
                </div>
              </div>

              <div className="w-px h-4 bg-blue-200"></div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-tighter">税率:</span>
                <div className="relative group">
                  <select 
                    value={currentRules.taxRate}
                    onChange={(e) => handleUpdateRule('taxRate', parseInt(e.target.value))}
                    className="w-16 h-7 bg-white border border-blue-200 rounded-lg pl-2 pr-4 text-[12px] font-black text-blue-800 outline-none focus:border-blue-500 appearance-none cursor-pointer text-center"
                  >
                    {[0, 1, 3, 6, 9, 13].map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                  <Icon name="ChevronDown" size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-blue-300 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-6 lg:p-8">
            {!hasCurrentData ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-slate-300 space-y-4">
                 <Icon name="Inbox" size={80} strokeWidth={1} className="opacity-20" />
                 <p className="font-black text-lg tracking-tight">暂无调差明细</p>
                 <button 
                  onClick={() => setIsNewDetailModalOpen(true)}
                  className="text-blue-500 text-sm font-bold underline hover:text-blue-700"
                 >
                   立即新建调差明细
                 </button>
              </div>
            ) : activeTab === 'material' ? (
              <table className="w-full border-collapse text-left border border-slate-200">
                <thead>
                  <tr className="bg-slate-50/80 text-[13px] font-black text-slate-600 border-b border-slate-200">
                    <th className="px-6 py-4 text-center border-r border-slate-200 w-24">序号</th>
                    <th className="px-6 py-4 border-r border-slate-200">名称</th>
                    <th className="px-6 py-4 border-r border-slate-200 text-center">调差金额（元）</th>
                    <th className="px-6 py-4 text-center w-64">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materialGroups.map((group, gIdx) => {
                    const groupSum = group.materials.reduce((s, m) => s + m.amount, 0);
                    return (
                      <React.Fragment key={group.id}>
                        <tr className="bg-slate-50 group transition-all">
                          <td className="px-6 py-4 text-center border-r border-slate-200 text-slate-400 font-bold">{ROMAN_NUMS[gIdx]}</td>
                          <td className="px-6 py-4 border-r border-slate-200 font-black text-slate-800 text-[14px]">{group.name}</td>
                          <td className={`px-6 py-4 border-r border-slate-200 text-center font-black ${groupSum < 0 ? 'text-rose-500' : 'text-slate-800'}`}>{formatNum(groupSum)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button onClick={() => setViewMode('detail')} className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-black hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10">查看明细</button>
                              <button onClick={() => setMaterialGroups(materialGroups.filter(mg => mg.id !== group.id))} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Icon name="Trash2" size={16} /></button>
                              <button onClick={() => setMaterialGroups(materialGroups.map(mg => mg.id === group.id ? {...mg, isExpanded: !mg.isExpanded} : mg))} className="p-2 text-slate-300 hover:text-slate-800 transition-all"><Icon name={group.isExpanded ? "ChevronUp" : "ChevronDown"} size={16} /></button>
                            </div>
                          </td>
                        </tr>
                        {group.isExpanded && group.materials.map((m, mIdx) => (
                          <tr key={mIdx} className="hover:bg-blue-50/10 transition-colors">
                            <td className="px-6 py-3 text-center border-r border-slate-100 text-[12px] text-slate-400 font-medium">{mIdx + 1}</td>
                            <td className="px-6 py-3 border-r border-slate-100 text-[12px] text-slate-600 font-bold">{m.name}</td>
                            <td className={`px-6 py-3 border-r border-slate-100 text-center text-[12px] font-bold ${m.amount < 0 ? 'text-rose-400' : 'text-slate-500'}`}>{formatNum(m.amount)}</td>
                            <td className="px-6 py-3"></td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  <tr className="bg-slate-50/50">
                    <td className="px-6 py-4 text-center border-r border-slate-200 text-slate-400 font-bold">{ROMAN_NUMS[materialGroups.length] || '三'}</td>
                    <td className="px-6 py-4 border-r border-slate-200 font-black text-slate-800 text-[14px]">小计</td>
                    <td className={`px-6 py-4 border-r border-slate-200 text-center font-black text-lg ${materialSubTotal < 0 ? 'text-rose-500' : 'text-slate-800'}`}>{formatNum(materialSubTotal)}</td>
                    <td className="px-6 py-4"></td>
                  </tr>
                  
                  <tr>
                    <td className="px-6 py-4 text-center border-r border-slate-200 text-slate-400 font-bold">{ROMAN_NUMS[materialGroups.length + 1] || '四'}</td>
                    <td className="px-6 py-4 border-r border-slate-200 font-bold text-slate-600 text-[13px]">税金 ({rules.material.taxRate}%)</td>
                    <td className={`px-6 py-4 border-r border-slate-200 text-center font-black ${materialTaxAmount < 0 ? 'text-rose-400' : 'text-slate-700'}`}>
                      {formatNum(materialTaxAmount)}
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>

                  <tr>
                    <td className="px-6 py-4 text-center border-r border-slate-200 text-slate-400 font-bold">{ROMAN_NUMS[materialGroups.length + 2] || '五'}</td>
                    <td className="px-6 py-4 border-r border-slate-200 font-bold text-slate-600 text-[13px]">
                      {rules.material.floatingRate < 0 ? '下浮' : '上浮'} ({Math.abs(rules.material.floatingRate)}%) 调差金额 (元)
                    </td>
                    <td className={`px-6 py-4 border-r border-slate-200 text-center font-black ${materialFloatingAmount < 0 ? 'text-rose-400' : 'text-slate-700'}`}>
                      {formatNum(materialFloatingAmount)}
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>

                  <tr className="bg-blue-50/50">
                    <td className="px-6 py-5 text-center font-bold border-r border-slate-200 text-slate-400">{ROMAN_NUMS[materialGroups.length + 3] || '六'}</td>
                    <td className="px-6 py-5 font-black text-[15px] border-r border-slate-200 text-blue-700">合计</td>
                    <td className={`px-6 py-5 border-r border-slate-200 text-center font-black text-2xl tracking-tighter text-blue-700 underline decoration-double decoration-blue-200 ${materialFinalTotal < 0 ? 'text-rose-600' : 'text-blue-700'}`}>
                      {formatNum(materialFinalTotal)}
                    </td>
                    <td className="px-6 py-5"></td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full border-collapse text-left border border-slate-200">
                <thead>
                  <tr className="bg-slate-50/80 text-[13px] font-black text-slate-600 border-b border-slate-200">
                    <th className="px-6 py-4 text-center border-r border-slate-200 w-24">序号</th>
                    <th className="px-6 py-4 border-r border-slate-200 min-w-[240px]">名称</th>
                    <th className="px-6 py-4 border-r border-slate-200 text-center">调差金额（元）</th>
                    <th className="px-6 py-4 text-center w-64">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {laborPhases.map((phase, pIdx) => {
                    const phaseTotal = phase.buildings.reduce((acc, b) => 
                      acc + b.categories.reduce((cAcc, c) => cAcc + c.amount, 0), 0);
                    
                    return (
                      <React.Fragment key={phase.id}>
                        {/* 一级分组头：调差阶段 */}
                        <tr className="bg-slate-50 group transition-all">
                          <td className="px-6 py-4 text-center border-r border-slate-200 text-slate-400 font-bold">{ROMAN_NUMS[pIdx]}</td>
                          <td className="px-6 py-4 border-r border-slate-200 font-black text-slate-800 text-[14px]">{phase.name}</td>
                          <td className={`px-6 py-4 border-r border-slate-200 text-center font-black ${phaseTotal < 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                            {formatNum(phaseTotal)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button onClick={() => setViewMode('labor-detail')} className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-black hover:bg-blue-700 transition-all shadow-md shadow-blue-500/10">查看明细</button>
                              <button onClick={() => setLaborPhases(laborPhases.filter(lp => lp.id !== phase.id))} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Icon name="Trash2" size={16} /></button>
                              <button onClick={() => setLaborPhases(laborPhases.map(lp => lp.id === phase.id ? {...lp, isExpanded: !lp.isExpanded} : lp))} className="p-2 text-slate-300 hover:text-slate-800 transition-all"><Icon name={phase.isExpanded ? "ChevronUp" : "ChevronDown"} size={16} /></button>
                            </div>
                          </td>
                        </tr>

                        {/* 二级分组：楼栋/部位 */}
                        {phase.isExpanded && phase.buildings.map((building, bIdx) => {
                          const buildingTotal = building.categories.reduce((acc, c) => acc + c.amount, 0);
                          return (
                            <React.Fragment key={building.id}>
                              <tr className="bg-slate-50/40 group transition-all">
                                <td className="px-6 py-3.5 text-center border-r border-slate-200 text-slate-400 font-bold">{bIdx + 1}</td>
                                <td className="px-6 py-3.5 border-r border-slate-200 pl-10">
                                  <div className="flex items-center space-x-2">
                                    <button 
                                      onClick={() => setLaborPhases(prev => prev.map(p => p.id === phase.id ? {
                                        ...p, 
                                        buildings: p.buildings.map(b => b.id === building.id ? {...b, isExpanded: !b.isExpanded} : b)
                                      } : p))}
                                      className="p-1 text-slate-300 hover:text-blue-500 transition-all outline-none"
                                    >
                                      <Icon name={building.isExpanded ? "ChevronDown" : "ChevronRight"} size={14} strokeWidth={3} />
                                    </button>
                                    <span className="text-[13px] font-bold text-slate-700">{building.name}</span>
                                  </div>
                                </td>
                                <td className={`px-6 py-3.5 border-r border-slate-200 text-center font-bold ${buildingTotal < 0 ? 'text-rose-400' : 'text-slate-600'}`}>
                                  {formatNum(buildingTotal)}
                                </td>
                                <td className="px-6 py-3.5"></td>
                              </tr>

                              {/* 三级子行：人工类型 */}
                              {building.isExpanded && building.categories.map((cat, cIdx) => (
                                <tr key={cIdx} className="bg-white hover:bg-blue-50/10 transition-colors">
                                  <td className="px-6 py-3 text-center border-r border-slate-100 text-[12px] text-slate-400 font-medium">
                                    {bIdx + 1}.{cIdx + 1}
                                  </td>
                                  <td className="px-6 py-3 border-r border-slate-100 pl-20 text-[12px] text-slate-500 font-medium">
                                    {cat.name}
                                  </td>
                                  <td className={`px-6 py-3 border-r border-slate-100 text-center text-[12px] font-medium ${cat.amount < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                                    {formatNum(cat.amount)}
                                  </td>
                                  <td className="px-6 py-3"></td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                  
                  {/* 小计、税金、浮动、合计行 - 样式与材料调差一致 */}
                  <tr className="bg-slate-50/50">
                    <td className="px-6 py-4 text-center border-r border-slate-200 text-slate-400 font-bold">{ROMAN_NUMS[laborPhases.length] || '二'}</td>
                    <td className="px-6 py-4 border-r border-slate-200 font-black text-slate-800 text-[14px]">小计</td>
                    <td className={`px-6 py-4 border-r border-slate-200 text-center font-black text-lg ${laborSubTotal < 0 ? 'text-rose-500' : 'text-slate-800'}`}>{formatNum(laborSubTotal)}</td>
                    <td className="px-6 py-4"></td>
                  </tr>

                  <tr>
                    <td className="px-6 py-4 text-center border-r border-slate-200 text-slate-400 font-bold">{ROMAN_NUMS[laborPhases.length + 1] || '三'}</td>
                    <td className="px-6 py-4 border-r border-slate-200 font-bold text-slate-600 text-[13px]">税金 ({rules.labor.taxRate}%)</td>
                    <td className={`px-6 py-4 border-r border-slate-200 text-center font-black ${laborTaxAmount < 0 ? 'text-rose-400' : 'text-slate-700'}`}>
                      {formatNum(laborTaxAmount)}
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>

                  <tr>
                    <td className="px-6 py-4 text-center border-r border-slate-200 text-slate-400 font-bold">{ROMAN_NUMS[laborPhases.length + 2] || '四'}</td>
                    <td className="px-6 py-4 border-r border-slate-200 font-bold text-slate-600 text-[13px]">
                      {rules.labor.floatingRate < 0 ? '下浮' : '上浮'} ({Math.abs(rules.labor.floatingRate)}%) 调差金额 (元)
                    </td>
                    <td className={`px-6 py-4 border-r border-slate-200 text-center font-black ${laborFloatingAmount < 0 ? 'text-rose-400' : 'text-slate-700'}`}>
                      {formatNum(laborFloatingAmount)}
                    </td>
                    <td className="px-6 py-4"></td>
                  </tr>

                  <tr className="bg-blue-50/50">
                    <td className="px-6 py-5 text-center font-bold border-r border-slate-200 text-slate-400">{ROMAN_NUMS[laborPhases.length + 3] || '五'}</td>
                    <td className="px-6 py-5 font-black text-[15px] border-r border-slate-200 text-blue-700">合计</td>
                    <td className={`px-6 py-5 border-r border-slate-200 text-center font-black text-2xl tracking-tighter text-blue-700 underline decoration-double decoration-blue-200 ${laborFinalTotal < 0 ? 'text-rose-600' : 'text-blue-700'}`}>
                      {formatNum(laborFinalTotal)}
                    </td>
                    <td className="px-6 py-5"></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 新建项目弹窗 */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-xl font-black text-slate-800 tracking-tight text-left">新建调差项目</h3>
              <button 
                onClick={() => setIsNewModalOpen(false)} 
                className="text-slate-300 hover:text-rose-500 transition-colors outline-none"
              >
                <Icon name="X" size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">项目名称</label>
                <input 
                  type="text" 
                  placeholder="请输入项目名称..." 
                  value={newProjectForm.name}
                  onChange={e => setNewProjectForm({...newProjectForm, name: e.target.value})}
                  className="w-full h-12 bg-white border border-slate-200 rounded-[18px] px-5 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all"
                />
              </div>
            </div>
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-3 shrink-0">
              <button 
                onClick={() => setIsNewModalOpen(false)} 
                className="px-8 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all outline-none"
              >
                取消
              </button>
              <button 
                onClick={handleCreateProject} 
                className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95 outline-none"
              >
                新建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新建调差明细弹窗 */}
      {isNewDetailModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <h3 className="text-xl font-black text-slate-800 tracking-tight text-left">新建调差明细</h3>
              <button 
                onClick={() => setIsNewDetailModalOpen(false)} 
                className="text-slate-300 hover:text-rose-500 transition-colors outline-none"
              >
                <Icon name="X" size={24} />
              </button>
            </div>
            <div className="p-8 space-y-6 text-left">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">调差类型</label>
                <div className="relative group">
                  <select 
                    value={newDetailForm.type}
                    onChange={e => setNewDetailForm({...newDetailForm, type: e.target.value})}
                    className="w-full h-12 bg-white border border-slate-200 rounded-[18px] px-5 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all appearance-none cursor-pointer"
                  >
                    <option value="material">材料调差</option>
                    <option value="labor">人工调差</option>
                  </select>
                  <Icon name="ChevronDown" size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                </div>
              </div>

              {newDetailForm.type === 'material' ? (
                <div className="space-y-2 animate-in slide-in-from-top-1 duration-300">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">楼号/部位</label>
                  <input 
                    type="text" 
                    placeholder="如：1#楼、地下部分、地上部分..." 
                    value={newDetailForm.part}
                    onChange={e => setNewDetailForm({...newDetailForm, part: e.target.value})}
                    className="w-full h-12 bg-white border border-slate-200 rounded-[18px] px-5 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all"
                  />
                </div>
              ) : (
                <div className="space-y-2 animate-in slide-in-from-top-1 duration-300">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">调差阶段</label>
                  <input 
                    type="text" 
                    placeholder="如：开工至地下室地下室顶板完成..." 
                    value={newDetailForm.stage}
                    onChange={e => setNewDetailForm({...newDetailForm, stage: e.target.value})}
                    className="w-full h-12 bg-white border border-slate-200 rounded-[18px] px-5 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 transition-all"
                  />
                </div>
              )}
            </div>
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-3 shrink-0">
              <button 
                onClick={() => setIsNewDetailModalOpen(false)} 
                className="px-8 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all outline-none"
              >
                取消
              </button>
              <button 
                onClick={handleCreateDetail} 
                className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95 outline-none"
              >
                新建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 分享弹窗 */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-8 flex flex-col border border-slate-200 animate-in zoom-in-95">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-slate-800 text-left">分享调差汇总</h3>
                <button onClick={() => setIsShareModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors outline-none"><Icon name="X" size={24} /></button>
             </div>
             <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8 flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm"><Icon name="TrendingUp" size={24} /></div>
                <div className="min-w-0 text-left">
                   <p className="text-sm font-black text-slate-800 truncate">{sharingItem}</p>
                   <p className="text-xs text-slate-400 font-medium truncate mt-0.5">智能调差实时计算报告</p>
                </div>
             </div>
             <button 
                onClick={() => { navigator.clipboard.writeText(window.location.href); alert('链接已成功复制到剪贴板'); setIsShareModalOpen(false); }} 
                className="w-full flex items-center justify-center space-x-3 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-700 transition-all active:scale-95 outline-none"
              >
                <Icon name="Link" size={18} />
                <span>复制分享链接</span>
             </button>
             <button onClick={() => setIsShareModalOpen(false)} className="w-full mt-4 py-3 bg-slate-50 text-slate-500 rounded-2xl font-black text-[12px] hover:bg-slate-100 transition-all outline-none">取消</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialAdjustmentView;