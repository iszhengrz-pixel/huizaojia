
import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import ToolCard from './ToolCard';
import { ALL_TOOLS } from '../constants';

const DateCalculatorView: React.FC = () => {
  // Tab 1: Duration Calculation State
  const [startDate1, setStartDate1] = useState(new Date().toISOString().split('T')[0]);
  const [endDate1, setEndDate1] = useState(new Date().toISOString().split('T')[0]);
  const [includeEnd, setIncludeEnd] = useState(true);

  // Tab 2: Date Projection State
  const [startDate2, setStartDate2] = useState(new Date().toISOString().split('T')[0]);
  const [daysOffset, setDaysOffset] = useState(100);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  // Refs for triggering pickers
  const startRef1 = useRef<HTMLInputElement>(null);
  const endRef1 = useRef<HTMLInputElement>(null);
  const startRef2 = useRef<HTMLInputElement>(null);

  // 热门工具筛选（获取前6个，展示规范与首页一致）
  const hotTools = ALL_TOOLS.filter(t => t.isHot).slice(0, 6);

  // Results for Tab 1
  const [results1, setResults1] = useState({
    total: 0,
    workDays: 0,
    holidayDays: 0,
    breakdown: ''
  });

  // Results for Tab 2
  const [resultDate2, setResultDate2] = useState('');

  // Helper to open native date picker
  const openPicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const el = ref.current;
    if (el) {
      const input = el as any;
      if (typeof input.showPicker === 'function') {
        try {
          input.showPicker();
        } catch (e) {
          input.focus();
          input.click();
        }
      } else {
        input.focus();
        input.click();
      }
    }
  };

  // Calculate Duration
  useEffect(() => {
    const start = new Date(startDate1);
    const end = new Date(endDate1);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    const diffTime = end.getTime() - start.getTime();
    const diffDaysRaw = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const total = diffDaysRaw + (includeEnd ? 1 : 0);

    let workDays = 0;
    let tempDate = new Date(start);
    const actualEnd = new Date(end);
    if (includeEnd) actualEnd.setDate(actualEnd.getDate() + 1);

    while (tempDate < actualEnd) {
      const day = tempDate.getDay();
      if (day !== 0 && day !== 6) { 
        workDays++;
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    const holidayDays = Math.max(0, total - workDays);

    const weeks = Math.floor(total / 7);
    const remainingDaysAfterWeeks = total % 7;
    const months = Math.floor(total / 30);
    const remainingDaysAfterMonths = total % 30;
    const years = (total / 365).toFixed(2);

    const breakdown = `= ${weeks}周 ${remainingDaysAfterWeeks}天 = ${months}个月 ${remainingDaysAfterMonths}天 = ${years}年`;

    setResults1({ total: Math.max(0, total), workDays, holidayDays, breakdown });
  }, [startDate1, endDate1, includeEnd]);

  // Calculate Projection
  useEffect(() => {
    const start = new Date(startDate2);
    if (isNaN(start.getTime())) return;

    const result = new Date(start);
    const offset = direction === 'forward' ? daysOffset : -daysOffset;
    result.setDate(result.getDate() + offset);

    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    setResultDate2(result.toLocaleDateString('zh-CN', options));
  }, [startDate2, daysOffset, direction]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 scroll-smooth custom-scrollbar">
      {/* 顶部日期计算器主体：维持原状，采用居中最大宽度限制 */}
      <div className="max-w-4xl mx-auto space-y-10 mb-16">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-2">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
            <Icon name="CalendarDays" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">日期计算器</h1>
            <p className="text-slate-500 text-sm font-medium">精准计算工期、工作日及日期推算</p>
          </div>
        </div>

        {/* Part 1: 工期计算 */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="flex items-center space-x-2 mb-8 relative z-10">
            <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
            <h2 className="text-lg font-bold text-slate-800">工期计算</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
            <div className="space-y-6">
              <div className="group">
                <label className="block text-sm font-semibold text-slate-500 mb-2 ml-1">开始日期</label>
                <div 
                  className="relative cursor-pointer bg-slate-50 border border-slate-200 rounded-2xl hover:border-blue-400 transition-colors" 
                  onClick={() => openPicker(startRef1)}
                >
                  <input 
                    ref={startRef1}
                    type="date" 
                    value={startDate1}
                    onChange={(e) => setStartDate1(e.target.value)}
                    className="w-full bg-transparent py-3.5 px-4 focus:outline-none text-slate-700 font-medium cursor-pointer"
                  />
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setStartDate1(new Date().toISOString().split('T')[0]); 
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 transition-transform active:scale-95"
                  >
                    今天
                  </button>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-slate-500 mb-2 ml-1">结束日期</label>
                <div 
                  className="relative cursor-pointer bg-slate-50 border border-slate-200 rounded-2xl hover:border-blue-400 transition-colors" 
                  onClick={() => openPicker(endRef1)}
                >
                  <input 
                    ref={endRef1}
                    type="date" 
                    value={endDate1}
                    onChange={(e) => setEndDate1(e.target.value)}
                    className="w-full bg-transparent py-3.5 px-4 focus:outline-none text-slate-700 font-medium cursor-pointer"
                  />
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setEndDate1(new Date().toISOString().split('T')[0]); 
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 transition-transform active:scale-95"
                  >
                    今天
                  </button>
                </div>
              </div>

              <label className="flex items-center space-x-3 cursor-pointer group p-1 w-fit">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={includeEnd}
                    onChange={(e) => setIncludeEnd(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform shadow-sm"></div>
                </div>
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">包含结束当天日期</span>
              </label>
            </div>

            <div className="bg-slate-50/80 rounded-[28px] p-8 space-y-6 border border-slate-100 backdrop-blur-sm">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">总工期结果</label>
                <div className="flex items-baseline space-x-2">
                  <span className="text-6xl font-black text-blue-600 tracking-tight">{results1.total}</span>
                  <span className="text-slate-400 font-bold text-xl">天</span>
                </div>
                <p className="text-[12px] text-slate-500 mt-6 font-bold bg-white/80 p-4 rounded-xl border border-slate-100 inline-block shadow-sm">{results1.breakdown}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200/60">
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">工作日</label>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-black text-slate-800">{results1.workDays}</span>
                    <span className="text-sm text-slate-500 font-medium">天</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-wider">节假日/周末</label>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-black text-slate-800">{results1.holidayDays}</span>
                    <span className="text-sm text-slate-500 font-medium">天</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Part 2: 日期推算 */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 relative">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-slate-800">日期推算</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
             <div className="space-y-6">
              <div className="group">
                <label className="block text-sm font-semibold text-slate-500 mb-2 ml-1">开始日期</label>
                <div 
                  className="relative cursor-pointer bg-slate-50 border border-slate-200 rounded-2xl hover:border-emerald-400 transition-colors" 
                  onClick={() => openPicker(startRef2)}
                >
                  <input 
                    ref={startRef2}
                    type="date" 
                    value={startDate2}
                    onChange={(e) => setStartDate2(e.target.value)}
                    className="w-full bg-transparent py-3.5 px-4 focus:outline-none text-slate-700 font-medium cursor-pointer"
                  />
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setStartDate2(new Date().toISOString().split('T')[0]); 
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100 transition-transform active:scale-95"
                  >
                    今天
                  </button>
                </div>
              </div>

              <div className="flex items-end space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-500 mb-2 ml-1">推算天数</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={daysOffset}
                      onChange={(e) => setDaysOffset(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-700 font-black text-lg"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">天</span>
                  </div>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0">
                  <button 
                    onClick={() => setDirection('backward')}
                    className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${direction === 'backward' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    向前
                  </button>
                  <button 
                    onClick={() => setDirection('forward')}
                    className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${direction === 'forward' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    向后
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/40 rounded-[28px] p-8 flex flex-col items-center justify-center text-center border border-emerald-100/50 backdrop-blur-sm">
               <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4">推算结果日期</label>
               <div className="bg-white px-8 py-10 rounded-[24px] shadow-sm border border-emerald-100 w-full group hover:scale-[1.01] transition-all duration-300">
                  <div className="text-2xl md:text-3xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors">
                    {resultDate2}
                  </div>
               </div>
               <button className="mt-8 text-emerald-600 text-sm font-black flex items-center hover:text-emerald-700 group/link transition-colors">
                 查看 {new Date(resultDate2).getFullYear() || new Date().getFullYear()}年 日历表 
                 <Icon name="Calendar" size={16} className="ml-2 group-hover/link:translate-x-0.5 transition-transform" />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* 热门工具推荐区域：通栏展示，与首页规范保持一致 */}
      <div className="w-full">
        <section className="pt-10 pb-16 border-t border-slate-200/60 px-2">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">热门推荐</h2>
            </div>
            <button className="text-xs text-blue-600 font-bold hover:text-blue-800 flex items-center transition-colors outline-none">
               查看全部 <Icon name="ChevronRight" size={14} className="ml-1" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
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

export default DateCalculatorView;
