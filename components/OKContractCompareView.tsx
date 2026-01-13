
import React, { useState, useEffect } from 'react';
import Icon from './Icon';

interface DiffItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  contractPrice: number;
  auditPrice: number;
  diffRate: string;
}

const MOCK_DIFFS: DiffItem[] = [
  { id: '1', code: '010101001001', name: '平整场地', unit: 'm2', contractPrice: 2.5, auditPrice: 3.2, diffRate: '+28%' },
  { id: '2', code: '010101002001', name: '挖一般土方', unit: 'm3', contractPrice: 15.8, auditPrice: 14.5, diffRate: '-8.2%' },
  { id: '3', code: '010501001001', name: '矩形柱', unit: 'm3', contractPrice: 450, auditPrice: 480, diffRate: '+6.6%' },
  { id: '4', code: '010515001001', name: '现浇混凝土墙', unit: 'm3', contractPrice: 520, auditPrice: 515, diffRate: '-0.9%' },
];

const OKContractCompareView: React.FC = () => {
  const [file1, setFile1] = useState<string | null>(null);
  const [file2, setFile2] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showCoinAnim, setShowCoinAnim] = useState(false);
  const [lockedId, setLockedId] = useState<string | null>(null);

  const handleCompare = () => {
    if (!file1 || !file2) return;
    setIsComparing(true);
    setTimeout(() => {
      setIsComparing(false);
      setShowResults(true);
      setShowCoinAnim(true);
      // 3秒后关闭金币动画
      setTimeout(() => setShowCoinAnim(false), 3000);
    }, 2000);
  };

  const handleLockPosition = (id: string) => {
    setLockedId(id);
    setTimeout(() => setLockedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden relative">
      {/* 金币入库动态画面 */}
      {showCoinAnim && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md rounded-[40px] p-10 shadow-2xl border border-yellow-200 flex flex-col items-center animate-in zoom-in-75 duration-300">
            <div className="relative">
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-yellow-500/50">
                <Icon name="Coins" size={40} className="text-white" />
              </div>
              <div className="absolute -top-4 -right-4 bg-red-500 text-white text-xl font-black px-3 py-1 rounded-full animate-ping">
                +3
              </div>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mt-6">对比完成！</h3>
            <p className="text-slate-500 font-bold">获取 3 金币已入库</p>
          </div>
        </div>
      )}

      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
            <Icon name="FileDiff" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-red-600 tracking-tight">AI合同价对比</h1>
            <p className="text-slate-500 text-sm font-medium">相同清单/定额不同单价对比提醒</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors flex items-center">
            <Icon name="FileUp" size={18} className="mr-2" /> 导入文件
          </button>
          <button className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
            价格对比
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 对比记录栏 (左侧) */}
        <div className="w-64 border-r border-slate-200 bg-white p-4 flex flex-col shrink-0">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">对比记录栏</div>
          <div className="space-y-2 overflow-y-auto">
            {['记录1: 某综合楼工程', '记录2: 住宅楼A1区', '记录3: 市政管网一期'].map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50 cursor-pointer transition-all group">
                <div className="text-sm font-bold text-slate-700 group-hover:text-blue-600">{item}</div>
                <div className="text-[10px] text-slate-400 mt-1">2024-05-20 14:30</div>
              </div>
            ))}
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* 第一步：输入 */}
          <section className="space-y-6">
            <div className="flex items-center space-x-3">
              <span className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase">第一步</span>
              <h2 className="text-xl font-black text-slate-800">输入</h2>
            </div>

            <div className="flex items-stretch space-x-6">
              {/* 合同价卡片 */}
              <div className="flex-1 bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Icon name="FileText" size={32} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg">合同价</h3>
                  <p className="text-slate-400 text-sm">（原始文件）</p>
                </div>
                <button 
                  onClick={() => setFile1("合同价_2024.xlsx")}
                  className={`w-full py-4 rounded-2xl font-bold transition-all ${file1 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                  {file1 ? `已导入: ${file1}` : '导入按钮'}
                </button>
              </div>

              {/* 送审价卡片 */}
              <div className="flex-1 bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                  <Icon name="FileSearch" size={32} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-lg">送审价</h3>
                  <p className="text-slate-400 text-sm">（被审文件）</p>
                </div>
                <button 
                  onClick={() => setFile2("送审价_V2.xlsx")}
                  className={`w-full py-4 rounded-2xl font-bold transition-all ${file2 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                >
                  {file2 ? `已导入: ${file2}` : '导入按钮'}
                </button>
              </div>

              {/* 对比按钮 */}
              <div className="flex items-center">
                <button 
                  onClick={handleCompare}
                  disabled={!file1 || !file2 || isComparing}
                  className="w-32 h-32 bg-yellow-400 rounded-full flex flex-col items-center justify-center text-slate-900 font-black text-xl shadow-2xl shadow-yellow-500/30 hover:bg-yellow-300 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
                >
                  {isComparing ? (
                    <Icon name="Loader2" size={32} className="animate-spin" />
                  ) : (
                    <>
                      <Icon name="RefreshCcw" size={32} className="mb-2 group-hover:rotate-180 transition-transform duration-500" />
                      对比
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* 第二步：输出 */}
          {showResults && (
            <section className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
              <div className="flex items-center space-x-3">
                <span className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase">第二步</span>
                <h2 className="text-xl font-black text-slate-800">输出</h2>
              </div>

              <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-black text-slate-800">两版文件差异对比展示</h3>
                  <span className="text-xs font-bold text-slate-400 italic">差异栏</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-20">序号</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">项目编码</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">项目名称</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">合同单价</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">送审单价</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">偏差率</th>
                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">锁定</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_DIFFS.map((item, idx) => (
                        <tr 
                          key={item.id} 
                          className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${lockedId === item.id ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''}`}
                        >
                          <td className="px-6 py-4 text-center font-black text-slate-300">{idx + 1}</td>
                          <td className="px-6 py-4 font-medium text-slate-600">{item.code}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                          <td className="px-6 py-4 text-right font-medium text-slate-600">¥{item.contractPrice.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-medium text-slate-800">¥{item.auditPrice.toFixed(2)}</td>
                          <td className={`px-6 py-4 text-right font-black ${item.diffRate.startsWith('+') ? 'text-red-500' : 'text-emerald-500'}`}>
                            {item.diffRate}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => handleLockPosition(item.id)}
                              className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                            >
                              <Icon name="LocateFixed" size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-xs font-bold text-slate-500">功能1: 点击序号锁定差异位置</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-xs font-bold text-slate-500">功能2: 完成获得3金币奖励</span>
                    </div>
                  </div>
                  <button className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">查看完整详细分析报告</button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default OKContractCompareView;
