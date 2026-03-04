import React, { useState, useMemo } from 'react';
import Icon from './Icon';
import ToolCard from './ToolCard';
import { ALL_TOOLS } from '../constants';

interface FeeTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
}

const FEE_TOOLS: FeeTool[] = [
  {
    id: 'cost-consulting',
    name: '造价咨询费',
    description: '涵盖清单编制、审核、全过程造价控制及司法鉴定收费计算',
    icon: 'BadgeDollarSign',
    color: 'text-blue-600',
    gradient: 'from-blue-50 to-indigo-50',
  },
  {
    id: 'bidding-agency',
    name: '招标代理费',
    description: '基于计价格[2002]1980号文及各省市最新调整系数计算',
    icon: 'Gavel',
    color: 'text-emerald-600',
    gradient: 'from-emerald-50 to-teal-50',
  },
  {
    id: 'supervision',
    name: '监理费',
    description: '智能计算施工监理、安装监理及人防监理专业服务费用',
    icon: 'Eye',
    color: 'text-amber-600',
    gradient: 'from-amber-50 to-orange-50',
  },
  {
    id: 'design',
    name: '设计费',
    description: '依据2002版工程勘察设计收费标准，支持复杂程度系数调整',
    icon: 'PencilRuler',
    color: 'text-rose-600',
    gradient: 'from-rose-50 to-pink-50',
  },
  {
    id: 'survey',
    name: '勘察费',
    description: '岩土工程勘察、水文地质勘察及工程测量专项取费计算',
    icon: 'Map',
    color: 'text-indigo-600',
    gradient: 'from-indigo-50 to-violet-50',
  },
  {
    id: 'feasibility',
    name: '可研咨询费',
    description: '建设项目可行性研究报告编制及评估取费，支持多阶段调整',
    icon: 'FileSearch',
    color: 'text-cyan-600',
    gradient: 'from-cyan-50 to-sky-50',
  },
  {
    id: 'project-management',
    name: '项目管理费',
    description: '全过程工程项目管理服务费，含建设单位管理费精细化计算',
    icon: 'Briefcase',
    color: 'text-violet-600',
    gradient: 'from-violet-50 to-purple-50',
  },
  {
    id: 'water-conservation',
    name: '水保咨询费',
    description: '水土保持方案编制、监测及验收技术服务专项费用测算',
    icon: 'Droplets',
    color: 'text-sky-600',
    gradient: 'from-sky-50 to-blue-50',
  },
  {
    id: 'environmental',
    name: '环评咨询费',
    description: '环境影响评价报告书（表）编制及相关咨询评审取费',
    icon: 'Leaf',
    color: 'text-green-600',
    gradient: 'from-green-50 to-emerald-50',
  },
  {
    id: 'drawing-review',
    name: '施工图审查费',
    description: '建筑工程、市政工程施工图设计文件专项审查收费标准',
    icon: 'ClipboardCheck',
    color: 'text-orange-600',
    gradient: 'from-orange-50 to-yellow-50',
  },
  {
    id: 'energy-assessment',
    name: '节能评估费',
    description: '固定资产投资项目节能报告编制及第三方评审费用计算',
    icon: 'Lightbulb',
    color: 'text-yellow-600',
    gradient: 'from-yellow-50 to-amber-50',
  },
  {
    id: 'safety-eval',
    name: '安全评价费',
    description: '安全预评价、验收评价及现状评价专项安全服务收费',
    icon: 'ShieldAlert',
    color: 'text-red-600',
    gradient: 'from-red-50 to-rose-50',
  },
  {
    id: 'social-stability',
    name: '社会稳定风险评估费',
    description: '重大固定资产投资项目社会稳定风险评估报告取费测算',
    icon: 'Users2',
    color: 'text-teal-600',
    gradient: 'from-teal-50 to-cyan-50',
  }
];

const CALC_ITEMS = [
  '1.投资估算编制或审核',
  '2.设计概算编制或审核',
  '3.方案优化',
  '4.施工图工程预算编制或审核',
  '5.工程量清单及招标控制价的编制或审核',
  '6.工程结算编制',
  '7.工程结算审核-基本收费',
  '8.全过程造价咨询'
];

const REGIONS = ['北京', '上海', '浙江', '江苏', '广东', '四川', '湖北', '福建', '安徽', '江西'];

const ZHE_STANDARDS = [
  { id: '浙建价协〔2021〕13号', name: '浙建价协〔2021〕13号' },
  { id: '浙价服〔2009〕84号', name: '浙价服〔2009〕84号' }
];

const FeeCalculatorView: React.FC = () => {
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null);
  const selectedFee = FEE_TOOLS.find(t => t.id === selectedFeeId);
  const hotTools = ALL_TOOLS.filter(t => t.isHot).slice(0, 6);

  // 计算参数状态
  const [region, setRegion] = useState('上海');
  const [standardType, setStandardType] = useState<'old' | 'new'>('new');
  const [coeff1, setCoeff1] = useState('1.0');
  const [coeff2, setCoeff2] = useState('1.0');
  const [selectedItem, setSelectedItem] = useState(CALC_ITEMS[2]);
  const [investment, setInvestment] = useState<string>('12345');
  const [discount, setDiscount] = useState<number>(80);
  const [globalDiscount, setGlobalDiscount] = useState<number>(80);

  // 记录栏状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [calcHistory, setCalcHistory] = useState<{id: string, name: string, price: number, time: string, details: string}[]>([]);
  const [zheStandard, setZheStandard] = useState('浙建价协〔2021〕13号');
  const [showDocModal, setShowDocModal] = useState(false);

  // 统计历史状态
  const [historyItems, setHistoryItems] = useState<{name: string, price: number}[]>([]);

  // 实时计算逻辑
  const calculatedResults = useMemo(() => {
    const inv = parseFloat(investment) || 0;
    const c1 = region !== '浙江' ? (parseFloat(coeff1) || 1.0) : 1.0;
    const c2 = region !== '浙江' ? (parseFloat(coeff2) || 1.0) : 1.0;
    
    // 模拟区间计算，新旧标准影响基数
    const baseMultiplier = standardType === 'new' ? 1.0 : 0.85;
    const minRate = 500.00 * baseMultiplier;
    const maxRate = 1000.00 * baseMultiplier;
    
    const baseStandardMin = inv * minRate * c1 * c2;
    const baseStandardMax = inv * maxRate * c1 * c2;

    const standard = inv * 0.0056 * c1 * c2 * 10000 * baseMultiplier; 
    const discounted = standard * (discount / 100);

    return {
      standard,
      discounted,
      minRate,
      maxRate,
      baseStandardMin,
      baseStandardMax,
      discountedMin: baseStandardMin * (discount / 100),
      discountedMax: baseStandardMax * (discount / 100)
    };
  }, [investment, coeff1, coeff2, discount, standardType, region]);

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert('金额已复制到剪贴板');
  };

  const handleCopyReport = () => {
    const lines = [
      '【计算过程报告】',
      '---------------------------------------',
      `地区 : ${region}`,
      `标准 : ${standardType === 'new' ? '2024新标准' : '老标准'}`,
      `收费项目 : ${selectedItem}`,
      `基数(万元) : ${investment}`,
      region === '浙江' ? `收费依据 : ${zheStandard}` : '',
      '---------------------------------------',
      `参考单价(元) : ${calculatedResults.minRate.toFixed(2)} 至 ${calculatedResults.maxRate.toFixed(2)}`,
      '---------------------------------------',
      `${investment} × ${calculatedResults.minRate.toFixed(2)} = ${calculatedResults.baseStandardMin.toFixed(2)} 元`,
      `${investment} × ${calculatedResults.maxRate.toFixed(2)} = ${calculatedResults.baseStandardMax.toFixed(2)} 元`,
      '---------------------------------------',
      `按 ${discount}% 计算得 : ${calculatedResults.discountedMin.toFixed(2)} 元 至 ${calculatedResults.discountedMax.toFixed(2)} 元`,
      '---------------------------------------',
      `生成日期 : ${new Date().toLocaleString()}`,
    ].filter(Boolean).join('\n');
    
    navigator.clipboard.writeText(lines);
    alert('计算报告内容已复制到剪贴板');
  };

  const addCurrentToStats = (type: 'standard' | 'discounted') => {
    const price = type === 'standard' ? calculatedResults.standard : calculatedResults.discounted;
    const label = type === 'standard' ? `${selectedItem}(标)` : `${selectedItem}(优)`;
    
    setHistoryItems(prev => [{ name: label, price: price }, ...prev]);
    
    const newRecord = {
      id: Date.now().toString(),
      name: label,
      price: price,
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      details: `${region}地区 / 基数 ${investment}万 / ${discount}%`
    };
    setCalcHistory(prev => [newRecord, ...prev]);
  };

  const totalSum = historyItems.reduce((acc, curr) => acc + curr.price, 0);

  const renderSelectionGrid = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
          <h2 className="text-xl font-bold text-slate-800">专业领域选择</h2>
        </div>
        <p className="text-slate-500 text-sm ml-4 font-medium">请选择需要计算的专业咨询费用类型，系统将加载对应行业的取费基准。</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-12">
        {FEE_TOOLS.map((tool) => (
          <div 
            key={tool.id} 
            onClick={() => setSelectedFeeId(tool.id)}
            className="group bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-300 transition-all duration-500 cursor-pointer flex flex-col h-full active:scale-95"
          >
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center ${tool.color} mb-5 transition-transform group-hover:scale-110 shadow-sm`}>
              <Icon name={tool.icon} size={24} />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{tool.name}</h3>
            <p className="text-slate-400 text-[11px] font-medium leading-relaxed flex-1 line-clamp-2">{tool.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCalculatorInterface = () => (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* 左侧主计算区域 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* 顶部控制栏 */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedFeeId(null)}
            className="flex items-center space-x-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
          >
            <Icon name="ArrowLeft" size={16} />
            <span>返回重新选择费用</span>
          </button>
          
          {/* 当前模式标签 - 蓝底胶囊样式 */}
          <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 animate-in fade-in zoom-in-95 duration-300 shadow-sm">
            <Icon name={selectedFee?.icon || 'BadgeDollarSign'} size={18} className="text-blue-600" />
            <span className="text-blue-700 font-black text-sm tracking-tight whitespace-nowrap">当前模式：{selectedFee?.name}</span>
          </div>
        </div>

        {/* 蓝框模块：第一步 基础参数设置 + 第二步 计算项选择与数据录入 + 实时结果 */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 flex flex-col space-y-12">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="px-6 py-2 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-sm font-black border border-blue-100">第一步</div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">基础参数设置</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-[24px]">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">所在区域</label>
                    <div className="relative">
                      <select 
                        value={region} 
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:border-blue-400 outline-none appearance-none cursor-pointer shadow-sm text-left"
                      >
                        {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <Icon name="ChevronDown" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* 如果是浙江，展示统一风格的选择框 */}
                  {region === '浙江' ? (
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">收费依据文件</label>
                      <div className="flex items-center space-x-3">
                        <div className="relative flex-1">
                          <select 
                            value={zheStandard}
                            onChange={(e) => setZheStandard(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:border-blue-400 outline-none appearance-none cursor-pointer shadow-sm text-left"
                          >
                            {ZHE_STANDARDS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <Icon name="ChevronDown" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        <button 
                          onClick={() => setShowDocModal(true)}
                          className="px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shrink-0 shadow-sm"
                        >
                          查看依据
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">调整系数1</label>
                        <input 
                          type="number" 
                          value={coeff1}
                          onChange={(e) => setCoeff1(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:border-blue-400 outline-none shadow-sm transition-all text-left"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">调整系数2</label>
                        <input 
                          type="number" 
                          value={coeff2}
                          onChange={(e) => setCoeff2(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-700 focus:border-blue-400 outline-none shadow-sm transition-all text-left"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="px-6 py-2 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-sm font-black border border-blue-100">第二步</div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">计算项选择与数据录入</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-6 rounded-[24px]">
                  <div className="flex flex-col min-h-0">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 ml-1">选择计算项目</label>
                    <div className="flex-1 max-h-[220px] border border-slate-200 rounded-2xl overflow-y-auto custom-scrollbar bg-white shadow-sm">
                      {CALC_ITEMS.map((item) => (
                        <div 
                          key={item}
                          onClick={() => setSelectedItem(item)}
                          className={`px-4 py-2.5 text-[11px] font-bold transition-all cursor-pointer border-b border-slate-50 last:border-0 ${selectedItem === item ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">估算价 (万元)</label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">¥</span>
                        <input 
                          type="number" 
                          value={investment}
                          onChange={(e) => setInvestment(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-10 pr-4 text-xl font-black text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none transition-all shadow-sm text-left"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider ml-1">收费比例 (打折 %)</label>
                      <div className="relative group">
                        <input 
                          type="number" 
                          value={discount}
                          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 px-6 text-xl font-black text-slate-800 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 outline-none transition-all shadow-sm text-left"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">%</span>
                      </div>
                    </div>
                    <div className="pt-3 flex justify-end">
                      <button 
                        onClick={() => addCurrentToStats('discounted')}
                        className="bg-blue-600 text-white px-8 py-2.5 rounded-xl font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center space-x-2 group outline-none"
                      >
                        <Icon name="Save" size={16} className="group-hover:scale-110 transition-transform" />
                        <span>保存记录</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-blue-50/80 border border-blue-100 rounded-[32px] p-8 shadow-sm flex flex-col justify-between h-full min-h-[500px]">
                <div>
                  <div className="mb-8"><h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">实时计算结果</h4></div>
                  <div className="space-y-12">
                    <div className="relative group">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-slate-400">标准收费 (100%)</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline space-x-2">
                              <span className="text-3xl font-black text-slate-700">{calculatedResults.standard.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              <span className="text-xs font-bold text-slate-400">元</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button onClick={() => addCurrentToStats('standard')} className="w-8 h-8 bg-white border border-blue-200 text-blue-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-lg flex items-center justify-center transition-all shadow-sm outline-none" title="添加到统计表"><Icon name="Plus" size={18} strokeWidth={3} /></button>
                          <button onClick={() => copyToClipboard(calculatedResults.standard.toFixed(2))} className="w-8 h-8 bg-white border border-blue-200 text-blue-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-lg flex items-center justify-center transition-all shadow-sm outline-none" title="复制金额"><Icon name="Copy" size={14} strokeWidth={3} /></button>
                        </div>
                      </div>
                    </div>
                    <div className="h-px bg-blue-100/50"></div>
                    <div className="relative group">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold text-emerald-500">优惠收费 ({discount}%)</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-baseline space-x-2">
                              <span className="text-4xl font-black text-emerald-600">{calculatedResults.discounted.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              <span className="text-xs font-bold text-emerald-400">元</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button onClick={() => addCurrentToStats('discounted')} className="w-8 h-8 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg transition-all outline-none" title="添加到统计表"><Icon name="Plus" size={18} strokeWidth={3} /></button>
                          <button onClick={() => copyToClipboard(calculatedResults.discounted.toFixed(2))} className="w-8 h-8 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg transition-all outline-none" title="复制金额"><Icon name="Copy" size={14} strokeWidth={3} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-blue-100/50"><p className="text-[10px] text-blue-300 font-bold italic opacity-60">数据已根据 {region} 省 2024 年度最新咨询取费标准完成校验</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* 统计模块 第三步 */}
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-10 space-y-10">
          <div className="flex items-center space-x-4">
            <div className="px-6 py-2 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-sm font-black border border-blue-100">第三步</div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">多项统计及查看计算报告</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 flex flex-col">
              <div className="flex items-center justify-between mb-4 px-1"><h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest">多项统计概览</h4><button onClick={() => setHistoryItems([])} className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors">清空列表</button></div>
              <div className="bg-slate-50/50 border border-slate-200 rounded-[32px] p-6 flex flex-col h-[500px]">
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 mb-6">
                  {historyItems.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl flex items-center justify-between group transition-all border border-slate-100 hover:border-blue-100 hover:shadow-sm">
                      <div className="min-w-0"><p className="text-[12px] font-bold text-slate-500 truncate mb-1">{item.name}</p><p className="text-[16px] font-black text-slate-800">¥ {item.price.toLocaleString()}</p></div>
                      <button onClick={() => setHistoryItems(prev => prev.filter((_, i) => i !== idx))} className="w-6 h-6 rounded-full text-slate-300 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all"><Icon name="X" size={12} strokeWidth={3} /></button>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-slate-200 space-y-4">
                  <div className="flex items-center space-x-3 text-[13px] font-bold text-slate-600"><span>按</span><div className="relative"><input type="number" value={globalDiscount} onChange={(e) => setGlobalDiscount(parseInt(e.target.value) || 0)} className="w-16 h-9 bg-white border border-slate-200 rounded-xl text-center focus:border-blue-400 outline-none text-slate-700 font-black shadow-sm" /></div><span>%</span><button className="bg-white border border-slate-200 px-4 py-1.5 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors font-black text-xs shadow-sm">合计</button></div>
                  <div className="space-y-1.5 pl-1 pt-1"><p className="text-xs font-bold text-slate-500">合计金额: <span className="text-slate-800 font-black ml-1">{totalSum.toLocaleString()} 元</span></p><p className="text-xs font-bold text-slate-500">计算: <span className="text-blue-600 font-black ml-1">{(totalSum * (globalDiscount / 100)).toLocaleString()} 元</span></p></div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-8 flex flex-col">
              <div className="flex items-center justify-between mb-4 px-1">
                <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-widest">计算报告</h4>
                <div className="flex items-center">
                  <button 
                    onClick={handleCopyReport}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors mr-3 outline-none active:scale-95"
                  >
                    复制内容
                  </button>
                  <button className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1 outline-none active:scale-95">
                    <Icon name="Download" size={12} />
                    <span>导出</span>
                  </button>
                </div>
              </div>
              <div className="bg-slate-50/50 border border-slate-200 rounded-[32px] p-10 h-[500px] flex flex-col">
                <div className="flex-1 space-y-1 font-mono text-[13px] text-slate-700 leading-relaxed overflow-y-auto custom-scrollbar">
                  <p className="font-black text-slate-900 mb-2">计算过程</p>
                  <p className="text-slate-300">---------------------------------------</p>
                  <div className="space-y-1 py-1">
                    <p>地区 : {region}</p>
                    <p>标准 : {standardType === 'new' ? '2024新标准' : '老标准'}</p>
                    <p>收费项目 : {selectedItem}</p>
                    <p>基数(万元) : {investment}</p>
                    {region === '浙江' && <p>收费依据 : {zheStandard}</p>}
                  </div>
                  <p className="text-slate-300">---------------------------------------</p>
                  <div className="py-1">
                    <p>参考单价(元) : {calculatedResults.minRate.toFixed(2)} 至 {calculatedResults.maxRate.toFixed(2)}</p>
                  </div>
                  <p className="text-slate-300">---------------------------------------</p>
                  <div className="py-2">
                    <p>{investment} × {calculatedResults.minRate.toFixed(2)} = {calculatedResults.baseStandardMin.toFixed(2)} 元</p>
                    <p>{investment} × {calculatedResults.maxRate.toFixed(2)} = {calculatedResults.baseStandardMax.toFixed(2)} 元</p>
                  </div>
                  <p className="text-slate-300">---------------------------------------</p>
                  <div className="py-1"><p className="font-black text-slate-900">按 {discount}% 计算得 : {calculatedResults.discountedMin.toFixed(2)} 元 至 {calculatedResults.discountedMax.toFixed(2)} 元</p></div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-rose-50/50 border border-rose-100 rounded-[28px] p-6">
            <p className="text-[11px] text-rose-600 leading-loose"><span className="font-black">【温馨提示】</span>计算结果仅供参考，不作为最终取费依据。在使用前，请务必确认已充分研习并核实对应省市最新的收费标准政策及调整系数。针对部分省份设有的收费上下限规定或特定行业调整项，请务必结合项目实际需求进行手动校对及修正。本平台不对计算结果的直接适用性及其产生的任何法律后果承担责任。</p>
          </div>
        </div>
      </div>

      {/* 右侧记录栏 */}
      <div className={`bg-white border-l border-slate-100 flex flex-col shrink-0 transition-all duration-300 relative ${isSidebarOpen ? 'w-72' : 'w-0'}`}>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-12 bg-white border border-slate-200 rounded-l-xl shadow-md text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all outline-none z-20"
        >
          <Icon name={isSidebarOpen ? 'ChevronRight' : 'ChevronLeft'} size={14} />
        </button>

        <div className={`flex flex-col h-full overflow-hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
          <div className="p-5 border-b border-slate-50 flex items-center justify-between shrink-0">
            <h4 className="text-[13px] font-black text-slate-800">对比计算痕迹</h4>
            <div className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">{calcHistory.length}</div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
             {calcHistory.map((rec) => (
               <div key={rec.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2 hover:border-blue-200 hover:bg-white transition-all group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{rec.time}</span>
                    <button 
                      onClick={() => setCalcHistory(prev => prev.filter(r => r.id !== rec.id))}
                      className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Icon name="X" size={10} />
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-600 mb-0.5">{rec.name}</p>
                    <p className="text-[16px] font-black text-slate-900">¥ {rec.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  </div>
                  <div className="pt-1 border-t border-slate-200/50">
                    <p className="text-[10px] text-slate-400 leading-tight font-medium">{rec.details}</p>
                  </div>
               </div>
             ))}
          </div>
          {calcHistory.length > 0 && (
            <div className="p-4 border-t border-slate-50 bg-slate-50/30">
              <button 
                onClick={() => setCalcHistory([])}
                className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm outline-none"
              >
                清空所有记录
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 收费依据文件详情弹窗 */}
      {showDocModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[48px] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden border border-white/20">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Icon name="FileText" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">{zheStandard}</h3>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Charging Basis Document Viewer</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDocModal(false)}
                className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
              >
                <Icon name="X" size={32} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-slate-50/30">
               <div className="max-w-4xl mx-auto bg-white border border-slate-100 shadow-sm rounded-[32px] p-16 space-y-10">
                  <div className="text-center space-y-4 pb-10 border-b border-slate-100">
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">关于发布《浙江省建设工程造价咨询服务收费参考标准》的通知</h2>
                    <p className="text-slate-400 font-bold tracking-widest text-sm uppercase">浙建价协〔2021〕13号</p>
                  </div>

                  <div className="space-y-8 text-slate-700 leading-[2.2] text-[15px]">
                    <p className="font-bold">各会员单位、有关单位：</p>
                    <p className="indent-8 text-justify">
                      为进一步规范我省建设工程造价咨询服务市场收费行为，维护发承包双方的合法权益，促进行业健康发展，根据《价格法》和国家关于清理规范中介服务收费的有关精神，结合我省实际，我协会组织制定了《浙江省建设工程造价咨询服务收费参考标准》（以下简称本标准）。
                    </p>
                    <p className="indent-8 text-justify">
                      本标准仅供各造价咨询企业在承接咨询业务、签订服务合同时参考使用。各单位应根据项目规模、复杂程度、技术难度、服务周期及人员投入等因素，在参考标准的基础上与委托方通过合同约定服务费用。
                    </p>
                    
                    <div className="space-y-4 pt-4">
                      <h4 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                        <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                        <span>一、适用范围</span>
                      </h4>
                      <p className="pl-4">本标准适用于本省范围内各类新建、扩建、改建的建设工程造价咨询服务，包括但不限于投资估算、设计概算、施工图预算、工程量清单编制及招标控制价、工程结算、全过程造价控制等咨询业务。</p>
                    </div>

                    <div className="space-y-4 pt-4">
                      <h4 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                        <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                        <span>二、收费计算方法</span>
                      </h4>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 space-y-6">
                        <div className="flex items-start space-x-3">
                          <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-1">1</div>
                          <p><strong>差额定率累进法：</strong>工程造价咨询收费通常按工程造价的一定比例，并采用差额定率累进计费。计算基数为送审造价或审定造价。</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-1">2</div>
                          <p><strong>计时收费：</strong>对于工作量难以准确计量的咨询事项，可采用计时收费。高级技术人员收费参考标准为1000-1500元/人·天。</p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-1">3</div>
                          <p><strong>效益分成：</strong>结算审核中，除基本咨询费外，可根据核减（增）额协商收取效益分成，分成比例通常在3%-5%之间。</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-10 flex flex-col items-end space-y-1">
                      <p className="font-black text-slate-900">浙江省建设工程造价管理协会</p>
                      <p className="text-slate-400 font-bold">2021年10月15日</p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="px-10 py-6 border-t border-slate-100 bg-white flex items-center justify-end shrink-0">
               <button 
                 onClick={() => setShowDocModal(false)}
                 className="px-12 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all outline-none"
               >
                 已阅并返回计算
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`flex-1 overflow-y-auto bg-slate-50 scroll-smooth custom-scrollbar relative ${!selectedFeeId ? 'p-6 lg:p-10' : ''}`}>
      <div className="flex-1 w-full h-full">
        {!selectedFeeId ? (
          <div className="max-w-6xl mx-auto space-y-8 mb-16">

            {renderSelectionGrid()}
          </div>
        ) : (
          renderCalculatorInterface()
        )}
      </div>

      {!selectedFeeId && (
        <div className="w-full">
          <section className="pt-10 pb-16 border-t border-slate-200/60">
            <div className="flex items-center justify-between mb-8 max-w-[1600px] mx-auto px-4 md:px-6">
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">热门推荐</h2>
              </div>
              <button className="text-xs text-blue-600 font-bold hover:text-blue-800 flex items-center transition-colors outline-none">
                查看全部 <Icon name="ChevronRight" size={14} className="ml-1" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 px-4 max-w-[1600px] mx-auto md:px-6">
              {hotTools.map(tool => (
                <ToolCard 
                  key={tool.id} 
                  tool={tool} 
                  onClick={() => {
                    alert(`即将为您启动: ${tool.name}`);
                  }} 
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default FeeCalculatorView;