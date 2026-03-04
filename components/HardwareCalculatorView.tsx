import React, { useState, useMemo, useEffect } from 'react';
import Icon from './Icon';
import ToolCard from './ToolCard';
import { ALL_TOOLS } from '../constants';

interface HardwareCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
}

const CATEGORIES: HardwareCategory[] = [
  {
    id: 'steel',
    name: '钢材计算',
    description: '支持角钢、工字钢、H型钢、冷弯型钢等 29 种专业截面计算',
    icon: 'Box',
    color: 'text-blue-600',
    gradient: 'from-blue-50 to-indigo-50',
  },
  {
    id: 'plate',
    name: '钢板计算',
    description: '根据长、宽、厚度及密度，精准计算普通钢板、花纹钢板重量',
    icon: 'Layers',
    color: 'text-indigo-600',
    gradient: 'from-indigo-50 to-violet-50',
  },
  {
    id: 'pipe',
    name: '钢管计算',
    description: '支持无缝钢管、焊接钢管、不锈钢管及有色金属管理论重量测算',
    icon: 'Pipette',
    color: 'text-blue-600',
    gradient: 'from-blue-50 to-indigo-50',
  },
  {
    id: 'rebar',
    name: '钢筋计算',
    description: '涵盖圆钢、螺纹钢及钢筋网片计算，内置标准HRB系列理论重量表',
    icon: 'Menu',
    color: 'text-emerald-600',
    gradient: 'from-emerald-50 to-teal-50',
  }
];

const STEEL_SUB_TYPES = [
  '角钢', '钢板', '螺纹钢', '普通工字钢', '普通槽钢', 'C 型钢', 'U 型钢', '圆钢', '方钢', 
  '圆盘条', '轻型工字钢', '轻型槽钢', 'H 型钢', '钢轨', '槽钢', '六角钢', '等边角钢', 
  '低合金轻型工字钢', '低合金轻型槽钢', 'Z 型钢', '圆形冷弯空心型钢', '高频焊接工字钢', 
  '工字钢', '八角钢', '不等边角钢', '扁钢', 'T 型钢', '方形冷弯空心型钢', '矩形冷弯空心型钢'
];

const DENSITY_PRESETS = [
  { name: '钢密度', value: 7850 },
  { name: '不锈钢', value: 7930 },
  { name: '铝密度', value: 2700 },
  { name: '铜密度', value: 8900 },
];

const COMMON_SPECS: Record<string, any[]> = {
  steel: [
    { name: '∠ 25×3', unitWeight: 1.124, r: 3.5, area: 1.432, isEqual: true },
    { name: '∠ 30×3', unitWeight: 1.373, r: 4.0, area: 1.749, isEqual: true },
    { name: '∠ 40×4', unitWeight: 2.422, r: 4.5, area: 3.086, isEqual: true },
    { name: '∠ 50×5', unitWeight: 3.770, r: 5.5, area: 4.803, isEqual: true },
    { name: '∠ 25×16×3', unitWeight: 0.912, r: 3.5, zx: 4.2, zy: 8.6, area: 1.16, isEqual: false },
    { name: '∠ 32×20×3', unitWeight: 1.171, r: 4.0, zx: 5.2, zy: 10.2, area: 1.49, isEqual: false },
    { name: '∠ 40×25×4', unitWeight: 1.94, r: 4.5, zx: 7.2, zy: 14.8, area: 2.47, isEqual: false },
  ],
  plate: [{ name: '2.0mm 钢板', t: 2.0, unitWeight: 15.7 }, { name: '5.0mm 钢板', t: 5.0, unitWeight: 39.25 }],
  pipe: [{ name: 'DN15 (21.3x2.8)', d: 21.3, t: 2.8, unitWeight: 1.28 }],
  rebar: [{ name: 'Φ6 (圆钢)', d: 6, unitWeight: 0.222 }]
};

const HardwareCalculatorView: React.FC = () => {
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedSteelType, setSelectedSteelType] = useState<string>(STEEL_SUB_TYPES[0]);
  const [calcMode, setCalcMode] = useState<'standard' | 'custom'>('standard');
  const [angleSubCategory, setAngleSubCategory] = useState<'equal' | 'unequal'>('equal');
  const [isDetailExpanded, setIsDetailExpanded] = useState(true);
  const [isTypesExpanded, setIsTypesExpanded] = useState(true);
  const [isCustomDensity, setIsCustomDensity] = useState(false);
  const [typeSearchQuery, setTypeSearchQuery] = useState('');

  const [inputs, setInputs] = useState({
    B: '50',
    b: '32',
    t: '4',
    totalLength: '10',
    unitPrice: '5200', 
    density: '7850', 
    diameter: '20',
    thickness: '4.0',
    length: '6',
    width: '1.5',
    side: '50',
    quantity: '1',
    customUnitWeight: '10.88'
  });

  const [selectedSpec, setSelectedSpec] = useState<any>(null);
  const selectedCat = CATEGORIES.find(c => c.id === selectedCatId);
  const hotTools = ALL_TOOLS.filter(t => t.isHot).slice(0, 6);

  const handleInputChange = (field: string, val: string) => {
    setInputs(prev => ({ ...prev, [field]: val }));
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert('数值已复制到剪贴板');
  };

  const filteredSteelTypes = useMemo(() => {
    if (!typeSearchQuery.trim()) return STEEL_SUB_TYPES;
    return STEEL_SUB_TYPES.filter(type => 
      type.toLowerCase().includes(typeSearchQuery.toLowerCase())
    );
  }, [typeSearchQuery]);

  const filteredSpecs = useMemo(() => {
    const specs = COMMON_SPECS[selectedCatId!] || [];
    if (selectedCatId === 'steel' && selectedSteelType === '角钢') {
      return specs.filter(s => s.isEqual === (angleSubCategory === 'equal'));
    }
    return specs;
  }, [selectedCatId, selectedSteelType, angleSubCategory]);

  const customResults = useMemo(() => {
    const B = parseFloat(inputs.B) || 0;
    const b = angleSubCategory === 'equal' ? B : (parseFloat(inputs.b) || 0);
    const t = parseFloat(inputs.t) || 0;
    const L = parseFloat(inputs.totalLength) || 0;
    const tonPrice = parseFloat(inputs.unitPrice) || 0;
    const rho = parseFloat(inputs.density) || 7850;

    const area_cm2 = ((B + b - t) * t) / 100; 
    const unitWeight = (area_cm2 / 10000) * rho;
    const unitSurfaceArea = ((B + b) * 2) / 1000;
    
    const totalWeight = unitWeight * L;
    const totalArea = unitSurfaceArea * L;
    const totalPrice = (totalWeight / 1000) * tonPrice;

    return {
      unitWeight: unitWeight.toFixed(3),
      area: area_cm2.toFixed(3),
      unitSurfaceArea: unitSurfaceArea.toFixed(3),
      totalWeight: totalWeight.toFixed(2),
      totalArea: totalArea.toFixed(2),
      totalPrice: totalPrice.toFixed(2)
    };
  }, [inputs.B, inputs.b, inputs.t, inputs.totalLength, inputs.unitPrice, inputs.density, angleSubCategory]);

  const results = useMemo(() => {
    if (selectedCatId === 'steel' && selectedSteelType === '角钢' && calcMode === 'custom') {
      return null;
    }
    const L = parseFloat(inputs.length) || 0;
    const Q = parseFloat(inputs.quantity) || 1;
    let unitW = calcMode === 'standard' && selectedSpec ? selectedSpec.unitWeight : parseFloat(inputs.customUnitWeight) || 0;
    const singleWeight = unitW * L;
    return { unitWeight: unitW.toFixed(3), singleWeight: singleWeight.toFixed(2), totalWeight: (singleWeight * Q).toFixed(2), unitLabel: 'kg/m' };
  }, [selectedCatId, selectedSteelType, calcMode, inputs.length, inputs.quantity, inputs.customUnitWeight, selectedSpec]);

  const renderSelectionGrid = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
          <h2 className="text-xl font-bold text-slate-800">第一步：选择计算类别</h2>
        </div>
        <p className="text-slate-500 text-sm ml-4 font-medium">内置国标理论重量数据库，覆盖施工现场 95% 以上常用金属材料。</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {CATEGORIES.map((cat) => (
          <div 
            key={cat.id} 
            onClick={() => setSelectedCatId(cat.id)} 
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
    </div>
  );

  const renderCalculator = () => (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col space-y-4">
        <button onClick={() => setSelectedCatId(null)} className="flex items-center space-x-2 text-slate-400 hover:text-blue-600 font-bold text-[12px] bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 w-fit"><Icon name="ArrowLeft" size={14} /><span>返回选择类别</span></button>
      </div>

      {selectedCatId === 'steel' && (
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
          <div 
            onClick={() => setIsTypesExpanded(!isTypesExpanded)}
            className="flex items-center justify-between cursor-pointer group/types-header px-1"
          >
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-800">请选择具体的型材种类</h3>
            </div>
            <div className={`p-1.5 rounded-lg transition-all ${isTypesExpanded ? 'text-blue-600 bg-blue-50' : 'text-slate-400 group-hover/types-header:text-blue-600 group-hover/types-header:bg-blue-50'}`}>
              <Icon name="ChevronDown" size={20} className={`transition-transform duration-300 ${isTypesExpanded ? 'rotate-0' : '-rotate-90'}`} />
            </div>
          </div>
          
          {isTypesExpanded && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="max-w-md px-1">
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Icon name="Search" size={16} />
                  </div>
                  <input 
                    type="text"
                    value={typeSearchQuery}
                    onChange={(e) => setTypeSearchQuery(e.target.value)}
                    placeholder="关键词搜索型材种类..."
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-xs font-bold text-slate-700 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all text-left"
                  />
                  {typeSearchQuery && (
                    <button 
                      onClick={() => setTypeSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      <Icon name="XCircle" size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {filteredSteelTypes.map(type => (
                  <button 
                    key={type} 
                    onClick={() => { setSelectedSteelType(type); setSelectedSpec(null); }} 
                    className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all border ${selectedSteelType === type ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-300 hover:text-blue-600'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-800">参数设置</h3>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-sm">
              <button onClick={() => setCalcMode('standard')} className={`px-4 py-1.5 rounded-xl text-[12px] font-black transition-all ${calcMode === 'standard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>常用规格计算</button>
              <button onClick={() => setCalcMode('custom')} className={`px-4 py-1.5 rounded-xl text-[12px] font-black transition-all ${calcMode === 'custom' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>自定义计算</button>
            </div>
          </div>

          {selectedCatId === 'steel' && selectedSteelType === '角钢' && calcMode === 'custom' ? (
            <div className="animate-in fade-in duration-300 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-wider ml-1">角钢种类</label>
                  <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200 w-fit">
                    <button onClick={() => setAngleSubCategory('equal')} className={`px-6 py-2 rounded-xl text-[12px] font-bold transition-all ${angleSubCategory === 'equal' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>等边角钢</button>
                    <button onClick={() => setAngleSubCategory('unequal')} className={`px-6 py-2 rounded-xl text-[12px] font-bold transition-all ${angleSubCategory === 'unequal' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>不等边角钢</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                  <div className="flex items-center space-x-3">
                    <span className="text-[13px] font-bold text-slate-700 shrink-0">长边 B (mm)</span>
                    <input type="number" value={inputs.B} onChange={(e) => handleInputChange('B', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-4 text-[13px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-left" />
                  </div>
                  {angleSubCategory === 'unequal' && (
                    <div className="flex items-center space-x-3">
                      <span className="text-[13px] font-bold text-slate-700 shrink-0">短边 b (mm)</span>
                      <input type="number" value={inputs.b} onChange={(e) => handleInputChange('b', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-4 text-[13px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-left" />
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <span className="text-[13px] font-bold text-slate-700 shrink-0">厚度 t (mm)</span>
                    <input type="number" value={inputs.t} onChange={(e) => handleInputChange('t', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-4 text-[13px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-left" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-[13px] font-bold text-slate-700 shrink-0">长度 (m)</span>
                    <input type="number" value={inputs.totalLength} onChange={(e) => handleInputChange('totalLength', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl py-2 px-4 text-[13px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-left" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300 space-y-8">
              {calcMode === 'standard' ? (
                <div className="space-y-4">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-wider ml-1">选择标准规格</label>
                  <div className="border border-slate-100 rounded-[28px] overflow-hidden bg-white shadow-sm max-h-[340px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-6 py-3 w-12 text-center">选择</th>
                          <th className="px-4 py-3">型号名称</th>
                          <th className="px-4 py-3 text-right">理论重量 (kg/m)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredSpecs.map((spec) => (
                          <tr key={spec.name} onClick={() => setSelectedSpec(spec)} className={`cursor-pointer transition-colors ${selectedSpec?.name === spec.name ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                            <td className="px-6 py-4 flex justify-center">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedSpec?.name === spec.name ? 'border-blue-500 bg-blue-500 shadow-md' : 'border-slate-200 bg-white'}`}>
                                {selectedSpec?.name === spec.name && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                            </td>
                            <td className={`px-4 py-4 text-xs font-black ${selectedSpec?.name === spec.name ? 'text-blue-600' : 'text-slate-700'}`}>{spec.name}</td>
                            <td className="px-4 py-4 text-xs font-bold text-slate-500 text-right">{spec.unitWeight.toFixed(3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-wider ml-1">单位理论重量 (kg/m)</label>
                    <input type="number" value={inputs.customUnitWeight} onChange={(e) => handleInputChange('customUnitWeight', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-xl font-black text-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-inner" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-wider ml-1">单根长度 (m)</label>
                  <input type="number" value={inputs.length} onChange={(e) => handleInputChange('length', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-base font-bold text-slate-700 focus:border-blue-500 outline-none shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-wider ml-1">数量 (根/片)</label>
                  <input type="number" value={inputs.quantity} onChange={(e) => handleInputChange('quantity', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-base font-bold text-slate-700 focus:border-blue-500 outline-none shadow-inner" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 结果显示区 */}
        <div className="bg-slate-900 rounded-[40px] p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden text-white border border-slate-800">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
           <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-white/10 text-white rounded-lg text-[10px] font-black tracking-widest uppercase mb-8 border border-white/10">计算结果摘要</span>
              {selectedCatId === 'steel' && selectedSteelType === '角钢' && calcMode === 'custom' ? (
                <div className="space-y-10">
                   <div className="space-y-2">
                      <p className="text-slate-400 text-xs font-bold">总重量合计</p>
                      <div className="flex items-baseline space-x-3">
                        <span className="text-6xl font-black tracking-tighter text-blue-400">{customResults.totalWeight}</span>
                        <span className="text-xl font-bold text-slate-500">kg</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6 pt-10 border-t border-white/5">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">单位重量</p>
                        <p className="text-xl font-black">{customResults.unitWeight} <span className="text-xs font-bold text-slate-500">kg/m</span></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">预计总价</p>
                        <p className="text-xl font-black text-emerald-400">¥ {customResults.totalPrice}</p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="space-y-10">
                   <div className="space-y-2">
                      <p className="text-slate-400 text-xs font-bold">计算总重量</p>
                      <div className="flex items-baseline space-x-3">
                        <span className="text-6xl font-black tracking-tighter text-blue-400">{results?.totalWeight}</span>
                        <span className="text-xl font-bold text-slate-500">kg</span>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6 pt-10 border-t border-white/5">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">理论重量</p>
                        <p className="text-xl font-black">{results?.unitWeight} <span className="text-xs font-bold text-slate-500">{results?.unitLabel}</span></p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">单根重量</p>
                        <p className="text-xl font-black">{results?.singleWeight} <span className="text-xs font-bold text-slate-500">kg</span></p>
                      </div>
                   </div>
                </div>
              )}
           </div>
           <div className="mt-12 relative z-10">
              <button onClick={() => copyToClipboard(selectedCatId === 'steel' && selectedSteelType === '角钢' && calcMode === 'custom' ? customResults.totalWeight : results?.totalWeight || '')} className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs transition-all uppercase tracking-widest border border-white/10 flex items-center justify-center space-x-2">
                <Icon name="Copy" size={14} />
                <span>复制结果数值</span>
              </button>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 custom-scrollbar scroll-smooth">
      <div className="max-w-6xl mx-auto space-y-10 mb-16">


        {selectedCatId ? renderCalculator() : renderSelectionGrid()}
      </div>

      {!selectedCatId && (
        <div className="w-full">
          <section className="pt-10 pb-16 border-t border-slate-200/60 px-2">
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
                <ToolCard key={tool.id} tool={tool} onClick={() => alert(`即将为您启动: ${tool.name}`)} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default HardwareCalculatorView;