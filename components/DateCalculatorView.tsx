
import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';

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
      // Cast to any to prevent narrowing issues that lead to 'never' type in the fallback logic.
      const input = el as any;
      // Use modern showPicker API if available, fallback to focus/click
      if (typeof input.showPicker === 'function') {
        try {
          input.showPicker();
        } catch (e) {
          // If showPicker fails (e.g., due to user interaction rules), fallback to focus/click.
          input.focus();
          input.click();
        }
      } else {
        // Explicitly use focus and click for browsers that don't support showPicker.
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
      if (day !== 0 && day !== 6) { // 0 is Sunday, 6 is Saturday
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
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Icon name="CalendarDays" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">日期计算器</h1>
            <p className="text-slate-500 text-sm">精准计算工期、工作日及日期推算</p>
          </div>
        </div>

        {/* Part 1: 工期计算 */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
            <h2 className="text-lg font-bold text-slate-800">工期计算</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Column */}
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
                    className="w-full bg-transparent py-3 px-4 focus:outline-none text-slate-700 font-medium cursor-pointer"
                  />
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setStartDate1(new Date().toISOString().split('T')[0]); 
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100"
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
                    className="w-full bg-transparent py-3 px-4 focus:outline-none text-slate-700 font-medium cursor-pointer"
                  />
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setEndDate1(new Date().toISOString().split('T')[0]); 
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100"
                  >
                    今天
                  </button>
                </div>
              </div>

              <label className="flex items-center space-x-3 cursor-pointer group p-1">
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

            {/* Output Column */}
            <div className="bg-slate-50 rounded-3xl p-6 space-y-5 border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">总工期</label>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-blue-600">{results1.total}</span>
                  <span className="text-slate-500 font-bold">天</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium bg-white/50 p-2 rounded-lg border border-slate-100 inline-block">{results1.breakdown}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/50">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">工作日</label>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xl font-bold text-slate-800">{results1.workDays}</span>
                    <span className="text-xs text-slate-500">天</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">周末及节假日</label>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xl font-bold text-slate-800">{results1.holidayDays}</span>
                    <span className="text-xs text-slate-500">天</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic">* 法定节假日计算采用通用周末休假标准，实际调休请参考具体年度政策。</p>
            </div>
          </div>
        </div>

        {/* Part 2: 日期推算 */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
            <h2 className="text-lg font-bold text-slate-800">日期推算</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                    className="w-full bg-transparent py-3 px-4 focus:outline-none text-slate-700 font-medium cursor-pointer"
                  />
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setStartDate2(new Date().toISOString().split('T')[0]); 
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-white px-3 py-1.5 rounded-xl shadow-sm border border-slate-100"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-700 font-bold"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">天</span>
                  </div>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                  <button 
                    onClick={() => setDirection('backward')}
                    className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${direction === 'backward' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    向前
                  </button>
                  <button 
                    onClick={() => setDirection('forward')}
                    className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${direction === 'forward' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    向后
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center border border-emerald-100/50">
               <label className="block text-xs font-bold text-emerald-500 uppercase tracking-widest mb-4">推算结果日期</label>
               <div className="bg-white px-6 py-6 rounded-[24px] shadow-sm border border-emerald-100 w-full group hover:scale-[1.02] transition-transform">
                  <div className="text-xl md:text-2xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors">
                    {resultDate2}
                  </div>
               </div>
               <button className="mt-6 text-emerald-600 text-sm font-bold flex items-center hover:underline">
                 查看 {new Date(resultDate2).getFullYear() || new Date().getFullYear()}年 日历表 <Icon name="Calendar" size={14} className="ml-1" />
               </button>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-slate-900 rounded-[32px] p-6 text-white flex items-center justify-between shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Icon name="Lightbulb" size={24} className="text-amber-400" />
            </div>
            <div>
              <h4 className="font-bold">专业造价工期建议</h4>
              <p className="text-slate-400 text-xs">基于《工程工期定额》智能推荐标准工期</p>
            </div>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors">
            立即查看
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateCalculatorView;
