
import React, { useState } from 'react';
import Icon from './Icon';

interface PointRecord {
  id: string;
  action: string;
  change: number;
  time: string;
  type: 'earn' | 'spend';
}

const MOCK_RECORDS: PointRecord[] = [
  { id: '1', action: '每日签到奖励', change: 5, time: '2024-05-24 09:12:00', type: 'earn' },
  { id: '2', action: '兑换【AI识图算量】单次额度', change: -50, time: '2024-05-23 14:30:15', type: 'spend' },
  { id: '3', action: '分享工具【家装计算器】', change: 10, time: '2024-05-22 18:20:00', type: 'earn' },
  { id: '4', action: '完成实名认证', change: 100, time: '2024-05-20 10:05:30', type: 'earn' },
  { id: '5', action: '注册成功奖励', change: 50, time: '2024-05-20 09:00:00', type: 'earn' },
];

const POINTS_TASKS = [
  { id: 't1', name: '每日签到', reward: '+5 积分', icon: 'CalendarCheck', type: 'daily' },
  { id: 't2', name: '邀请好友注册', reward: '+50 积分', icon: 'UserPlus', type: 'once' },
  { id: 't3', name: '完成专业认证', reward: '+200 积分', icon: 'ShieldCheck', type: 'once' },
  { id: 't4', name: '分享计算报告', reward: '+10 积分', icon: 'Share2', type: 'daily' },
];

const PointsView: React.FC = () => {
  const [totalPoints, setTotalPoints] = useState(115);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [hasSignedIn, setHasSignedIn] = useState(false);
  const [records, setRecords] = useState<PointRecord[]>(MOCK_RECORDS);

  const handleSignIn = () => {
    if (hasSignedIn) return;
    setHasSignedIn(true);
    setTotalPoints(prev => prev + 5);
    const newRecord: PointRecord = {
      id: Date.now().toString(),
      action: '每日签到奖励',
      change: 5,
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
      type: 'earn'
    };
    setRecords(prev => [newRecord, ...prev]);
    alert('签到成功，获得 5 积分！');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden animate-in fade-in duration-500">
      {/* 顶部页头 */}
      <div className="bg-white border-b border-slate-100 px-8 py-5 shrink-0 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
            <Icon name="CircleDollarSign" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">我的积分</h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Points Management Center</p>
          </div>
        </div>
        <button 
          onClick={() => setIsRuleModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-all outline-none border border-slate-200"
        >
          <Icon name="HelpCircle" size={14} />
          <span>规则说明</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
          
          {/* 积分概览卡片 */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-[40px] p-10 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full blur-[80px] -ml-24 -mb-24"></div>
            
            <div className="relative z-10 space-y-4 text-center md:text-left">
              <p className="text-blue-100 text-[12px] font-black uppercase tracking-[0.3em] opacity-80">当前可用总积分</p>
              <div className="flex items-baseline justify-center md:justify-start space-x-3">
                <span className="text-7xl font-black tracking-tighter drop-shadow-lg">{totalPoints}</span>
                <span className="text-xl font-bold opacity-60">Points</span>
              </div>
              <div className="flex items-center justify-center md:justify-start space-x-2 text-blue-100/70 text-xs font-bold">
                <Icon name="Clock" size={14} />
                <span>积分长期有效，快去兑换权益吧</span>
              </div>
            </div>

            <div className="relative z-10 mt-8 md:mt-0 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleSignIn}
                disabled={hasSignedIn}
                className={`px-10 py-4 rounded-2xl font-black text-sm shadow-xl transition-all outline-none active:scale-95 flex items-center justify-center space-x-2 ${
                  hasSignedIn 
                  ? 'bg-white/20 text-white border border-white/30 cursor-not-allowed' 
                  : 'bg-white text-blue-600 hover:scale-105'
                }`}
              >
                <Icon name={hasSignedIn ? "Check" : "CalendarCheck"} size={18} />
                <span>{hasSignedIn ? '今日已签到' : '每日签到 +5'}</span>
              </button>
              <button className="px-10 py-4 bg-white/20 text-white border border-white/30 backdrop-blur-md rounded-2xl font-black text-sm hover:bg-white/30 active:scale-95 transition-all outline-none flex items-center justify-center space-x-2">
                <Icon name="ShoppingBag" size={18} />
                <span>积分商城</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* 赚取积分区 */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-3">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">赚取积分</h2>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasks</span>
              </div>
              
              <div className="space-y-4">
                {POINTS_TASKS.map(task => (
                  <div key={task.id} className="bg-white border border-slate-100 rounded-[28px] p-5 flex items-center justify-between group hover:shadow-xl hover:border-blue-200 transition-all shadow-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                        <Icon name={task.icon} size={24} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-black text-slate-700">{task.name}</h4>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${task.type === 'daily' ? 'bg-blue-50 text-blue-500' : 'bg-purple-50 text-purple-500'}`}>
                            {task.type === 'daily' ? '每日' : '一次'}
                          </span>
                        </div>
                        <span className="text-[12px] font-black text-blue-500 mt-0.5 inline-block">{task.reward}</span>
                      </div>
                    </div>
                    {task.id === 't1' && hasSignedIn ? (
                      <div className="flex items-center text-emerald-500 bg-emerald-50 px-4 py-2 rounded-xl text-[11px] font-black border border-emerald-100 uppercase tracking-widest">
                        已完成
                      </div>
                    ) : (
                      <button 
                        onClick={task.id === 't1' ? handleSignIn : undefined}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[11px] font-black hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/10"
                      >
                        去完成
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 收支明细区 */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-3">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                  <h2 className="text-lg font-black text-slate-800 tracking-tight">收支明细</h2>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Records</span>
              </div>
              
              <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-50/50">
                      <tr className="border-b border-slate-50">
                        <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">记录明细</th>
                        <th className="px-6 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">变动</th>
                        <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {records.map(record => (
                        <tr key={record.id} className="hover:bg-blue-50/20 transition-all group">
                          <td className="px-8 py-5">
                            <div className="flex items-center space-x-4">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${record.type === 'earn' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                <Icon name={record.type === 'earn' ? 'TrendingUp' : 'TrendingDown'} size={16} />
                              </div>
                              <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{record.action}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className={`text-sm font-black ${record.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {record.type === 'earn' ? '+' : ''}{record.change}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right text-xs text-slate-400 font-bold group-hover:text-slate-600 transition-colors">
                            {record.time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center">
                   <button className="text-[10px] font-black text-slate-400 hover:text-blue-600 transition-all uppercase tracking-[0.2em] flex items-center space-x-2 outline-none">
                     <span>查看更多历史记录</span>
                     <Icon name="ChevronDown" size={12} />
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 规则说明弹窗 */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-xl flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200 overflow-hidden">
              <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                 <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center">
                       <Icon name="HelpCircle" size={18} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800">积分规则说明</h3>
                 </div>
                 <button onClick={() => setIsRuleModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors">
                    <Icon name="X" size={24} />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar text-sm text-slate-600 leading-loose">
                 <section className="space-y-4">
                    <h4 className="font-black text-slate-800 text-base flex items-center">
                      <div className="w-1.5 h-4 bg-blue-500 rounded-full mr-2"></div>
                      1. 积分的获取
                    </h4>
                    <ul className="space-y-2 pl-4 list-disc marker:text-blue-400">
                      <li><strong>每日签到：</strong>每日首次点击可获得 5 积分。</li>
                      <li><strong>完善资料：</strong>首次完成实名认证可获得 100 积分奖励。</li>
                      <li><strong>工具分享：</strong>成功分享计算报告或算量清单给他人，获得 10 积分。</li>
                      <li><strong>邀请同行：</strong>每邀请一位新用户注册成功，双方均获 50 积分。</li>
                    </ul>
                 </section>
                 <section className="space-y-4">
                    <h4 className="font-black text-slate-800 text-base flex items-center">
                      <div className="w-1.5 h-4 bg-blue-500 rounded-full mr-2"></div>
                      2. 积分的使用
                    </h4>
                    <p className="pl-4 font-medium">积分可用于在“积分商城”兑换各类虚拟权益，如：全站会员体验卡、AI识图单次包、高级文库下载配额等。</p>
                 </section>
                 <section className="space-y-4">
                    <h4 className="font-black text-slate-800 text-base flex items-center">
                      <div className="w-1.5 h-4 bg-blue-500 rounded-full mr-2"></div>
                      3. 注意事项
                    </h4>
                    <p className="pl-4">正常获取的积分目前长期有效。若通过不正当手段（如脚本刷分）获取积分，平台有权根据用户协议收回积分并视情节严重程度封禁账号。</p>
                 </section>
              </div>
              <div className="px-10 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                 <button onClick={() => setIsRuleModalOpen(false)} className="px-12 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl active:scale-95 outline-none transition-all">我已了解</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PointsView;
