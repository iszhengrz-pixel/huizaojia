
import React, { useState } from 'react';
import Icon from './Icon';

type FeedbackTab = 'submit' | 'history';
type FeedbackType = 'suggestion' | 'problem';

interface FeedbackRecord {
  id: string;
  time: string;
  type: string;
  category: string;
  content: string;
  hasAttachment: boolean;
  reply: string | null;
}

const MOCK_HISTORY: FeedbackRecord[] = [
  {
    id: '1',
    time: '2024-05-24 14:20',
    type: '问题',
    category: '汇计量 - AI识图算量',
    content: '在识别复杂剪力墙结构时，偶尔会出现构件漏识的情况，希望能进一步提升精度。',
    hasAttachment: true,
    reply: '感谢您的反馈！我们的算法团队正在针对复杂墙体模型进行训练优化，预计在下个版本中会有明显改善。'
  },
  {
    id: '2',
    time: '2024-05-23 09:15',
    type: '建议新功能',
    category: '-',
    content: '希望能增加一个“批量导出所有项目对比报告”的功能，现在只能一个一个导。',
    hasAttachment: false,
    reply: '非常好的建议！该功能已加入排期，预计将在下周上线。'
  },
  {
    id: '3',
    time: '2024-05-20 16:40',
    type: '问题',
    category: '系统设置 - 个人中心',
    content: '更换绑定手机号时，验证码接收稍微有些慢，等了快 1 分钟。',
    hasAttachment: false,
    reply: null
  }
];

interface FeedbackViewProps {
  onOpenContact?: () => void;
}

const FeedbackView: React.FC<FeedbackViewProps> = ({ onOpenContact }) => {
  const [activeTab, setActiveTab] = useState<FeedbackTab>('submit');
  const [type, setType] = useState<FeedbackType>('problem');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<string[]>([]);

  const handleSubmit = () => {
    if (type === 'problem' && !category) return alert('请选择反馈分类');
    if (!content.trim()) return alert('请填写反馈内容');
    alert('提交成功！感谢您的反馈。');
    // 重置表单
    setCategory('');
    setContent('');
    setFiles([]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden animate-in fade-in duration-500">
      {/* 顶部导航 Tabs - 居中处理 */}
      <div className="bg-white border-b border-slate-100 px-8 flex items-center relative shrink-0 h-14">
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center h-full space-x-10">
          <button 
            onClick={() => setActiveTab('submit')}
            className={`relative h-full flex items-center text-[15px] font-bold transition-all ${activeTab === 'submit' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            我要反馈
            {activeTab === 'submit' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`relative h-full flex items-center text-[15px] font-bold transition-all ${activeTab === 'history' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            反馈历史
            {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"></div>}
          </button>
        </div>
        
        <button 
          onClick={onOpenContact}
          className="ml-auto flex items-center space-x-2 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-all group"
        >
          <span>加群反馈</span>
          <Icon name="QrCode" size={16} className="text-slate-500 group-hover:text-blue-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className={`max-w-7xl mx-auto p-8 ${activeTab === 'submit' ? 'max-w-4xl' : ''}`}>
          {activeTab === 'submit' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-500">
              <div className="p-8 md:p-12 space-y-10">
                <h2 className="text-2xl font-black text-slate-800 mb-8">问题反馈</h2>

                {/* 反馈类型 - 问题在前，建议新功能在后 */}
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-600">反馈类型</label>
                  <div className="flex items-center space-x-8">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <div 
                        onClick={() => setType('problem')}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${type === 'problem' ? 'border-blue-500' : 'border-slate-300 group-hover:border-blue-300'}`}
                      >
                        {type === 'problem' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                      </div>
                      <span className={`text-[15px] font-medium ${type === 'problem' ? 'text-slate-800' : 'text-slate-500'}`}>问题</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <div 
                        onClick={() => setType('suggestion')}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${type === 'suggestion' ? 'border-blue-500' : 'border-slate-300 group-hover:border-blue-300'}`}
                      >
                        {type === 'suggestion' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                      </div>
                      <span className={`text-[15px] font-medium ${type === 'suggestion' ? 'text-slate-800' : 'text-slate-500'}`}>建议新功能</span>
                    </label>
                  </div>
                </div>

                {/* 反馈分类 - 仅在类型为“问题”时显示，移除了一级分类分组 */}
                {type === 'problem' && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-300">
                    <label className="text-sm font-bold text-slate-600">
                      <span className="text-rose-500 mr-1">*</span>反馈分类
                    </label>
                    <div className="relative group">
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 appearance-none outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm font-medium text-slate-700"
                      >
                        <option value="" disabled>请选择功能模块</option>
                        <option value="首页">首页</option>
                        
                        {/* 汇计量 */}
                        <option value="汇计量 - AI识图算量">AI识图算量</option>
                        <option value="汇计量 - AI批量提取CAD表">AI批量提取CAD表</option>
                        <option value="汇计量 - 家装计算器">家装计算器</option>
                        <option value="汇计量 - 清单工程量对比">清单工程量对比</option>
                        <option value="汇计量 - 公式大全">公式大全</option>
                        <option value="汇计量 - 五金计算器">五金计算器</option>

                        {/* 汇计价 */}
                        <option value="汇计价 - 材料调差">材料调差</option>
                        <option value="汇计价 - 收费标准库">收费标准库</option>
                        <option value="汇计价 - AI苗木清单">AI苗木清单</option>
                        <option value="汇计价 - 合同价对比">合同价对比</option>
                        <option value="汇计价 - 1V1文件对比">1V1文件对比</option>
                        <option value="汇计价 - 计价文件对比">计价文件对比</option>
                        <option value="汇计价 - 计价分析报告">计价分析报告</option>

                        {/* 汇通用 */}
                        <option value="汇通用 - 日期计算器">日期计算器</option>
                        <option value="汇通用 - 工期定额">工期定额</option>
                        <option value="汇通用 - 收费计算器">收费计算器</option>
                        <option value="汇通用 - 智能CAD">智能CAD</option>
                        <option value="汇通用 - 金额大写转换">金额大写转换</option>
                        <option value="汇通用 - 税费计算">税费计算</option>

                        {/* 汇文库 */}
                        <option value="汇文库 - 清单文库">清单文库</option>
                        <option value="汇文库 - 定额文库">定额文库</option>
                        <option value="汇文库 - 真题文库">真题文库</option>

                        {/* 系统设置 */}
                        <option value="系统设置 - 个人中心">个人中心</option>
                        <option value="系统设置 - 用户管理">用户管理</option>
                        <option value="系统设置 - 角色管理">角色管理</option>
                        <option value="系统设置 - 我的积分">我的积分</option>
                      </select>
                      <Icon name="ChevronDown" size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                    </div>
                  </div>
                )}

                {/* 反馈内容 */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-600">
                    <span className="text-rose-500 mr-1">*</span>反馈内容
                  </label>
                  <div className="relative">
                    <textarea 
                      value={content}
                      onChange={(e) => setContent(e.target.value.slice(0, 500))}
                      placeholder={type === 'suggestion' ? "请详细描述您的功能建议，我们会认真评估。" : "请准确描述您遇到的问题或需求，方便我们快速了解，并为您提供帮助。"}
                      className="w-full h-48 bg-white border border-slate-200 rounded-xl p-5 text-sm font-medium outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none leading-relaxed"
                    />
                    <div className="absolute bottom-4 right-4 text-xs font-bold text-slate-300">
                      {content.length}/500
                    </div>
                  </div>
                </div>

                {/* 添加附件 */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-600">添加附件</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <div className="aspect-square border-2 border-dashed border-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-300 hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group">
                      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                        <Icon name="Plus" size={24} />
                      </div>
                      <span className="text-[11px] font-bold">截图、视频或附件</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 font-medium">最多只支持上传 6 张图片或视频</p>
                </div>

                {/* 提交按钮 */}
                <div className="pt-10">
                  <button 
                    onClick={handleSubmit}
                    className="w-full h-14 bg-blue-600 text-white rounded-xl font-black text-base shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all outline-none"
                  >
                    提 交
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">反馈时间</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">反馈类型</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">反馈分类</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">反馈内容</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">附件</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">官方回复</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {MOCK_HISTORY.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">
                          {item.time || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${item.type === '问题' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                            {item.type || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                          {item.category || '-'}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-700 font-medium line-clamp-2 max-w-md leading-relaxed">
                            {item.content || '-'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.hasAttachment ? (
                            <button className="text-blue-500 hover:text-blue-600 transition-colors" title="查看附件">
                              <Icon name="Paperclip" size={16} />
                            </button>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-xs p-3 rounded-xl max-w-xs ${item.reply ? 'bg-blue-50 text-blue-700 font-medium leading-relaxed' : 'text-slate-300 italic'}`}>
                            {item.reply || '正在处理中，请耐心等待...'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {MOCK_HISTORY.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                  <Icon name="Inbox" size={64} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="text-sm font-bold tracking-tight">暂无反馈记录</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackView;
