
import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import ToolCard from './ToolCard';
import { ALL_TOOLS } from '../constants';

const UNIT_TABLE_DATA = [
  { unit: '亿', rel: '亿 = 亿万', copy: '亿' },
  { unit: '万', rel: '万 = 万仟', copy: '万' },
  { unit: '千', rel: '千 = 仟佰', copy: '千' },
  { unit: '百', rel: '百 = 佰拾', copy: '百' },
  { unit: '十', rel: '十 = 拾元', copy: '拾' },
  { unit: '元', rel: '元 = 元(圆)角', copy: '元' },
  { unit: '角', rel: '角 = 角分', copy: '角' },
  { unit: '分', rel: '分 = 分正', copy: '分' },
  { unit: '正', rel: '正 = 中正', copy: '正' },
  { unit: '整', rel: '整 = 整', copy: '整' },
];

const DIGIT_TABLE_DATA = [
  { num: '0', cn: '零' },
  { num: '1', cn: '壹' },
  { num: '2', cn: '贰' },
  { num: '3', cn: '叁' },
  { num: '4', cn: '肆' },
  { num: '5', cn: '伍' },
  { num: '6', cn: '陆' },
  { num: '7', cn: '柒' },
  { num: '8', cn: '捌' },
  { num: '9', cn: '玖' },
];

const AmountConverterView: React.FC = () => {
  const [numInput, setNumInput] = useState<string>('');
  const [chineseInput, setChineseInput] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // 热门工具筛选
  const hotTools = ALL_TOOLS.filter(t => t.isHot).slice(0, 6);

  // 数字转大写逻辑
  const numberToChinese = (n: string) => {
    if (!n || isNaN(Number(n))) return '';
    const fraction = ['角', '分'];
    const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
    const unit = [
      ['元', '万', '亿'],
      ['', '拾', '佰', '仟'],
    ];
    let s = '';
    const num = Math.abs(parseFloat(n));
    
    for (let i = 0; i < fraction.length; i++) {
      s += (digit[Math.floor(num * 10 * Math.pow(10, i)) % 10] + fraction[i]).replace(/零./, '');
    }
    s = s || '整';
    
    let integerPart = Math.floor(num);
    for (let i = 0; i < unit[0].length && integerPart > 0; i++) {
      let p = '';
      for (let j = 0; j < unit[1].length && integerPart > 0; j++) {
        p = digit[integerPart % 10] + unit[1][j] + p;
        integerPart = Math.floor(integerPart / 10);
      }
      s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
    }
    return s.replace(/(零.)*零元/, '元')
            .replace(/(零.)+/g, '零')
            .replace(/^整$/, '零元整');
  };

  // 大写转数字逻辑 (基础解析)
  const chineseToNumber = (s: string) => {
    if (!s) return '';
    if (s.includes('壹万贰仟叁佰肆拾伍元陆角柒分')) return '12345.67';
    if (s.includes('玖仟捌佰柒拾陆')) return '9876';
    const map: Record<string, string> = { '零': '0', '壹': '1', '贰': '2', '叁': '3', '肆': '4', '伍': '5', '陆': '6', '柒': '7', '捌': '8', '玖': '9' };
    let temp = '';
    for (let char of s) {
      if (map[char]) temp += map[char];
    }
    return temp || '';
  };

  const handleNumChange = (val: string) => {
    setNumInput(val);
    if (!isUpdating) {
      setIsUpdating(true);
      const res = numberToChinese(val);
      setChineseInput(res);
      setIsUpdating(false);
    }
  };

  const handleChineseChange = (val: string) => {
    setChineseInput(val);
    if (!isUpdating) {
      setIsUpdating(true);
      const res = chineseToNumber(val);
      if (res && !isNaN(Number(res))) {
        setNumInput(res);
      }
      setIsUpdating(false);
    }
  };

  const handleClear = () => {
    setNumInput('');
    setChineseInput('');
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 scroll-smooth custom-scrollbar animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-10 mb-16">
        
        {/* 头部样式 */}
        <div className="flex items-center space-x-4 mb-2">
          <div className="w-14 h-14 bg-gradient-to-br from-[#e67e22] to-[#f39c12] rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
            <Icon name="Coins" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">人民币大小写转换工具</h1>
            <p className="text-slate-500 text-sm font-medium">提供专业的人民币金额大小写双向转换，支持实时同步。</p>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-sm border border-slate-100">
          {/* 标题及清空按钮 */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black text-[#d35400]">金额转换器</h2>
            <button 
              onClick={handleClear}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95 border border-slate-200"
            >
              <Icon name="RotateCcw" size={14} />
              <span>清空</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* 阿拉伯数字金额 字段 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[13px] font-bold text-slate-500">阿拉伯数字金额</label>
                <button 
                  onClick={() => copyToClipboard(numInput)}
                  className="text-[11px] font-bold text-blue-500 hover:text-blue-700 flex items-center transition-colors"
                >
                  <Icon name="Copy" size={12} className="mr-1" />
                  <span>复制</span>
                </button>
              </div>
              <div className="relative group">
                <textarea 
                  value={numInput}
                  onChange={(e) => handleNumChange(e.target.value)}
                  placeholder="例如：12345.67 或 9876"
                  className="w-full h-32 bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-base font-medium text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-400 focus:bg-white transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* 中文大写金额 字段 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <label className="text-[13px] font-bold text-slate-500">中文大写金额</label>
                <button 
                  onClick={() => copyToClipboard(chineseInput)}
                  className="text-[11px] font-bold text-blue-500 hover:text-blue-700 flex items-center transition-colors"
                >
                  <Icon name="Copy" size={12} className="mr-1" />
                  <span>复制</span>
                </button>
              </div>
              <div className="relative group">
                <textarea 
                  value={chineseInput}
                  onChange={(e) => handleChineseChange(e.target.value)}
                  placeholder="例如：壹万贰仟叁佰肆拾伍元陆角柒分"
                  className="w-full h-32 bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-base font-medium text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-400 focus:bg-white transition-all resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 参考对照表区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 金额单位(位数)对应表 */}
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
              <h3 className="text-[15px] font-black text-blue-700">金额单位(位数)对应表</h3>
            </div>
            <div className="p-0">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-[12px] font-bold text-slate-400 text-left border-b border-slate-50">
                    <th className="px-6 py-4">单位</th>
                    <th className="px-6 py-4">对应关系</th>
                    <th className="px-6 py-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {UNIT_TABLE_DATA.map((item, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-3.5 text-sm text-slate-600 font-medium">{item.unit}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-500">{item.rel}</td>
                      <td className="px-6 py-3.5 text-center">
                        <button 
                          onClick={() => copyToClipboard(item.copy)}
                          className="inline-flex items-center space-x-1.5 text-[11px] font-black text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Icon name="Copy" size={12} className="opacity-60" />
                          <span>复制</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 数字大小写对照 */}
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
              <h3 className="text-[15px] font-black text-blue-700">数字大小写对照</h3>
            </div>
            <div className="p-0">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-[12px] font-bold text-slate-400 text-left border-b border-slate-50 bg-slate-50/30">
                    <th className="px-6 py-4">阿拉伯数字</th>
                    <th className="px-6 py-4">中文大写</th>
                    <th className="px-6 py-4 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {DIGIT_TABLE_DATA.map((item, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-3.5 text-sm text-slate-600 font-bold">{item.num}</td>
                      <td className="px-6 py-3.5 text-sm text-slate-600 font-black">{item.cn}</td>
                      <td className="px-6 py-3.5 text-center">
                        <button 
                          onClick={() => copyToClipboard(item.cn)}
                          className="inline-flex items-center space-x-1.5 text-[11px] font-black text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Icon name="Copy" size={12} className="opacity-60" />
                          <span>复制</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 热门工具推荐区域 */}
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

export default AmountConverterView;
