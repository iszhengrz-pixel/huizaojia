import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import ToolCard from './ToolCard';
import { ALL_TOOLS } from '../constants';

const COMMON_TAX_RATES = [1, 3, 6, 9, 13];

const TaxCalculatorView: React.FC = () => {
  const [precision, setPrecision] = useState(2);

  // 热门工具筛选
  const hotTools = ALL_TOOLS.filter(t => t.isHot).slice(0, 6);

  // Mode 1: Including Tax -> Others
  const [incInput, setIncInput] = useState<string>('111.00');
  const [incRate, setIncRate] = useState<number>(13);
  const [incResults, setIncResults] = useState({ tax: '0', exc: '0', inc: '0' });

  // Mode 2: Excluding Tax -> Others
  const [excInput, setExcInput] = useState<string>('100.00');
  const [excRate, setExcRate] = useState<number>(13);
  const [excResults, setExcResults] = useState({ tax: '0', exc: '0', inc: '0' });

  // Calculate Mode 1 (Including Tax)
  useEffect(() => {
    const val = parseFloat(incInput) || 0;
    const rate = incRate / 100;
    const exc = val / (1 + rate);
    const tax = val - exc;
    
    setIncResults({
      tax: tax.toFixed(precision),
      exc: exc.toFixed(precision),
      inc: val.toFixed(precision)
    });
  }, [incInput, incRate, precision]);

  // Calculate Mode 2 (Excluding Tax)
  useEffect(() => {
    const val = parseFloat(excInput) || 0;
    const rate = excRate / 100;
    const inc = val * (1 + rate);
    const tax = inc - val;

    setExcResults({
      tax: tax.toFixed(precision),
      exc: val.toFixed(precision),
      inc: inc.toFixed(precision)
    });
  }, [excInput, excRate, precision]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 scroll-smooth custom-scrollbar animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-8 mb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Icon name="Calculator" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">税费计算</h1>
              <p className="text-slate-500 text-sm">专业的含税/不含税金额互转工具</p>
            </div>
          </div>
          
          <div className="flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm">
            <span className="text-xs font-bold text-slate-400 px-3 uppercase tracking-wider">小数点设置</span>
            {[0, 2, 4].map(p => (
              <button
                key={p}
                onClick={() => setPrecision(p)}
                className={`w-8 h-8 rounded-xl text-sm font-bold transition-all ${precision === p ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Section 1: 含税计算 */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50/30 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
              <h2 className="text-lg font-bold text-slate-800">含税计算</h2>
            </div>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-widest">INPUT MODE: GROSS</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Input Side */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2 ml-1">含税金额</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">¥</span>
                  <input 
                    type="number" 
                    value={incInput}
                    onChange={(e) => setIncInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-10 pr-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-800 font-bold text-lg"
                    placeholder="请输入含税总额"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2 ml-1">税率 (%)</label>
                <div className="space-y-3">
                  <div className="relative">
                    <input 
                      type="number" 
                      value={incRate}
                      onChange={(e) => setIncRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-slate-700 font-bold"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_TAX_RATES.map(rate => (
                      <button 
                        key={rate}
                        onClick={() => setIncRate(rate)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${incRate === rate ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600'}`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Results Side */}
            <div className="bg-slate-50 rounded-[28px] p-6 space-y-4 border border-slate-100 flex flex-col justify-center">
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">税金</label>
                  <div className="text-xl font-bold text-slate-800">¥ {incResults.tax}</div>
                </div>
                <button onClick={() => copyToClipboard(incResults.tax)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Icon name="Copy" size={16} /></button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">不含税金额</label>
                  <div className="text-xl font-bold text-emerald-600">¥ {incResults.exc}</div>
                </div>
                <button onClick={() => copyToClipboard(incResults.exc)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Icon name="Copy" size={16} /></button>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                <div>
                  <label className="block text-[10px] font-black text-blue-200 uppercase mb-1">含税总额</label>
                  <div className="text-xl font-bold text-white">¥ {incResults.inc}</div>
                </div>
                <button onClick={() => copyToClipboard(incResults.inc)} className="p-2 text-blue-200 hover:text-white transition-colors"><Icon name="Copy" size={16} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: 不含税计算 */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50/30 rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-2">
              <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
              <h2 className="text-lg font-bold text-slate-800">不含税计算</h2>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg uppercase tracking-widest">INPUT MODE: NET</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Input Side */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2 ml-1">不含税金额</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">¥</span>
                  <input 
                    type="number" 
                    value={excInput}
                    onChange={(e) => setExcInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-10 pr-4 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-800 font-bold text-lg"
                    placeholder="请输入不含税金额"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-2 ml-1">税率 (%)</label>
                <div className="space-y-3">
                  <div className="relative">
                    <input 
                      type="number" 
                      value={excRate}
                      onChange={(e) => setExcRate(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-700 font-bold"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_TAX_RATES.map(rate => (
                      <button 
                        key={rate}
                        onClick={() => setExcRate(rate)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${excRate === rate ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-600'}`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Results Side */}
            <div className="bg-slate-50 rounded-[28px] p-6 space-y-4 border border-slate-100 flex flex-col justify-center">
              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">税金</label>
                  <div className="text-xl font-bold text-slate-800">¥ {excResults.tax}</div>
                </div>
                <button onClick={() => copyToClipboard(excResults.tax)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"><Icon name="Copy" size={16} /></button>
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/20">
                <div>
                  <label className="block text-[10px] font-black text-emerald-100 uppercase mb-1">不含税金额</label>
                  <div className="text-xl font-bold text-white">¥ {excResults.exc}</div>
                </div>
                <button onClick={() => copyToClipboard(excResults.exc)} className="p-2 text-emerald-100 hover:text-white transition-colors"><Icon name="Copy" size={16} /></button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">含税总额</label>
                  <div className="text-xl font-bold text-blue-600">¥ {excResults.inc}</div>
                </div>
                <button onClick={() => copyToClipboard(excResults.inc)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Icon name="Copy" size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 热门工具推荐区域：完全参考日期计算器布局，修复标题栏宽度自适应 */}
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
    </div>
  );
};

export default TaxCalculatorView;