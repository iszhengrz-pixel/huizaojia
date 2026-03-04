import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { ALL_TOOLS_CATEGORIZED, ALL_TOOLS } from '../constants';
import { ToolItem } from '../types';

type TabType = 'value' | 'module';
type SuperMemberType = 'none' | 'quarter' | 'year';

interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  duration: string;
  badge: string;
  badgeColor: string;
  footerText: string;
}

const PAYMENT_PLANS: PaymentPlan[] = [
  { 
    id: 'month', 
    name: '畅享30天', 
    price: 9.9, 
    originalPrice: 14.9,
    duration: '月', 
    badge: '新用户特惠', 
    badgeColor: 'bg-[#ee7e33]',
    footerText: '优惠价 ¥ 0.33/天' 
  },
  { 
    id: 'half-year', 
    name: '半年套餐', 
    price: 49.9, 
    originalPrice: 69.9,
    duration: '半年', 
    badge: '年度畅销', 
    badgeColor: 'bg-[#d8814a]',
    footerText: '折合 ¥ 8.3/月' 
  },
  { 
    id: 'year', 
    name: '年度套餐', 
    price: 89.9, 
    originalPrice: 129.9,
    duration: '1年', 
    badge: '超值推荐', 
    badgeColor: 'bg-[#e49451]',
    footerText: '折合 ¥ 7.5/月' 
  },
];

const MEMBER_PLANS: PaymentPlan[] = [
  { 
    id: 'quarter', 
    name: '季度会员', 
    price: 99, 
    originalPrice: 149,
    duration: '季度', 
    badge: '限时特惠', 
    badgeColor: 'bg-[#ee7e33]',
    footerText: '优惠价 ¥ 1.1/天' 
  },
  { 
    id: 'year', 
    name: '年度会员', 
    price: 299, 
    originalPrice: 399,
    duration: '1年', 
    badge: '超值推荐', 
    badgeColor: 'bg-[#e49451]',
    footerText: '优惠价 ¥ 0.81/天' 
  },
];

interface InvoiceRecord {
  id: string;
  orderNo: string;
  details: string;
  time: string;
  amount: number;
  hasInfo: boolean;
}

interface CustomerMessage {
  id: string;
  role: 'bot' | 'user' | 'system';
  content: string;
  time: string;
}

const INITIAL_INVOICES: InvoiceRecord[] = [
  { id: 'inv1', orderNo: 'ORD202405200001', details: '全站会员-季度套餐', time: '2024-05-20 14:20:30', amount: 99.00, hasInfo: false },
  { id: 'inv2', orderNo: 'ORD202404150023', details: 'AI识图算量-单项开通', time: '2024-04-15 09:12:05', amount: 9.90, hasInfo: true },
  { id: 'inv3', orderNo: 'ORD202403100088', details: '全站会员-年度套餐', time: '2024-03-10 16:45:12', amount: 299.00, hasInfo: false },
];

const ProfileView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('value');
  const [selectedToolToPay, setSelectedToolToPay] = useState<ToolItem | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('month');
  const [selectedMemberPlanId, setSelectedMemberPlanId] = useState<string>('quarter');
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [superMemberType, setSuperMemberType] = useState<SuperMemberType>('none');
  const [isMemberPayModalOpen, setIsMemberPayModalOpen] = useState(false);
  
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES);

  // 填写开票信息相关状态
  const [isFillInvoiceModalOpen, setIsFillInvoiceModalOpen] = useState(false);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    title: '',
    taxId: '',
    email: '',
    address: '',
    phone: '',
    bank: '',
    account: ''
  });

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneCountdown, setPhoneCountdown] = useState(0);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailCountdown, setEmailCountdown] = useState(0);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerInput, setCustomerInput] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [messages, setMessages] = useState<CustomerMessage[]>([
    { id: '1', role: 'bot', content: '您好！我是您的专属 AI 助手。您可以询问我关于会员权益、发票申请、工具使用及造价业务的任何问题。', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [activatedIds, setActivatedIds] = useState<Set<string>>(
    new Set(ALL_TOOLS.filter(t => t.isActivated).map(t => t.id))
  );

  const userId = "211097193";
  const userPhone = "137****406";
  const userEmail = "hzj_admin@163.com";

  const currentPlan = PAYMENT_PLANS.find(p => p.id === selectedPlanId) || PAYMENT_PLANS[0];

  const copyId = () => {
    navigator.clipboard.writeText(userId);
    alert('ID已复制');
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isBotTyping]);

  useEffect(() => {
    let timer: any;
    if (phoneCountdown > 0) timer = setInterval(() => setPhoneCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [phoneCountdown]);

  useEffect(() => {
    let timer: any;
    if (emailCountdown > 0) timer = setInterval(() => setEmailCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [emailCountdown]);

  const handleSendPhoneCode = () => {
    if (!newPhone.trim()) { alert('请输入要更换的手机号'); return; }
    setPhoneCountdown(60);
    alert('验证码已发送');
  };

  const handleSendEmailCode = () => {
    if (!newEmail.trim()) { alert('请输入新邮箱地址'); return; }
    setEmailCountdown(60);
    alert('邮箱验证码已发送');
  };

  const handleConfirmPhone = () => {
    alert('手机更换成功');
    setIsPhoneModalOpen(false);
  };

  const handleConfirmEmail = () => {
    alert('邮箱绑定成功');
    setIsEmailModalOpen(false);
  };

  const handleSendCustomerMessage = (content: string = customerInput) => {
    if (!content.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
    setCustomerInput('');
    setIsBotTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'bot', content: '收到您的咨询，我正在为您核实相关信息。请问还有其他我可以帮到您的吗？', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
      setIsBotTyping(false);
    }, 1500);
  };

  const renderBenefitGroup = (title: string, items: { text: string; sub?: string }[], iconColor: string) => (
    <div className="space-y-4">
      <h5 className="text-[14px] font-black text-slate-900">{title}</h5>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between group">
            <div className="flex items-center space-x-2">
              <Icon name="Check" size={14} className={iconColor} strokeWidth={4} />
              <span className="text-[13px] font-medium text-slate-600">{item.text}</span>
            </div>
            <span className="text-[12px] text-slate-300 font-medium">{item.sub || '不限'}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const getIconColor = (tool: ToolItem) => {
    const colors = ['bg-blue-50 text-blue-600', 'bg-emerald-50 text-emerald-600', 'bg-amber-50 text-amber-600', 'bg-rose-50 text-rose-600', 'bg-indigo-50 text-indigo-600', 'bg-purple-50 text-purple-600'];
    const index = (tool.name.length + (tool.id.length)) % colors.length;
    return colors[index];
  };

  const handleActivateSuperMember = (type: SuperMemberType) => {
    setSuperMemberType(type);
    alert('会员开通成功！');
  };

  const handleConfirmMemberActivation = () => {
    const type = selectedMemberPlanId === 'year' ? 'year' : 'quarter';
    setSuperMemberType(type);
    alert('会员开通成功！');
    setIsMemberPayModalOpen(false);
  };

  const handleOpenMemberPayFromTool = () => {
    setSelectedToolToPay(null);
    setActiveTab('value');
    setSelectedMemberPlanId('year');
    setIsMemberPayModalOpen(true);
  };

  const handleOpenPay = (tool: ToolItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedToolToPay(tool);
    setSelectedPlanId('month'); 
    setPaymentMethod('wechat');
  };

  const handleConfirmToolActivation = () => {
    if (!selectedToolToPay) return;
    const next = new Set(activatedIds);
    next.add(selectedToolToPay.id);
    setActivatedIds(next);
    alert(`${selectedToolToPay.name} 开通成功！`);
    setSelectedToolToPay(null);
  };

  const handleFillInvoiceInfo = (invId: string) => {
    setActiveInvoiceId(invId);
    setInvoiceForm({
      title: '',
      taxId: '',
      email: '',
      address: '',
      phone: '',
      bank: '',
      account: ''
    });
    setIsFillInvoiceModalOpen(true);
  };

  const handleSaveInvoiceInfo = () => {
    if (!invoiceForm.title || !invoiceForm.taxId || !invoiceForm.email) {
      alert('请填写抬头、税号及接收邮箱');
      return;
    }
    setInvoices(prev => prev.map(inv => inv.id === activeInvoiceId ? { ...inv, hasInfo: true } : inv));
    alert('开票信息提交成功');
    setIsFillInvoiceModalOpen(false);
    setActiveInvoiceId(null);
  };

  const handleDownloadInvoice = () => {
    alert('正在下载发票文件...');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7f9] overflow-hidden animate-in fade-in duration-500">
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        <aside className="w-[320px] shrink-0 space-y-4 overflow-y-auto no-scrollbar pb-6 hidden lg:block">
          <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-100">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-slate-50 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-slate-200">
                <Icon name="User" size={40} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-slate-800 truncate">用户名称</h3>
                <div className="flex items-center space-x-1.5 mt-1.5">
                  <span className="text-[11px] text-slate-400 font-bold tracking-tight">个人账号ID: {userId}</span>
                  <button onClick={copyId} className="p-1 text-slate-300 hover:text-blue-500 transition-colors"><Icon name="Copy" size={12} /></button>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#fdf6e9] to-[#faead1] rounded-2xl p-4 flex items-center justify-between border border-[#f5e1c2]">
               <div className="flex flex-col min-w-0 pr-2">
                 <span className="text-[13px] font-black text-[#8a5d13] truncate leading-tight">
                  {superMemberType === 'quarter' ? '艾造价季度会员' : superMemberType === 'year' ? '艾造价年度会员' : '艾造价全站会员'}
                 </span>
                 <span className="text-[10px] font-bold text-[#8a5d13]/70 mt-1 truncate">
                   {superMemberType !== 'none' ? '会员到期时间：2026-12-30' : '专业工具全解锁，畅享专属体验'}
                 </span>
               </div>
               <button onClick={() => { setSelectedMemberPlanId('quarter'); setIsMemberPayModalOpen(true); }} className="bg-[#8a5d13] text-white px-4 py-1.5 rounded-xl text-[10px] font-black hover:bg-[#734b0d] transition-all shadow-sm shrink-0">
                 {superMemberType !== 'none' ? '立即续费' : '立即开通'}
               </button>
            </div>
          </div>
          <div className="bg-white rounded-[28px] shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
             {[
               { id: 'points', label: '我的积分', extra: '共0', icon: 'CircleDollarSign' },
               { id: 'invoice', label: '我的发票', extra: '去申请', icon: 'ReceiptText', onClick: () => setIsInvoiceModalOpen(true) },
               { id: 'payment', label: '支付管理', extra: '支付方式', icon: 'CreditCard' },
               { id: 'phone', label: '绑定手机', extra: userPhone, icon: 'Smartphone', onClick: () => setIsPhoneModalOpen(true) },
               { id: 'email', label: '绑定邮箱', extra: userEmail, icon: 'Mail', onClick: () => setIsEmailModalOpen(true) },
               { id: 'password', label: '修改密码', extra: '修改', icon: 'ShieldEllipsis', onClick: () => setIsPasswordModalOpen(true) },
               { id: 'customer', label: '智能客服', extra: '有问题找我', icon: 'Headset', onClick: () => setIsCustomerModalOpen(true) },
               { id: 'terms', label: '使用条款', extra: '去查看', icon: 'FileText' },
               { id: 'privacy', label: '隐私条款', extra: '去查看', icon: 'Lock' },
             ].map(item => (
               <button key={item.id} onClick={item.onClick} className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center space-x-3">
                    <Icon name={item.icon} size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-[11px] font-medium text-slate-300 truncate max-w-[100px]">{item.extra}</span>
                    <Icon name="ChevronRight" size={14} className="text-slate-200" />
                  </div>
               </button>
             ))}
          </div>
        </aside>

        <main className="flex-1 bg-white rounded-[32px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
           <div className="px-10 border-b border-slate-50 flex items-center space-x-10 shrink-0">
              <button onClick={() => setActiveTab('value')} className={`relative py-5 text-[15px] font-black transition-all ${activeTab === 'value' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                全站会员
                {activeTab === 'value' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
              </button>
              <button onClick={() => setActiveTab('module')} className={`relative py-5 text-[15px] font-black transition-all ${activeTab === 'module' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                专业模块会员
                {activeTab === 'module' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
              </button>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#fdfdfd]">
              {activeTab === 'value' ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start animate-in fade-in duration-300 max-w-6xl mx-auto">
                  <div className="bg-[#FFFCF7] rounded-[40px] border border-[#f5e1c2] p-10 flex flex-col h-full shadow-[0_8px_30px_rgba(138,93,19,0.03)] group transition-all hover:shadow-[0_15px_45px_rgba(138,93,19,0.06)]">
                    <div className="flex flex-col items-center mb-10">
                      <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-400 mb-6 shadow-xl"><Icon name="Zap" size={32} fill="currentColor" /></div>
                      <h4 className="text-xl font-black text-slate-800 mb-2">艾造价季度会员</h4>
                      <p className="text-[12px] text-slate-400 font-bold mb-8">畅享90天全部功能与内容权益</p>
                      <div className="flex flex-col items-center">
                        <div className="flex items-baseline text-[#8a5d13]">
                          <span className="text-sm font-black mr-0.5">¥</span>
                          <span className="text-6xl font-black tracking-tighter">99</span>
                        </div>
                        <span className="text-[12px] text-slate-400 font-bold mt-2">优惠价 ¥ 1.1/天</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => { if(superMemberType !== 'year') { setSelectedMemberPlanId('quarter'); setIsMemberPayModalOpen(true); } }} 
                      className={`w-full py-4 rounded-[20px] font-black text-base transition-all mb-12 shadow-sm ${
                        superMemberType === 'year' 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                        : 'bg-[#ebdcb9] text-[#8a5d13] hover:bg-[#e4d0a3]'
                      }`}
                      disabled={superMemberType === 'year'}
                    >
                      {superMemberType === 'quarter' ? '已开通|2026-12-30 到期' : 
                       superMemberType === 'year' ? '已开通年度大会员' : '立即开通'}
                    </button>
                  </div>

                  <div className="bg-[#f9f5ff] rounded-[40px] border border-[#e9d8ff] p-10 flex flex-col h-full shadow-[0_8px_30px_rgba(109,40,217,0.03)] group transition-all hover:shadow-[0_15px_45px_rgba(109,40,217,0.06)]">
                    <div className="flex flex-col items-center mb-10">
                      <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl"><Icon name="Crown" size={32} fill="currentColor" /></div>
                      <h4 className="text-xl font-black text-slate-800 mb-2">艾造价年度会员</h4>
                      <p className="text-[12px] text-slate-400 font-bold mb-8">畅享全年汇造价平台100+会员工具</p>
                      <div className="flex flex-col items-center">
                        <div className="flex items-baseline text-[#6d28d9]">
                          <span className="text-sm font-black mr-0.5">¥</span>
                          <span className="text-6xl font-black tracking-tighter">299</span>
                        </div>
                        <span className="text-[12px] text-slate-400 font-bold mt-2">优惠价 ¥ 0.81/天</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setSelectedMemberPlanId('year'); setIsMemberPayModalOpen(true); }} 
                      className="w-full py-4 bg-[#e9d8ff] text-[#6d28d9] rounded-[20px] font-black text-base hover:bg-[#deccff] transition-all mb-12 shadow-sm"
                    >
                      {superMemberType === 'year' ? '已开通|到期时间 2026-12-30' : 
                       superMemberType === 'quarter' ? '立即升级' : '立即开通'}
                    </button>
                  </div>
                  <div className="xl:col-span-2 bg-[#F5F7FA] rounded-[32px] p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {renderBenefitGroup('核心业务工具权益', [
                        { text: '汇计量功能全开', sub: '不限' },
                        { text: '汇计价全模块解锁', sub: '不限' },
                        { text: '汇通用畅享海量小工具', sub: '不限' },
                        { text: '汇造价AI功能全开', sub: '畅享' }
                      ], 'text-[#D4A017]')}
                      {renderBenefitGroup('专业计算权益', [
                        { text: '全品类专业建工计算器工具解锁', sub: '不限次使用次数' }
                      ], 'text-[#D4A017]')}
                      {renderBenefitGroup('内容资源权益', [
                        { text: '解锁文库所有真题、清单、定额资源', sub: '畅读' },
                        { text: '1000+专业权威文档免费下载', sub: '畅享' }
                      ], 'text-[#D4A017]')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-12 animate-in fade-in duration-300">
                  {ALL_TOOLS_CATEGORIZED.map((cat) => (
                    <section key={cat.category}>
                      <div className="flex items-center space-x-3 mb-8 border-b border-slate-50 pb-4">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                        <h3 className="text-xl font-black text-slate-800">{cat.category}</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {cat.tools.map((tool) => {
                          const isPaid = tool.pricingType === 'paid';
                          const isActivated = activatedIds.has(tool.id);
                          return (
                            <div key={tool.id} className="bg-white border border-slate-100 rounded-[28px] p-6 flex flex-col hover:shadow-xl transition-all group shadow-sm">
                               <div className="flex items-center space-x-4 mb-6">
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${getIconColor(tool)}`}>
                                    <Icon name={tool.icon} size={28} />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-[15px] font-black text-slate-800 truncate">{tool.name}</h4>
                                    <p className="text-[11px] text-slate-400 font-bold line-clamp-1">{tool.description || '高效造价辅助工具'}</p>
                                  </div>
                               </div>
                               <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
                                  <div>
                                    {!isPaid ? (
                                      <span className="text-[10px] font-black px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg uppercase tracking-wider">Free</span>
                                    ) : (
                                      <div className="px-3 py-1 bg-[#fdf6e9] border border-[#f5e1c2] rounded-lg">
                                        <span className="text-[11px] font-black text-[#8a5d13]">{isActivated ? '到期时间: 2026-05-30' : '9.9元开通'}</span>
                                      </div>
                                    )}
                                  </div>
                                  {!isActivated && isPaid && (
                                    <button onClick={(e) => handleOpenPay(tool, e)} className="px-6 py-2 bg-[#ebdcb9] text-[#8a5d13] rounded-xl text-[11px] font-black hover:bg-[#e4d0a3] transition-all">立即开通</button>
                                  )}
                               </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
           </div>
        </main>
      </div>

      {selectedToolToPay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[720px] max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200">
             <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <h3 className="text-lg font-black text-slate-800 leading-tight">开通：{selectedToolToPay.name}</h3>
                <button onClick={() => setSelectedToolToPay(null)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all outline-none"><Icon name="X" size={20} /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-6">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center space-x-2">
                        <div className="w-1 h-4 bg-[#ee7e33] rounded-full"></div>
                        <h4 className="text-sm font-black text-slate-700">选择授权套餐</h4>
                        </div>
                        <button
                          onClick={handleOpenMemberPayFromTool}
                          className="flex items-center space-x-2 text-[#D46B08] text-[12px] font-black hover:text-[#B45309] transition-colors"
                        >
                          <Icon name="Gift" size={14} />
                          <span>全站会员低至0.81元/天，通享所有模块！</span>
                          <Icon name="ChevronRight" size={14} />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {PAYMENT_PLANS.map(plan => {
                          const isSelected = selectedPlanId === plan.id;
                          return (
                            <div 
                              key={plan.id}
                              onClick={() => setSelectedPlanId(plan.id)}
                              className={`relative bg-white pt-8 pb-5 px-3 rounded-[24px] border-2 cursor-pointer transition-all duration-300 flex flex-col items-center ${isSelected ? 'border-[#ee7e33] bg-[#fffbf9] shadow-md shadow-orange-500/5' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                               <div className={`absolute top-0 left-0 px-3 py-1 ${plan.badgeColor} text-white text-[9px] font-black rounded-tl-[21px] rounded-br-xl`}>
                                 {plan.badge}
                               </div>
                               <div className="text-center space-y-3">
                                  <p className={`text-[13px] font-black transition-colors ${isSelected ? 'text-[#b45309]' : 'text-slate-600'}`}>{plan.name}</p>
                                  <div className="flex items-baseline justify-center text-slate-800">
                                     <span className="text-sm font-black mr-0.5">¥</span>
                                     <span className="text-4xl font-black tracking-tighter leading-none">{plan.price.toString().split('.')[0]}</span>
                                     <span className="text-lg font-black">.{plan.price.toString().split('.')[1] || '9'}</span>
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-400">{plan.footerText}</p>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <div className="space-y-6">
                         <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                              <h4 className="text-sm font-black text-slate-700">支付方式</h4>
                            </div>
                            <div className="flex space-x-3">
                               <button 
                                 onClick={() => setPaymentMethod('wechat')}
                                 className={`flex-1 h-12 flex items-center justify-center space-x-2 rounded-xl border-2 transition-all font-black text-xs ${paymentMethod === 'wechat' ? 'border-[#07c160] bg-[#07c160]/5 text-[#07c160]' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                               >
                                  <Icon name="MessageCircle" size={16} fill={paymentMethod === 'wechat' ? 'currentColor' : 'none'} />
                                  <span>微信支付</span>
                               </button>
                               <button 
                                 onClick={() => setPaymentMethod('alipay')}
                                 className={`flex-1 h-12 flex items-center justify-center space-x-2 rounded-xl border-2 transition-all font-black text-xs ${paymentMethod === 'alipay' ? 'border-[#1677ff] bg-[#1677ff]/5 text-[#1677ff]' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                               >
                                  <Icon name="Zap" size={16} fill={paymentMethod === 'alipay' ? 'currentColor' : 'none'} />
                                  <span>支付宝</span>
                               </button>
                            </div>
                         </div>
                         <div className="bg-slate-50/50 rounded-2xl p-5 space-y-3 border border-slate-100">
                            <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-400">
                               <span>套餐原价</span>
                               <span className="line-through">¥ {currentPlan.originalPrice}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between px-1">
                               <span className="text-xs font-black text-slate-800">应付金额</span>
                               <div className="flex items-baseline text-[#ee7e33]">
                                  <span className="text-xs font-black mr-1">¥</span>
                                  <span className="text-2xl font-black">{currentPlan.price}</span>
                               </div>
                            </div>
                         </div>
                      </div>
                      <div className="bg-[#f8f9fb] rounded-[32px] p-6 border border-slate-100 flex flex-col items-center justify-center space-y-4">
                         <div className="w-32 h-32 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center p-4 relative group">
                            <Icon name="QrCode" size={60} className="text-slate-100 group-hover:text-slate-200 transition-colors" strokeWidth={1} />
                            <div className="absolute inset-0 flex items-center justify-center"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Waiting</span></div>
                         </div>
                         <div className="text-center space-y-1">
                            <p className="text-[13px] font-black text-slate-700">使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫码</p>
                            <p className="text-[10px] font-bold text-slate-400">支付成功后自动授权</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="px-6 py-4 border-t border-slate-100 flex items-center space-x-4 shrink-0 bg-[#f8fafc]">
                <button 
                  onClick={() => setSelectedToolToPay(null)}
                  className="flex-1 py-3 bg-slate-50 text-slate-500 rounded-full font-black text-[13px] hover:bg-slate-100 transition-all active:scale-95 border border-slate-200 shadow-sm"
                >
                  暂不支付
                </button>
                <button 
                  onClick={handleConfirmToolActivation}
                  className="flex-1 py-3 bg-[#5c67f2] text-white rounded-full font-black text-[13px] shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
                >
                  我已完成支付
                </button>
             </div>
           </div>
        </div>
      )}

      {isMemberPayModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[720px] max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200">
             <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <h3 className="text-lg font-black text-slate-800 leading-tight">开通：艾造价全站会员</h3>
                <button onClick={() => setIsMemberPayModalOpen(false)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all outline-none"><Icon name="X" size={20} /></button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-6">
                   <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-4 bg-[#ee7e33] rounded-full"></div>
                        <h4 className="text-sm font-black text-slate-700">选择会员套餐</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {MEMBER_PLANS.map(plan => {
                          const isSelected = selectedMemberPlanId === plan.id;
                          return (
                            <div 
                              key={plan.id}
                              onClick={() => setSelectedMemberPlanId(plan.id)}
                              className={`relative bg-white pt-8 pb-5 px-3 rounded-[24px] border-2 cursor-pointer transition-all duration-300 flex flex-col items-center ${isSelected ? 'border-[#ee7e33] bg-[#fffbf9] shadow-md shadow-orange-500/5' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                               <div className={`absolute top-0 left-0 px-3 py-1 ${plan.badgeColor} text-white text-[9px] font-black rounded-tl-[21px] rounded-br-xl`}>
                                 {plan.badge}
                               </div>
                               <div className="text-center space-y-3">
                                  <p className={`text-[13px] font-black transition-colors ${isSelected ? 'text-[#b45309]' : 'text-slate-600'}`}>{plan.name}</p>
                                  <div className="flex items-baseline justify-center text-slate-800">
                                     <span className="text-sm font-black mr-0.5">¥</span>
                                     <span className="text-4xl font-black tracking-tighter leading-none">{plan.price.toString().split('.')[0]}</span>
                                     <span className="text-lg font-black">.{plan.price.toString().split('.')[1] || '00'}</span>
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-400">{plan.footerText}</p>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                      <div className="space-y-6">
                         <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                              <h4 className="text-sm font-black text-slate-700">支付方式</h4>
                            </div>
                            <div className="flex space-x-3">
                               <button 
                                 onClick={() => setPaymentMethod('wechat')}
                                 className={`flex-1 h-12 flex items-center justify-center space-x-2 rounded-xl border-2 transition-all font-black text-xs ${paymentMethod === 'wechat' ? 'border-[#07c160] bg-[#07c160]/5 text-[#07c160]' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                               >
                                  <Icon name="MessageCircle" size={16} fill={paymentMethod === 'wechat' ? 'currentColor' : 'none'} />
                                  <span>微信支付</span>
                               </button>
                               <button 
                                 onClick={() => setPaymentMethod('alipay')}
                                 className={`flex-1 h-12 flex items-center justify-center space-x-2 rounded-xl border-2 transition-all font-black text-xs ${paymentMethod === 'alipay' ? 'border-[#1677ff] bg-[#1677ff]/5 text-[#1677ff]' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                               >
                                  <Icon name="Zap" size={16} fill={paymentMethod === 'alipay' ? 'currentColor' : 'none'} />
                                  <span>支付宝</span>
                               </button>
                            </div>
                         </div>
                         <div className="bg-slate-50/50 rounded-2xl p-5 space-y-3 border border-slate-100">
                            <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-400">
                               <span>套餐原价</span>
                               <span className="line-through">¥ {MEMBER_PLANS.find(p => p.id === selectedMemberPlanId)?.originalPrice}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between px-1">
                               <span className="text-xs font-black text-slate-800">应付金额</span>
                               <div className="flex items-baseline text-[#ee7e33]">
                                  <span className="text-xs font-black mr-1">¥</span>
                                  <span className="text-2xl font-black">{MEMBER_PLANS.find(p => p.id === selectedMemberPlanId)?.price}</span>
                               </div>
                            </div>
                         </div>
                      </div>
                      <div className="bg-[#f8f9fb] rounded-[32px] p-6 border border-slate-100 flex flex-col items-center justify-center space-y-4">
                         <div className="w-32 h-32 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center p-4 relative group">
                            <Icon name="QrCode" size={60} className="text-slate-100 group-hover:text-slate-200 transition-colors" strokeWidth={1} />
                            <div className="absolute inset-0 flex items-center justify-center"><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Waiting</span></div>
                         </div>
                         <div className="text-center space-y-1">
                            <p className="text-[13px] font-black text-slate-700">使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫码</p>
                            <p className="text-[10px] font-bold text-slate-400">支付成功后自动授权</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="px-6 py-4 border-t border-slate-100 flex items-center space-x-4 shrink-0 bg-[#f8fafc]">
                <button 
                  onClick={() => setIsMemberPayModalOpen(false)}
                  className="flex-1 py-3 bg-slate-50 text-slate-500 rounded-full font-black text-[13px] hover:bg-slate-100 transition-all active:scale-95 border border-slate-200 shadow-sm"
                >
                  暂不支付
                </button>
                <button 
                  onClick={handleConfirmMemberActivation}
                  className="flex-1 py-3 bg-[#5c67f2] text-white rounded-full font-black text-[13px] shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-95"
                >
                  我已完成支付
                </button>
             </div>
           </div>
        </div>
      )}

      {/* 我的发票记录弹窗 */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200 overflow-hidden">
             <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <h3 className="text-xl font-black text-slate-800">我的发票记录</h3>
                <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-300 hover:text-slate-600 transition-colors p-1"><Icon name="X" size={28} /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-10 bg-[#fbfcfd]">
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-[#f8fafc] border-b border-slate-100">
                        <th className="px-8 py-5 text-[12px] font-black text-slate-600 text-center">订单号</th>
                        <th className="px-6 py-5 text-[12px] font-black text-slate-600">订单详情</th>
                        <th className="px-6 py-5 text-[12px] font-black text-slate-600 text-center">金额</th>
                        <th className="px-8 py-5 text-[12px] font-black text-slate-600 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-blue-50/20 transition-all">
                          <td className="px-8 py-5 text-[12px] font-mono text-slate-500 text-center">{inv.orderNo}</td>
                          <td className="px-6 py-5 text-sm font-bold text-slate-800">{inv.details}</td>
                          <td className="px-6 py-5 text-sm font-black text-slate-900 text-center">¥ {inv.amount.toFixed(2)}</td>
                          <td className="px-8 py-5 text-center">
                             {inv.hasInfo ? (
                               <button 
                                 onClick={handleDownloadInvoice}
                                 className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
                               >
                                 下载发票
                               </button>
                             ) : (
                               <button 
                                 onClick={() => handleFillInvoiceInfo(inv.id)}
                                 className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                               >
                                 填写开票信息
                               </button>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* 填写开票信息弹窗 */}
      {isFillInvoiceModalOpen && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[520px] flex flex-col animate-in zoom-in-95 border border-slate-200 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                 <h3 className="text-xl font-black text-slate-800">填写开票信息</h3>
                 <button onClick={() => setIsFillInvoiceModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Icon name="X" size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-white">
                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">发票抬头 (必填)</label>
                       <input 
                         type="text" 
                         value={invoiceForm.title} 
                         onChange={e => setInvoiceForm({...invoiceForm, title: e.target.value})} 
                         placeholder="请输入公司全称" 
                         className="w-full h-14 bg-slate-50 border border-slate-200 rounded-[18px] px-5 text-sm font-medium focus:bg-white focus:border-blue-400 outline-none transition-all"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">纳税人识别号 (必填)</label>
                       <input 
                         type="text" 
                         value={invoiceForm.taxId} 
                         onChange={e => setInvoiceForm({...invoiceForm, taxId: e.target.value})} 
                         placeholder="请输入15-20位统一社会信用代码" 
                         className="w-full h-14 bg-slate-50 border border-slate-200 rounded-[18px] px-5 text-sm font-medium focus:bg-white focus:border-blue-400 outline-none transition-all"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">接收电子发票邮箱 (必填)</label>
                       <input 
                         type="email" 
                         value={invoiceForm.email} 
                         onChange={e => setInvoiceForm({...invoiceForm, email: e.target.value})} 
                         placeholder="用于接收电子发票文件" 
                         className="w-full h-14 bg-slate-50 border border-slate-200 rounded-[18px] px-5 text-sm font-medium focus:bg-white focus:border-blue-400 outline-none transition-all"
                       />
                    </div>
                    <div className="h-px bg-slate-100 my-2"></div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">注册地址 (选填)</label>
                       <input 
                         type="text" 
                         value={invoiceForm.address} 
                         onChange={e => setInvoiceForm({...invoiceForm, address: e.target.value})} 
                         className="w-full h-14 bg-slate-50 border border-slate-200 rounded-[18px] px-5 text-sm font-medium focus:bg-white focus:border-blue-400 outline-none transition-all"
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">开户银行 (选填)</label>
                          <input 
                            type="text" 
                            value={invoiceForm.bank} 
                            onChange={e => setInvoiceForm({...invoiceForm, bank: e.target.value})} 
                            className="w-full h-14 bg-slate-50 border border-slate-200 rounded-[18px] px-5 text-sm font-medium focus:bg-white focus:border-blue-400 outline-none transition-all"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">银行账号 (选填)</label>
                          <input 
                            type="text" 
                            value={invoiceForm.account} 
                            onChange={e => setInvoiceForm({...invoiceForm, account: e.target.value})} 
                            className="w-full h-14 bg-slate-50 border border-slate-200 rounded-[18px] px-5 text-sm font-medium focus:bg-white focus:border-blue-400 outline-none transition-all"
                          />
                       </div>
                    </div>
                 </div>
              </div>
              <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end space-x-3 shrink-0">
                 <button onClick={() => setIsFillInvoiceModalOpen(false)} className="px-8 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all outline-none">取消</button>
                 <button onClick={handleSaveInvoiceInfo} className="px-10 py-2.5 bg-[#5c67f2] text-white rounded-xl text-sm font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 outline-none">提交信息</button>
              </div>
           </div>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[480px] p-10 flex flex-col border border-slate-200 animate-in zoom-in-95">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-800">修改密码</h3>
                <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors"><Icon name="X" size={24} /></button>
             </div>
             <div className="space-y-6">
                <div className="space-y-1.5">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">当前密码</label>
                   <input type="password" value={passwordForm.old} onChange={e => setPasswordForm({...passwordForm, old: e.target.value})} placeholder="请输入原密码" className="w-full h-14 bg-white border border-slate-200 rounded-[18px] px-5 text-sm outline-none focus:border-blue-400 transition-all" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">新密码</label>
                   <input type="password" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} placeholder="请输入新密码" className="w-full h-14 bg-white border border-slate-200 rounded-[18px] px-5 text-sm outline-none focus:border-blue-400 transition-all" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">确认新密码</label>
                   <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} placeholder="请再次输入新密码" className="w-full h-14 bg-white border border-slate-200 rounded-[18px] px-5 text-sm outline-none focus:border-blue-400 transition-all" />
                </div>
                <button onClick={() => { alert('修改成功'); setIsPasswordModalOpen(false); }} className="w-full h-14 bg-[#5c67f2] text-white rounded-[18px] font-black text-sm shadow-xl hover:bg-blue-700 transition-all active:scale-95 mt-4">提交修改</button>
             </div>
          </div>
        </div>
      )}

      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-[600px] h-[85vh] flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200 overflow-hidden">
              <div className="px-8 h-20 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                 <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#5c67f2] flex items-center justify-center text-white shadow-lg">
                       <Icon name="Bot" size={24} />
                    </div>
                    <h3 className="text-lg font-black text-slate-800">AI 智能客服</h3>
                 </div>
                 <button onClick={() => setIsCustomerModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                   <Icon name="X" size={24} />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] custom-scrollbar space-y-6">
                 {messages.map((msg) => (
                   <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'} space-x-3`}>
                         <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-[#5c67f2] text-white'}`}>
                            <Icon name={msg.role === 'user' ? 'User' : 'Bot'} size={18} />
                         </div>
                         <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm font-medium ${msg.role === 'user' ? 'bg-[#5c67f2] text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                            {msg.content}
                         </div>
                      </div>
                   </div>
                 ))}
                 {isBotTyping && (
                   <div className="flex justify-start">
                     <div className="flex space-x-3">
                       <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-[#5c67f2] text-white">
                         <Icon name="Bot" size={18} />
                       </div>
                       <div className="px-4 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center space-x-1.5">
                         <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                         <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                         <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-300"></div>
                       </div>
                     </div>
                   </div>
                 )}
                 <div ref={chatEndRef} />
              </div>
              <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                 <div className="relative">
                    <input 
                      type="text"
                      value={customerInput}
                      onChange={(e) => setCustomerInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendCustomerMessage()}
                      placeholder="请详细描述您的问题..."
                      className="w-full h-14 bg-white border border-slate-200 rounded-2xl pl-5 pr-16 text-sm outline-none focus:border-blue-500 shadow-sm"
                    />
                    <button onClick={() => handleSendCustomerMessage()} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#5c67f2] text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all"><Icon name="Send" size={18} /></button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[500px] p-10 flex flex-col animate-in zoom-in-95 border border-slate-200">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">更换手机</h3>
                <button onClick={() => setIsPhoneModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Icon name="X" size={24} /></button>
             </div>
             <div className="space-y-6">
                <div className="space-y-1.5">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">原手机号：</label>
                   <div className="w-full h-14 bg-slate-50 border border-slate-200 rounded-[18px] px-5 flex items-center text-sm font-bold text-slate-400 select-none">
                     {userPhone}
                   </div>
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">要更换的手机号：</label>
                   <input type="text" maxLength={11} value={newPhone} onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))} placeholder="请输入新手机号" className="w-full h-14 bg-white border border-slate-200 rounded-[18px] px-5 text-sm font-normal text-slate-700 focus:border-blue-400 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">验证码：</label>
                   <div className="flex items-center space-x-3">
                      <input type="text" maxLength={6} value={phoneCode} onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ''))} placeholder="请输入验证码" className="flex-1 h-14 bg-white border border-slate-200 rounded-[18px] px-5 text-sm font-normal text-slate-700 focus:border-blue-400 outline-none transition-all" />
                      <button onClick={handleSendPhoneCode} disabled={phoneCountdown > 0} className={`h-14 px-6 border-2 rounded-[18px] text-xs font-black transition-all ${phoneCountdown > 0 ? 'text-slate-400 bg-slate-50 border-slate-100' : 'text-blue-600 border-blue-100 hover:bg-blue-50'}`}>{phoneCountdown > 0 ? `${phoneCountdown}s` : '发送验证码'}</button>
                   </div>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-4">
                   <button onClick={() => setIsPhoneModalOpen(false)} className="px-8 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all outline-none">取消</button>
                   <button onClick={handleConfirmPhone} className="px-10 py-3 bg-[#5c67f2] text-white rounded-xl text-sm font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95 outline-none">确定</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {isEmailModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-[500px] p-10 flex flex-col animate-in zoom-in-95 border border-slate-200">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">绑定/更换邮箱</h3>
                <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Icon name="X" size={24} /></button>
             </div>
             <div className="space-y-6">
                <div className="space-y-1.5">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">邮箱地址：</label>
                   <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="请输入您的邮箱" className="w-full h-14 bg-white border border-slate-200 rounded-[18px] px-5 text-sm font-normal text-slate-700 focus:border-blue-400 outline-none transition-all" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">邮箱验证码：</label>
                   <div className="flex items-center space-x-3">
                      <input type="text" maxLength={6} value={emailCode} onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))} placeholder="请输入验证码" className="flex-1 h-14 bg-white border border-slate-200 rounded-[18px] px-5 text-sm font-normal text-slate-700 focus:border-blue-400 outline-none transition-all" />
                      <button onClick={handleSendEmailCode} disabled={emailCountdown > 0} className={`h-14 px-6 border-2 rounded-[18px] text-xs font-black transition-all ${emailCountdown > 0 ? 'text-slate-400 bg-slate-50 border-slate-100' : 'text-blue-600 border-blue-100 hover:bg-blue-50'}`}>{emailCountdown > 0 ? `${emailCountdown}s` : '发送验证码'}</button>
                   </div>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-4">
                   <button onClick={() => setIsEmailModalOpen(false)} className="px-8 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all outline-none">取消</button>
                   <button onClick={handleConfirmEmail} className="px-10 py-3 bg-[#5c67f2] text-white rounded-xl text-sm font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95 outline-none">确定绑定</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;
