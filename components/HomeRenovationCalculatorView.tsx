import React, { useState, useMemo } from 'react';
import Icon from './Icon';
import ToolCard from './ToolCard';
import { ALL_TOOLS } from '../constants';

interface RenoTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
}

const RENO_TOOLS: RenoTool[] = [
  {
    id: 'wall-tile',
    name: '墙砖计算器',
    description: '根据墙面面积及瓷砖规格，精准计算所需墙砖数量及损耗。',
    icon: 'Grid3X3',
    color: 'text-blue-600',
    gradient: 'from-blue-50 to-indigo-50',
  },
  {
    id: 'floor-tile',
    name: '地砖计算器',
    description: '智能计算地面铺设所需地砖数量，支持多种主流瓷砖尺寸。',
    icon: 'LayoutGrid',
    color: 'text-emerald-600',
    gradient: 'from-emerald-50 to-teal-50',
  },
  {
    id: 'curtain',
    name: '窗帘计算器',
    description: '基于窗户尺寸及褶皱比例，计算窗帘布料、轨道及附件长度。',
    icon: 'Menu',
    color: 'text-amber-600',
    gradient: 'from-amber-50 to-orange-50',
  },
  {
    id: 'floor-board',
    name: '地板计算器',
    description: '计算实木、强化或复合地板铺设量，包含扣条及踢脚线长度。',
    icon: 'StretchHorizontal',
    color: 'text-orange-600',
    gradient: 'from-orange-50 to-amber-50',
  },
  {
    id: 'paint',
    name: '涂料计算器',
    description: '根据墙面及顶面面积，计算乳胶漆用量及涂刷遍数。',
    icon: 'PaintBucket',
    color: 'text-purple-600',
    gradient: 'from-purple-50 to-fuchsia-50',
  }
];

const HomeRenovationCalculatorView: React.FC = () => {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const selectedTool = RENO_TOOLS.find(t => t.id === selectedToolId);
  const hotTools = ALL_TOOLS.filter(t => t.isHot).slice(0, 6);

  // 通用输入状态
  const [inputs, setInputs] = useState({
    length: '4',
    width: '3',
    height: '2.8',
    itemLength: '800',
    itemWidth: '800',
    wastage: '5',
    coats: '2',
    coverage: '12', // 每升涂刷面积
    foldRatio: '2'  // 窗帘褶皱比
  });

  const handleInputChange = (field: string, val: string) => {
    setInputs(prev => ({ ...prev, [field]: val }));
  };

  const results = useMemo(() => {
    const L = parseFloat(inputs.length) || 0;
    const W = parseFloat(inputs.width) || 0;
    const H = parseFloat(inputs.height) || 0;
    const iL = (parseFloat(inputs.itemLength) || 0) / 1000;
    const iW = (parseFloat(inputs.itemWidth) || 0) / 1000;
    const waste = (parseFloat(inputs.wastage) || 0) / 100 + 1;
    const area = L * W;

    switch (selectedToolId) {
      case 'floor-tile':
      case 'floor-board':
        const tileArea = iL * iW;
        const count = tileArea > 0 ? Math.ceil((area / tileArea) * waste) : 0;
        return { main: count, unit: '块/片', subLabel: '建议购买量（含损耗）', area: area.toFixed(2) };
      case 'wall-tile':
        const wallArea = (L + W) * 2 * H;
        const wTileArea = iL * iW;
        const wCount = wTileArea > 0 ? Math.ceil((wallArea / wTileArea) * waste) : 0;
        return { main: wCount, unit: '块/片', subLabel: '建议购买量（含损耗）', area: wallArea.toFixed(2) };
      case 'paint':
        const pWallArea = (L + W) * 2 * H + L * W; // 四壁加顶面
        const totalLitres = Math.ceil((pWallArea / parseFloat(inputs.coverage)) * parseInt(inputs.coats));
        return { main: totalLitres, unit: '升(L)', subLabel: '预计涂料用量', area: pWallArea.toFixed(2) };
      case 'curtain':
        const clothWidth = L * parseFloat(inputs.foldRatio);
        return { main: clothWidth.toFixed(1), unit: '米(m)', subLabel: '成品布料总宽', area: L.toFixed(1) };
      default:
        return { main: 0, unit: '-', subLabel: '-', area: '0' };
    }
  }, [selectedToolId, inputs]);

  const renderSelectionGrid = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
          <h2 className="text-xl font-bold text-slate-800">请选择计算模块</h2>
        </div>
        <p className="text-slate-500 text-sm ml-4 font-medium">针对家装常用材料提供精准计算，有效控制成本，减少施工浪费。</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {RENO_TOOLS.map((tool) => (
          <div 
            key={tool.id} 
            onClick={() => setSelectedToolId(tool.id)}
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

  const renderCalculator = () => (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setSelectedToolId(null)}
          className="flex items-center space-x-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-sm bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100"
        >
          <Icon name="ArrowLeft" size={16} />
          <span>返回选择模块</span>
        </button>
        <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
          <Icon name={selectedTool?.icon || 'Home'} size={18} className="text-blue-600" />
          <span className="text-blue-700 font-bold text-sm">当前计算：{selectedTool?.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 输入面板 */}
        <div className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
            <h3 className="text-lg font-bold text-slate-800">参数录入</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">房间长度 (米)</label>
              <input 
                type="number" 
                value={inputs.length}
                onChange={(e) => handleInputChange('length', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700 font-black text-lg shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">房间宽度 (米)</label>
              <input 
                type="number" 
                value={inputs.width}
                onChange={(e) => handleInputChange('width', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700 font-black text-lg shadow-inner"
              />
            </div>

            {(selectedToolId === 'wall-tile' || selectedToolId === 'paint') && (
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">层高/墙高 (米)</label>
                <input 
                  type="number" 
                  value={inputs.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700 font-black text-lg shadow-inner"
                />
              </div>
            )}

            {selectedToolId?.includes('tile') || selectedToolId === 'floor-board' ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">材料长度 (毫米mm)</label>
                  <input 
                    type="number" 
                    value={inputs.itemLength}
                    onChange={(e) => handleInputChange('itemLength', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700 font-black text-lg shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">材料宽度 (毫米mm)</label>
                  <input 
                    type="number" 
                    value={inputs.itemWidth}
                    onChange={(e) => handleInputChange('itemWidth', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700 font-black text-lg shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">预计损耗率 (%)</label>
                  <input 
                    type="number" 
                    value={inputs.wastage}
                    onChange={(e) => handleInputChange('wastage', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700 font-black text-lg shadow-inner"
                  />
                </div>
              </>
            ) : selectedToolId === 'paint' ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">涂刷遍数</label>
                  <input 
                    type="number" 
                    value={inputs.coats}
                    onChange={(e) => handleInputChange('coats', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700 font-black text-lg shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">单位用量 (m²/L)</label>
                  <input 
                    type="number" 
                    value={inputs.coverage}
                    onChange={(e) => handleInputChange('coverage', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700 font-black text-lg shadow-inner"
                  />
                </div>
              </>
            ) : selectedToolId === 'curtain' ? (
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">褶皱倍率 (倍数)</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={inputs.foldRatio}
                  onChange={(e) => handleInputChange('foldRatio', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700 font-black text-lg shadow-inner"
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* 结果展示 */}
        <div className="bg-white rounded-[40px] p-10 flex flex-col justify-between shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 pointer-events-none"></div>
          
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black tracking-widest uppercase mb-8">实时计算结果</span>
            <div className="space-y-2">
              <p className="text-slate-500 text-sm font-bold">{results.subLabel}</p>
              <div className="flex items-baseline space-x-3">
                <span className="text-7xl font-black tracking-tighter text-blue-600">{results.main}</span>
                <span className="text-xl font-bold text-slate-400">{results.unit}</span>
              </div>
            </div>
          </div>

          <div className="pt-10 mt-10 border-t border-slate-100 flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">预估覆盖面积</p>
              <p className="text-2xl font-black text-slate-800">{results.area} <span className="text-sm font-bold text-slate-400">m²</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 custom-scrollbar scroll-smooth">
      <div className="max-w-6xl mx-auto space-y-10 mb-16">


        {/* 主体切换 */}
        {selectedToolId ? renderCalculator() : renderSelectionGrid()}
      </div>

      {/* 热门推荐 - 通栏展示 */}
      {!selectedToolId && (
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

export default HomeRenovationCalculatorView;