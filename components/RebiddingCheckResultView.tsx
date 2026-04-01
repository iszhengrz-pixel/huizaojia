import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

interface RebiddingCheckResultViewProps {
  onBack: () => void;
  mode?: 'new' | 'edit';
}

interface UnitCompareItem {
  id: string;
  level: number;
  index: string;
  name: string;
  area: number;
  standard: number;
  bidders: Record<string, number>;
}

interface CompareDrawerData {
  visible: boolean;
  view: 'price' | 'deviation';
  bidder: string;
  itemCode: string;
  itemName: string;
  unit: string;
  controlPrice: number;
  bidderPrice: number;
  diffPercent: number;
  samePriceBidders?: string[];
  biddersPrices?: Record<string, number>;
}

interface ProblemDetailDrawerData {
  visible: boolean;
  title: string;
  bidder: string;
  type?: 'default' | 'samePrice' | 'unbalanced'; // 添加不平衡报价类型
  samePriceBidders?: string[]; // 涉及相同单价的投标单位名称列表
  isRegularError?: boolean; // 标识是否为固定差额的规律性错误
  view?: 'list' | 'breakdown'; // 控制抽屉内部的视图（列表或单价明细对比）
  selectedItem?: any; // 选中的清单项数据，用于明细对比
}

interface FilePreviewData {
  visible: boolean;
  problemDescription: string;
  tabs: string[];
  activeTab: string;
}

const RebiddingCheckResultView: React.FC<RebiddingCheckResultViewProps> = ({ onBack, mode = 'new' }) => {
  const projectTitle = '宁波住宅项目-清标检查';
  const [currentStep, setCurrentStep] = useState<2 | 3>(2);
  const [activeTab, setActiveTab] = useState('summary');
  const [activeComplianceTab, setActiveComplianceTab] = useState('wrong');
  const [activeArithmeticTab, setActiveArithmeticTab] = useState('emptyZero');
  const [activeCollusionTab, setActiveCollusionTab] = useState('attr');
  const [showOnlyProblem, setShowOnlyProblem] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHeaderSettingsModal, setShowHeaderSettingsModal] = useState(false);
  const [compareSearchKeyword, setCompareSearchKeyword] = useState('');
  const [filePreviewData, setFilePreviewData] = useState<FilePreviewData>({
    visible: false,
    problemDescription: '',
    tabs: [],
    activeTab: ''
  });
  const [problemDetailDrawer, setProblemDetailDrawer] = useState<ProblemDetailDrawerData>({
    visible: false,
    title: '',
    bidder: ''
  });
  const [compareDrawerData, setCompareDrawerData] = useState<CompareDrawerData>({
    visible: false,
    view: 'price',
    bidder: '',
    itemCode: '',
    itemName: '',
    unit: '',
    controlPrice: 0,
    bidderPrice: 0,
    diffPercent: 0
  });
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [unbalancedSettings, setUnbalancedSettings] = useState({
    quoteType: 'controlPrice', // 控制价、投标均价、投标最低价、投标均价-移除最高价最低价
    floatRange: '15'
  });

  const availableHeaders = ['序号', '项目编码', '名称', '项目特征', '单位', '工程量', '单价', '合价', '综合单价', '暂估价', '备注'];
  // 默认AI识别的表头
  const defaultAIHeaders = ['项目编码', '名称', '项目特征', '单位', '工程量'];
  const [selectedHeaders, setSelectedHeaders] = useState<string[]>(defaultAIHeaders);

  const toggleHeader = (header: string) => {
    setSelectedHeaders(prev => 
      prev.includes(header) ? prev.filter(h => h !== header) : [...prev, header]
    );
  };

  const TABS = currentStep === 2 ? [
    { id: 'summary', label: '结果汇总' },
    { id: 'compliance', label: '符合性检查' },
    { id: 'arithmetic', label: '算术性错误检查' },
    { id: 'unbalanced', label: '不平衡报价检查' },
    { id: 'collusion', label: '串标检查' }
  ] : [
    { id: 'compare', label: '清标对比表' },
    { id: 'unitCompare', label: '单方对比汇总' }
  ];

  const COMPLIANCE_TABS = [
    { id: 'wrong', label: '错项检查' },
    { id: 'added', label: '增项检查' },
    { id: 'missing', label: '漏项检查' },
    { id: 'sameList', label: '相同清单价格一致性检查' },
    { id: 'sameMaterial', label: '相同材料价格一致性检查' },
    { id: 'noCompete', label: '不可竞争金额是否有改动' },
    { id: 'exceedLimit', label: '投标价突破投标限价检查' }
  ];

  const ARITHMETIC_TABS = [
    { id: 'emptyZero', label: '单价为零、空、负数检查' },
    { id: 'total', label: '合价检查' }
  ];

  const COLLUSION_TABS = [
    { id: 'attr', label: '电子文件属性信息雷同' },
    { id: 'samePrice', label: '单价相同/相似检查' },
    { id: 'typos', label: '规律性错误检查' }
  ];

  // 模拟检查结果数据
  const MOCK_RESULTS = [
    { 
      id: '1', 
      bidder: 'A', 
      problemCount: 2,
      compliance: { wrong: 'ok', added: 'ok', missing: 'ok', sameList: 'ok', sameMaterial: 'error', noCompete: 'ok', exceedLimit: 'ok' },
      arithmetic: { emptyZero: 'ok', total: 'warning' },
      collusion: { unbalanced: 'ok', attr: 'ok', samePrice: 'error', typos: 'ok' }
    },
    { 
      id: '2', 
      bidder: 'B', 
      problemCount: 1,
      compliance: { wrong: 'ok', added: 'ok', missing: 'ok', sameList: 'ok', sameMaterial: 'ok', noCompete: 'ok', exceedLimit: 'ok' },
      arithmetic: { emptyZero: 'ok', total: 'ok' },
      collusion: { unbalanced: 'ok', attr: 'ok', samePrice: 'error', typos: 'ok' }
    },
    { 
      id: '3', 
      bidder: 'C', 
      problemCount: 1,
      compliance: { wrong: 'ok', added: 'ok', missing: 'error', sameList: 'ok', sameMaterial: 'ok', noCompete: 'ok', exceedLimit: 'ok' },
      arithmetic: { emptyZero: 'ok', total: 'ok' },
      collusion: { unbalanced: 'warning', attr: 'ok', samePrice: 'ok', typos: 'ok' }
    },
    { 
      id: '4', 
      bidder: 'D', 
      problemCount: 1,
      compliance: { wrong: 'ok', added: 'ok', missing: 'ok', sameList: 'ok', sameMaterial: 'ok', noCompete: 'ok', exceedLimit: 'ok' },
      arithmetic: { emptyZero: 'ok', total: 'ok' },
      collusion: { unbalanced: 'ok', attr: 'ok', samePrice: 'error', typos: 'ok' }
    },
    { 
      id: '5', 
      bidder: 'E', 
      problemCount: 1,
      compliance: { wrong: 'ok', added: 'ok', missing: 'ok', sameList: 'ok', sameMaterial: 'ok', noCompete: 'ok', exceedLimit: 'ok' },
      arithmetic: { emptyZero: 'ok', total: 'ok' },
      collusion: { unbalanced: 'ok', attr: 'ok', samePrice: 'error', typos: 'ok' }
    }
  ];

  // 清标对比表数据
  const MOCK_COMPARE_DATA = [
    { id: '1', code: '010101001001', name: '平整场地', feature: '这些根据不同的标底清单内容进行调整', unit: 'm2', quantity: 15, controlPrice: 15.5, bidders: { '投标单位1': 16.2, '投标单位2': 16.2, '评标基准价/平均价': 15.0 } },
    { id: '2', code: '010101002001', name: '挖沟槽土方', feature: '-', unit: 'm3', quantity: 12, controlPrice: 28.0, bidders: { '投标单位1': 29.5, '投标单位2': 29.5, '评标基准价/平均价': 26.8 } },
    { id: '3', code: '010103001001', name: '回填方', feature: '-', unit: 'm3', quantity: 18, controlPrice: 22.0, bidders: { '投标单位1': 21.0, '投标单位2': 23.5, '评标基准价/平均价': 22.5 } },
    { id: '4', code: '010401001001', name: '砖基础', feature: '-', unit: 'm3', quantity: 9, controlPrice: 380.0, bidders: { '投标单位1': 395.0, '投标单位2': 375.0, '评标基准价/平均价': 382.0 } },
    { id: '5', code: '010501001001', name: '垫层', feature: '-', unit: 'm3', quantity: 11, controlPrice: 450.0, bidders: { '投标单位1': 460.0, '投标单位2': 445.0, '评标基准价/平均价': 455.0 } },
  ];
  const compareBidderKeys = Object.keys(MOCK_COMPARE_DATA[0]?.bidders || {});
  const bidder1 = compareBidderKeys[0] || '投标单位1';
  const bidder2 = compareBidderKeys[1] || '投标单位2';
  const benchmarkBidder = compareBidderKeys[2] || '评标基准价/平均价';

  // 单方对比汇总数据
  const [unitCompareData, setUnitCompareData] = useState<UnitCompareItem[]>([
    { id: '1', level: 0, index: '一', name: '土建工程量清单', area: 192672.80, standard: 355282762.95, bidders: { '宁波建设': 334975149.49, '新盛恒': 329049049.40, '住宅': 351688581.52 } },
    { id: '2', level: 1, index: '1', name: '支护工程(含管井及单体坑基围护)', area: 192672.80, standard: 61491676.89, bidders: { '宁波建设': 64598653.40, '新盛恒': 62878044.10, '住宅': 62321145.59 } },
    { id: '3', level: 1, index: '2', name: '地下室土建', area: 55000.00, standard: 112019654.09, bidders: { '宁波建设': 113199759.70, '新盛恒': 102651587.40, '住宅': 113282547.49 } },
    { id: '4', level: 1, index: '3', name: '地上土建', area: 137672.80, standard: 155495020.47, bidders: { '宁波建设': 136238138.80, '新盛恒': 142069300.89, '住宅': 150710646.54 } },
    { id: '5', level: 0, index: '二', name: '安装工程量清单', area: 192673.00, standard: 18922636.73, bidders: { '宁波建设': 23104787.59, '新盛恒': 22567236.60, '住宅': 20700666.45 } },
    { id: '6', level: 1, index: '1', name: '地下室安装', area: 55000.00, standard: 5294389.32, bidders: { '宁波建设': 6039742.01, '新盛恒': 5705120.62, '住宅': 5582316.91 } },
    { id: '7', level: 0, index: '三', name: '包干措施费清单', area: 192673.00, standard: 50105782.04, bidders: { '宁波建设': 38879494.60, '新盛恒': 56656806.07, '住宅': 51618147.40 } },
    { id: '8', level: 0, index: '四', name: '投标报价总计(一+二+三)', area: 0, standard: 424311181.72, bidders: { '宁波建设': 396959431.68, '新盛恒': 408273092.07, '住宅': 424007395.37 } },
  ]);

  const handleUnitCompareAreaChange = (id: string, value: string) => {
    setUnitCompareData(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, area: parseFloat(value) || 0 };
      }
      return item;
    }));
  };

  const getCalculatedTotalUnitCost = (isStandard: boolean, bidderName?: string) => {
    let total = 0;
    let hasValidData = false;
    unitCompareData.forEach(d => {
      if (d.level === 0 && d.index !== '四' && d.area > 0) {
        let amount = 0;
        if (isStandard) {
          amount = d.standard;
        } else if (bidderName && d.bidders && bidderName in d.bidders) {
          amount = (d.bidders as Record<string, number>)[bidderName];
        }
        total += amount / d.area;
        hasValidData = true;
      }
    });
    return hasValidData ? total.toFixed(2) : '-';
  };

  const scrollToAvoidDrawer = (tr: HTMLElement | null) => {
    if (!tr) return;
    
    // 延迟以等待抽屉渲染并触发布局变化
    setTimeout(() => {
      const scrollContainer = document.getElementById('scrollable-content');
      const drawer = document.getElementById('bottom-drawer');
      
      if (tr) {
        // 计算元素在滚动容器中的相对位置
        const trRect = tr.getBoundingClientRect();
        
        // 抽屉实际高度，如果未渲染出来则提供默认值
        const drawerHeight = drawer ? drawer.offsetHeight : window.innerHeight * 0.6;
        // 可视区域的底部安全线 (留出80px边距，确保整行清晰可见)
        const safeBottom = window.innerHeight - drawerHeight - 80;

        // 如果元素的底部低于安全线，说明会被抽屉遮挡，需要滚动
        if (trRect.bottom > safeBottom) {
          const scrollDistance = trRect.bottom - safeBottom;
          
          if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
            scrollContainer.scrollBy({
              top: scrollDistance,
              behavior: 'smooth'
            });
          } else {
            // fallback
            window.scrollBy({
              top: scrollDistance,
              behavior: 'smooth'
            });
          }
        }
      }
    }, 150); // 增加一点延迟确保 padding 已经应用并且抽屉 DOM 存在
  };

  const openCompareDrawer = (
    view: 'price' | 'deviation',
    item: { id?: string; code: string; name: string; unit: string; controlPrice: number; bidders?: Record<string, number> },
    bidder: string,
    bidderPrice: number,
    event: React.MouseEvent,
    samePriceBidders?: string[]
  ) => {
    const tr = (event.target as HTMLElement).closest('tr');
    const diffPercent = ((bidderPrice - item.controlPrice) / item.controlPrice) * 100;
    setCompareDrawerData({
      visible: true,
      view,
      bidder,
      itemCode: item.code,
      itemName: item.name,
      unit: item.unit,
      controlPrice: item.controlPrice,
      bidderPrice,
      diffPercent,
      samePriceBidders,
      biddersPrices: item.bidders
    });

    if (item.id) {
      setHighlightedRowId(item.id);
      
      // 如果是从明细抽屉跳转过来的，等待DOM渲染后再滚动到对应行
      setTimeout(() => {
        const row = document.getElementById(`compare-row-${item.id}`);
        const scrollContainer = document.getElementById('scrollable-content');
        const drawer = document.getElementById('bottom-drawer');
        
        if (row && scrollContainer) {
          const rowRect = row.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();
          const drawerHeight = drawer ? drawer.offsetHeight : window.innerHeight * 0.6;
          
          // 我们希望行显示在抽屉上方、可见区域中间
          const visibleTop = containerRect.top;
          const visibleBottom = window.innerHeight - drawerHeight;
          const visibleHeight = visibleBottom - visibleTop;
          
          // 目标位置：让行的顶部等于可见区域的中心点附近
          const targetY = visibleTop + visibleHeight / 2 - rowRect.height / 2;
          
          const scrollDistance = rowRect.top - targetY;
          
          scrollContainer.scrollBy({ top: scrollDistance, behavior: 'smooth' });
        } else {
          scrollToAvoidDrawer(tr);
        }
      }, 300);
    } else {
      scrollToAvoidDrawer(tr);
    }
  };

  const closeCompareDrawer = () => {
    setCompareDrawerData(prev => ({ ...prev, visible: false }));
    setHighlightedRowId(null);
  };

  const priceBreakdownRows = [
    { label: '人工费', ratio: 0.34 },
    { label: '材料费', ratio: 0.46 },
    { label: '机械费', ratio: 0.12 },
    { label: '管理及措施费', ratio: 0.08 }
  ];

  const renderStatusIcon = (status: string) => {
    switch(status) {
      case 'ok':
        return <Icon name="Check" size={16} className="text-green-500 mx-auto" />;
      case 'error':
        return <Icon name="X" size={16} className="text-red-500 mx-auto" />;
      case 'warning':
        return <Icon name="X" size={16} className="text-red-500 mx-auto" />;
      default:
        return null;
    }
  };

  const renderComplianceStatusText = (status: string) => {
    switch(status) {
      case 'ok':
        return <span className="text-slate-600">正常</span>;
      case 'error':
      case 'warning':
        return <span className="text-red-500">异常</span>;
      default:
        return <span className="text-slate-400">-</span>;
    }
  };

  const displayResults = showOnlyProblem ? MOCK_RESULTS.filter(r => r.problemCount > 0) : MOCK_RESULTS;

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'compare') {
      setHighlightedRowId(null);
    }
    if (compareDrawerData.visible) {
      closeCompareDrawer();
    }
    if (problemDetailDrawer.visible) {
      setProblemDetailDrawer(prev => ({ ...prev, visible: false }));
    }
  };

  const handleSummaryCellClick = (mainTabId: string, subTabId?: string) => {
    handleTabChange(mainTabId);
    if (subTabId) {
      if (mainTabId === 'compliance') {
        setActiveComplianceTab(subTabId);
      } else if (mainTabId === 'arithmetic') {
        setActiveArithmeticTab(subTabId);
      } else if (mainTabId === 'collusion') {
        setActiveCollusionTab(subTabId);
      }
    }
  };

  const openProblemDetailDrawer = (title: string, bidder: string, event: React.MouseEvent, type: 'default' | 'samePrice' | 'unbalanced' = 'default', samePriceBidders?: string[], isRegularError?: boolean) => {
    const tr = (event.target as HTMLElement).closest('tr');
    setProblemDetailDrawer({
      visible: true,
      title,
      bidder,
      type,
      samePriceBidders,
      isRegularError,
      view: 'list',
      selectedItem: undefined
    });
    
    scrollToAvoidDrawer(tr);
  };

  const closeProblemDetailDrawer = () => {
    setProblemDetailDrawer(prev => ({ ...prev, visible: false }));
  };

  const openFilePreview = (problemDescription: string, tabs: string[]) => {
    setFilePreviewData({
      visible: true,
      problemDescription,
      tabs,
      activeTab: tabs.length > 0 ? tabs[0] : ''
    });
  };

  const closeFilePreview = () => {
    setFilePreviewData(prev => ({ ...prev, visible: false }));
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative animate-in slide-in-from-right-8 duration-300">
      {/* 顶部栏 */}
      <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center space-x-4 w-1/4">
          <button 
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div className="min-w-0 leading-tight">
            <h2 className="text-lg font-black text-slate-800">查看检查结果</h2>
            <p className="text-xs text-slate-500 truncate">项目名称：{projectTitle}</p>
          </div>
        </div>
        
        {/* 进度条区域 */}
        <div className="flex-1 flex justify-center items-center">
          <div className="flex items-center space-x-2">
            {/* Step 1 */}
            <div className="flex items-center">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200">1</div>
              <span className="ml-2 text-sm font-medium text-slate-500">{mode === 'new' ? '新建项目' : '编辑项目'}</span>
            </div>
            
            {/* Divider */}
            <div className="w-12 h-[1px] bg-slate-300 mx-2"></div>
            
            {/* Step 2 */}
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${currentStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>2</div>
              <span className={`ml-2 text-sm font-medium ${currentStep === 2 ? 'text-blue-600' : 'text-slate-500'}`}>清标检查</span>
            </div>
            
            {/* Divider */}
            <div className="w-12 h-[1px] bg-slate-300 mx-2"></div>
            
            {/* Step 3 */}
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${currentStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>3</div>
              <span className={`ml-2 text-sm font-medium ${currentStep === 3 ? 'text-blue-600' : 'text-slate-500'}`}>查看对比表</span>
            </div>
            
            {/* Divider */}
            <div className="w-12 h-[1px] bg-slate-300 mx-2"></div>
            
            {/* Step 4 */}
            <div className="flex items-center">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-400 text-xs font-bold border border-slate-200">4</div>
              <span className="ml-2 text-sm font-medium text-slate-500">导出报告</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-1/4 justify-end">
          <button 
            onClick={() => {
              if (currentStep === 3) {
                setCurrentStep(2);
                setActiveTab('summary');
                closeCompareDrawer();
                closeProblemDetailDrawer();
              } else {
                onBack();
              }
            }} 
            className="px-5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors flex items-center space-x-1"
          >
             <span>上一步</span>
          </button>
          <button 
            onClick={() => {
              if (currentStep === 2) {
                setCurrentStep(3);
                setActiveTab('compare');
                closeProblemDetailDrawer();
              } else {
                // TODO: 导出报告逻辑
              }
            }} 
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20"
          >
            {currentStep === 2 ? '查看对比表' : '导出报告'}
          </button>
        </div>
      </div>

      <div id="scrollable-content" className="flex-1 overflow-auto p-4 relative">
        <div className={`space-y-4 ${problemDetailDrawer.visible || compareDrawerData.visible ? 'pb-[70vh]' : ''}`}>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="flex bg-blue-50/50 border-b border-slate-200 px-2 pt-2">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-6 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-white text-slate-800 border border-slate-200 border-b-white relative top-[1px]' 
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content Toolbar */}
            {activeTab === 'summary' && (
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
                <div className="text-sm text-slate-500 flex items-center">
                  <Icon name="Info" size={14} className="mr-1 text-slate-400" />
                  温馨提示：鼠标点击 <Icon name="X" size={14} className="text-red-500 mx-1" /> 或 <Icon name="Check" size={14} className="text-green-500 mx-1" /> ，可直接跳转到具体的检查
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showOnlyProblem} 
                    onChange={e => setShowOnlyProblem(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                  />
                  <span className="text-sm text-slate-700">只显示有问题单位</span>
                </label>
              </div>
            )}

            {/* Table Area */}
            <div className="overflow-x-auto bg-white p-4">
              {activeTab === 'summary' && (
                <table className="w-full text-center border-collapse border border-slate-200 min-w-[1200px]">
                  <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold">
                    <tr>
                      <th className="border border-slate-200 py-3 px-2 w-12" rowSpan={2}>序号</th>
                      <th className="border border-slate-200 py-3 px-4 w-32" rowSpan={2}>投标单位</th>
                      <th className="border border-slate-200 py-3 px-4 w-24" rowSpan={2}>问题数量</th>
                      <th className="border border-slate-200 py-2" colSpan={7}>符合性检查</th>
                      <th className="border border-slate-200 py-2" colSpan={2}>算术性错误检查</th>
                      <th className="border border-slate-200 py-2 w-32" rowSpan={2}>不平衡报价检查</th>
                      <th className="border border-slate-200 py-2" colSpan={3}>串标嫌疑检查</th>
                    </tr>
                    <tr className="bg-slate-50 text-[12px] text-slate-600 font-medium">
                      {/* 符合性检查 */}
                      <th className="border border-slate-200 py-2 px-2 font-normal">错项检查</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">增项检查</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">漏项检查</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">相同清单价格<br/>一致性检查</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">相同材料价格<br/>一致性检查</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">不可竞争金额<br/>是否有改动</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">投标价突破投<br/>标限价检查</th>
                      
                      {/* 算术性错误检查 */}
                      <th className="border border-slate-200 py-2 px-2 font-normal">单价为零、空<br/>、负数检查</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">合价检查</th>
                      
                      {/* 串标嫌疑检查 */}
                      <th className="border border-slate-200 py-2 px-2 font-normal">电子文件属<br/>性信息雷同</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">单价相同/相<br/>似检查</th>
                      <th className="border border-slate-200 py-2 px-2 font-normal">规律性错误检查</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayResults.map((result, index) => (
                      <tr key={result.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                        <td className="border border-slate-200 py-3 text-sm text-slate-500">{index + 1}</td>
                        <td className="border border-slate-200 py-3 text-sm text-slate-800 font-medium">{result.bidder}</td>
                        <td className="border border-slate-200 py-3 text-sm text-red-500 font-medium">{result.problemCount > 0 ? result.problemCount : ''}</td>
                        
                        {/* 符合性检查数据 */}
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('compliance', 'wrong')}>{renderStatusIcon(result.compliance.wrong)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('compliance', 'added')}>{renderStatusIcon(result.compliance.added)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('compliance', 'missing')}>{renderStatusIcon(result.compliance.missing)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('compliance', 'sameList')}>{renderStatusIcon(result.compliance.sameList)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('compliance', 'sameMaterial')}>{renderStatusIcon(result.compliance.sameMaterial)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('compliance', 'noCompete')}>{renderStatusIcon(result.compliance.noCompete)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('compliance', 'exceedLimit')}>{renderStatusIcon(result.compliance.exceedLimit)}</td>
                        
                        {/* 算术性错误检查数据 */}
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('arithmetic', 'emptyZero')}>{renderStatusIcon(result.arithmetic.emptyZero)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('arithmetic', 'total')}>{renderStatusIcon(result.arithmetic.total)}</td>
                        
                        {/* 不平衡报价 */}
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('unbalanced')}>{renderStatusIcon(result.collusion.unbalanced)}</td>
                        
                        {/* 串标嫌疑检查数据 */}
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('collusion', 'attr')}>{renderStatusIcon(result.collusion.attr)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('collusion', 'samePrice')}>{renderStatusIcon(result.collusion.samePrice)}</td>
                        <td className="border border-slate-200 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSummaryCellClick('collusion', 'typos')}>{renderStatusIcon(result.collusion.typos)}</td>
                      </tr>
                    ))}
                    {displayResults.length === 0 && (
                      <tr>
                        <td colSpan={15} className="border border-slate-200 py-12 text-slate-400 text-sm">
                          没有发现问题记录
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
              {activeTab === 'compliance' && (
                <div className="space-y-4">
                  {/* 二级导航 */}
                  <div className="flex items-center justify-between border-b border-slate-200">
                    <div className="flex space-x-1">
                      {COMPLIANCE_TABS.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveComplianceTab(tab.id)}
                          className={`px-4 py-2 text-sm transition-colors border-b-2 ${
                            activeComplianceTab === tab.id 
                              ? 'border-blue-600 text-blue-600 font-medium' 
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <button className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center space-x-1 mb-2">
                      <Icon name="Download" size={14} />
                      <span>导出报表</span>
                    </button>
                  </div>
                  
                  {/* 符合性检查表格 */}
                  <table className="w-full text-center border-collapse border border-slate-200">
                    <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold">
                      <tr>
                        <th className="border border-slate-200 py-3 px-4 w-16">序号</th>
                        <th className="border border-slate-200 py-3 px-4 w-48">投标人名称</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">错误量</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">结果</th>
                        <th className="border border-slate-200 py-3 px-4 text-left">说明</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {MOCK_RESULTS.map((result, index) => {
                        // 简单模拟根据不同二级tab展示错误数量和说明
                        const hasError = result.compliance[activeComplianceTab as keyof typeof result.compliance] === 'error';
                        const errorCount = hasError ? Math.floor(Math.random() * 3) + 1 : 0;
                        
                        return (
                          <tr key={result.id} className="bg-white hover:bg-blue-50/30 transition-colors">
                            <td className="border border-slate-200 py-3 px-4 text-slate-500">{index + 1}</td>
                            <td className="border border-slate-200 py-3 px-4 text-slate-800">{result.bidder}</td>
                            <td className={`border border-slate-200 py-3 px-4 ${errorCount > 0 ? 'text-red-500 font-medium' : 'text-slate-600'}`}>
                              {errorCount > 0 ? errorCount : '-'}
                            </td>
                            <td className={`border border-slate-200 py-3 px-4 ${errorCount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {errorCount > 0 ? '异常' : '正常'}
                            </td>
                            <td className="border border-slate-200 py-3 px-4 text-left text-slate-600 truncate max-w-md">
                              {errorCount > 0 
                                ? <span className="text-red-500">{`${errorCount}项投标部分项清单与招标部分项清单不一致; 1项投标总价措施项目...`}</span> 
                                : '-'}
                            </td>
                            <td className="border border-slate-200 py-3 px-4">
                              <button 
                                onClick={(e) => openProblemDetailDrawer(COMPLIANCE_TABS.find(t => t.id === activeComplianceTab)?.label || '问题明细', result.bidder, e)}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                查看明细
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'arithmetic' && (
                <div className="space-y-4">
                  {/* 二级导航 */}
                  <div className="flex items-center justify-between border-b border-slate-200">
                    <div className="flex space-x-1">
                      {ARITHMETIC_TABS.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveArithmeticTab(tab.id)}
                          className={`px-4 py-2 text-sm transition-colors border-b-2 ${
                            activeArithmeticTab === tab.id 
                              ? 'border-blue-600 text-blue-600 font-medium' 
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <button className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center space-x-1 mb-2">
                      <Icon name="Download" size={14} />
                      <span>导出报表</span>
                    </button>
                  </div>
                  
                  {/* 算术性错误检查表格 */}
                  <table className="w-full text-center border-collapse border border-slate-200">
                    <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold">
                      <tr>
                        <th className="border border-slate-200 py-3 px-4 w-16">序号</th>
                        <th className="border border-slate-200 py-3 px-4 w-48">投标人名称</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">错误量</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">结果</th>
                        <th className="border border-slate-200 py-3 px-4 text-left">说明</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {MOCK_RESULTS.map((result, index) => {
                        const hasError = result.arithmetic[activeArithmeticTab as keyof typeof result.arithmetic] === 'error' || result.arithmetic[activeArithmeticTab as keyof typeof result.arithmetic] === 'warning';
                        const errorCount = hasError ? Math.floor(Math.random() * 5) + 1 : 0;
                        
                        return (
                          <tr key={result.id} className="bg-white hover:bg-blue-50/30 transition-colors">
                            <td className="border border-slate-200 py-3 px-4 text-slate-500">{index + 1}</td>
                            <td className="border border-slate-200 py-3 px-4 text-slate-800">{result.bidder}</td>
                            <td className={`border border-slate-200 py-3 px-4 ${errorCount > 0 ? 'text-red-500 font-medium' : 'text-slate-600'}`}>
                              {errorCount > 0 ? errorCount : '-'}
                            </td>
                            <td className={`border border-slate-200 py-3 px-4 ${errorCount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {errorCount > 0 ? '异常' : '正常'}
                            </td>
                            <td className="border border-slate-200 py-3 px-4 text-left text-slate-600 truncate max-w-md">
                              {errorCount > 0 
                                ? <span className="text-red-500">{`${errorCount}项清单计算结果存在算术性错误...`}</span> 
                                : '-'}
                            </td>
                            <td className="border border-slate-200 py-3 px-4">
                              <button 
                                onClick={(e) => openProblemDetailDrawer(ARITHMETIC_TABS.find(t => t.id === activeArithmeticTab)?.label || '问题明细', result.bidder, e)}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                查看明细
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'unbalanced' && (
                <div className="space-y-4">
                  {/* 顶部操作区 */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="text-sm text-slate-500">
                      超出设定的基准值部分被认定为不平衡报价
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => setShowSettingsModal(true)} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center space-x-1">
                        <Icon name="Settings" size={14} />
                        <span>参数设置</span>
                      </button>
                      <button className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center space-x-1">
                        <Icon name="Download" size={14} />
                        <span>导出报表</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* 不平衡报价检查表格 */}
                  <table className="w-full text-center border-collapse border border-slate-200">
                    <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold">
                      <tr>
                        <th className="border border-slate-200 py-3 px-4 w-16">序号</th>
                        <th className="border border-slate-200 py-3 px-4 w-48">投标人名称</th>
                        <th className="border border-slate-200 py-3 px-4">投标总报价</th>
                        <th className="border border-slate-200 py-3 px-4">不平衡清单合价</th>
                        <th className="border border-slate-200 py-3 px-4">占总报价百分比</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">结果</th>
                        <th className="border border-slate-200 py-3 px-4 text-left">说明</th>
                        <th className="border border-slate-200 py-3 px-4 w-24">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {MOCK_RESULTS.map((result, index) => {
                        // 简单模拟不同投标单位的数据状态
                        const isWarning = index === 1; // 模拟第二行是警告状态
                        const totalBid = isWarning ? 100 : 10000;
                        const unbalancedTotal = isWarning ? 15 : 7746.82;
                        const percentage = isWarning ? '15%' : '77.47%';
                        
                        return (
                          <tr key={result.id} className="bg-white hover:bg-blue-50/30 transition-colors">
                            <td className="border border-slate-200 py-3 px-4 text-slate-500">{index + 1}</td>
                            <td className="border border-slate-200 py-3 px-4 text-slate-800">{result.bidder}</td>
                            <td className="border border-slate-200 py-3 px-4 text-slate-600">{totalBid}</td>
                            <td className="border border-slate-200 py-3 px-4 text-slate-600">{unbalancedTotal}</td>
                            <td className="border border-slate-200 py-3 px-4 text-slate-600">{percentage}</td>
                            <td className={`border border-slate-200 py-3 px-4 ${isWarning ? 'text-amber-500' : 'text-red-500'}`}>
                              {isWarning ? '警告' : '异常'}
                            </td>
                            <td className={`border border-slate-200 py-3 px-4 text-left truncate max-w-md ${isWarning ? 'text-amber-500' : 'text-red-500'}`}>
                              6条清单单价与均价偏差在30.0%以上，...
                            </td>
                            <td className="border border-slate-200 py-3 px-4">
                              <button 
                                onClick={(e) => openProblemDetailDrawer('不平衡报价明细', result.bidder, e, 'unbalanced')}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                查看明细
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'collusion' && (
                <div className="space-y-4">
                  {/* 二级导航 */}
                  <div className="flex items-center justify-between border-b border-slate-200">
                    <div className="flex space-x-1">
                      {COLLUSION_TABS.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveCollusionTab(tab.id)}
                          className={`px-4 py-2 text-sm transition-colors border-b-2 ${
                            activeCollusionTab === tab.id 
                              ? 'border-blue-600 text-blue-600 font-medium' 
                              : 'border-transparent text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <button className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center space-x-1 mb-2">
                      <Icon name="Download" size={14} />
                      <span>导出报表</span>
                    </button>
                  </div>
                  
                  {/* 串标检查表格 */}
                  <table className="w-full text-center border-collapse border border-slate-200">
                      <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold sticky top-0 shadow-sm z-10">
                        <tr>
                          <th className="border border-slate-200 py-3 px-4 w-16">序号</th>
                          <th className="border border-slate-200 py-3 px-4 w-32">投标单位</th>
                          <th className="border border-slate-200 py-3 px-4 w-24 whitespace-nowrap">嫌疑项数量</th>
                          <th className="border border-slate-200 py-3 px-4 w-24">结果</th>
                          <th className="border border-slate-200 py-3 px-4 text-left">说明</th>
                          <th className="border border-slate-200 py-3 px-4 w-24">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                      {MOCK_RESULTS.map((result, index) => {
                        const hasError = result.collusion[activeCollusionTab as keyof typeof result.collusion] === 'error' || result.collusion[activeCollusionTab as keyof typeof result.collusion] === 'warning';
                        const errorCount = hasError ? Math.floor(Math.random() * 3) + 1 : 0;
                        
                        return (
                          <tr key={result.id} className="bg-white hover:bg-blue-50/30 transition-colors">
                            <td className="border border-slate-200 py-3 px-4 text-slate-500">{index + 1}</td>
                            <td className="border border-slate-200 py-3 px-4 text-slate-800">{result.bidder}</td>
                            <td className={`border border-slate-200 py-3 px-4 ${errorCount > 0 ? 'text-red-500 font-medium' : 'text-slate-600'}`}>
                              {errorCount > 0 ? errorCount : '-'}
                            </td>
                            <td className={`border border-slate-200 py-3 px-4 ${errorCount > 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {errorCount > 0 ? '异常' : '正常'}
                            </td>
                            <td className="border border-slate-200 py-3 px-4 text-left text-slate-600 truncate max-w-md">
                              {errorCount > 0 
                                ? <span className="text-red-500">
                                    {activeCollusionTab === 'samePrice' && (result.bidder === 'D' || result.bidder === 'E')
                                      ? "D和E每个单价只差了10块"
                                      : `存在${errorCount}项${COLLUSION_TABS.find(t => t.id === activeCollusionTab)?.label}嫌疑...`
                                    }
                                  </span> 
                                : '-'}
                            </td>
                            <td className="border border-slate-200 py-3 px-4">
                              <button 
                                onClick={(e) => {
                                  const tabLabel = COLLUSION_TABS.find(t => t.id === activeCollusionTab)?.label || '问题明细';
                                  if (activeCollusionTab === 'samePrice') {
                                    if (result.bidder === 'D' || result.bidder === 'E') {
                                      // 模拟 D 和 E 规律性错误（固定差额）放到单价相同相似检查中
                                      openProblemDetailDrawer(tabLabel, result.bidder, e, 'samePrice', ['投标单位1', '投标单位2'], true);
                                    } else {
                                      let involvedBidders = [result.bidder];
                                      if (result.bidder === 'A' || result.bidder === 'B') {
                                        // 映射到 MOCK_COMPARE_DATA 中的实际单位名称
                                        involvedBidders = ['投标单位1', '投标单位2'];
                                      } else {
                                        const otherBidder = MOCK_RESULTS.find(r => r.id !== result.id && r.id !== '4' && r.id !== '5')?.bidder || '其他单位';
                                        involvedBidders = [result.bidder, otherBidder];
                                      }
                                      openProblemDetailDrawer(tabLabel, result.bidder, e, 'samePrice', involvedBidders);
                                    }
                                  } else {
                                    openProblemDetailDrawer(tabLabel, result.bidder, e);
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                查看明细
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'compare' && (
                <div className="space-y-4">
                  {/* 顶部操作区 */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="relative w-80">
                      <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="请输入项目编码/名称/项目特征等..." 
                        value={compareSearchKeyword}
                        onChange={(e) => setCompareSearchKeyword(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" 
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => setShowHeaderSettingsModal(true)} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center space-x-1">
                        <Icon name="Columns" size={14} />
                        <span>表头设置</span>
                      </button>
                      <button onClick={() => setShowSettingsModal(true)} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center space-x-1">
                        <Icon name="Settings" size={14} />
                        <span>不平衡报价设置</span>
                      </button>
                      <button className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center space-x-1">
                        <Icon name="Download" size={14} />
                        <span>导出报表</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* 对比表格 */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1900px] text-center border-collapse border border-slate-200">
                      <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold">
                        <tr>
                          {selectedHeaders.includes('序号') && <th className="border border-slate-200 py-3 px-4 w-16 bg-slate-100 text-slate-700" rowSpan={2}>序号</th>}
                          {selectedHeaders.includes('项目编码') && <th className="border border-slate-200 py-3 px-4 bg-slate-100 text-slate-700" rowSpan={2}>项目编码</th>}
                          {selectedHeaders.includes('名称') && <th className="border border-slate-200 py-3 px-4 bg-slate-100 text-slate-700" rowSpan={2}>名称</th>}
                          {selectedHeaders.includes('项目特征') && <th className="border border-slate-200 py-3 px-4 bg-slate-100 text-slate-700" rowSpan={2}>项目特征</th>}
                          {selectedHeaders.includes('单位') && <th className="border border-slate-200 py-3 px-4 w-16 bg-slate-100 text-slate-700" rowSpan={2}>单位</th>}
                          {selectedHeaders.includes('工程量') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>工程量</th>}
                          {selectedHeaders.includes('单价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>单价</th>}
                          {selectedHeaders.includes('合价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>合价</th>}
                          {selectedHeaders.includes('综合单价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>综合单价</th>}
                          {selectedHeaders.includes('暂估价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>暂估价</th>}
                          {selectedHeaders.includes('备注') && <th className="border border-slate-200 py-3 px-4 bg-slate-100 text-slate-700" rowSpan={2}>备注</th>}
                          <th className="border border-slate-200 py-2 px-4 bg-slate-50 text-slate-700" colSpan={3}>标底</th>
                          <th className="border border-slate-200 py-2 px-4 bg-slate-50 text-slate-700" colSpan={4}>{bidder1}</th>
                          <th className="border border-slate-200 py-2 px-4 bg-slate-50 text-slate-700" colSpan={4}>{bidder2}</th>
                          <th className="border border-slate-200 py-2 px-4 bg-slate-50 text-slate-700" colSpan={3}>{benchmarkBidder}</th>
                        </tr>
                        <tr className="bg-slate-50 text-[12px] text-slate-600">
                          <th className="border border-slate-200 py-2 px-4 font-normal">工程量</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal">单价</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal">合价</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal">工程量</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal">单价</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal">合价</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal">偏差百分比</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal">工程量</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal">单价</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal">合价</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal">偏差百分比</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal">工程量</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal">单价</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal">合价</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm text-slate-600 bg-white">
                        {MOCK_COMPARE_DATA.filter(item => 
                          item.code.includes(compareSearchKeyword) || 
                          item.name.includes(compareSearchKeyword) || 
                          item.feature.includes(compareSearchKeyword)
                        ).map((item, index) => (
                          <tr 
                            key={item.id} 
                            id={`compare-row-${item.id}`}
                            className={`transition-colors ${highlightedRowId === item.id ? 'bg-amber-50/70 hover:bg-amber-100/70' : 'bg-white hover:bg-blue-50/30'}`}
                          >
                            {selectedHeaders.includes('序号') && <td className="border border-slate-200 py-3 px-4">{index + 1}</td>}
                            {selectedHeaders.includes('项目编码') && <td className="border border-slate-200 py-3 px-4 font-mono">{item.code}</td>}
                            {selectedHeaders.includes('名称') && <td className="border border-slate-200 py-3 px-4 text-left">{item.name}</td>}
                            {selectedHeaders.includes('项目特征') && <td className="border border-slate-200 py-3 px-4 text-left">{item.feature}</td>}
                            {selectedHeaders.includes('单位') && <td className="border border-slate-200 py-3 px-4">{item.unit}</td>}
                            {selectedHeaders.includes('工程量') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">{item.quantity}</td>}
                            {selectedHeaders.includes('单价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                            {selectedHeaders.includes('合价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                            {selectedHeaders.includes('综合单价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                            {selectedHeaders.includes('暂估价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                            {selectedHeaders.includes('备注') && <td className="border border-slate-200 py-3 px-4 text-left">-</td>}
                            <td className="border border-slate-200 py-3 px-4 bg-slate-50/60 font-mono text-right">{item.quantity}</td>
                            <td className="border border-slate-200 py-3 px-4 font-mono text-right">
                              <button
                                type="button"
                                onClick={(e) => openCompareDrawer('price', item, '标底', item.controlPrice, e)}
                                className="w-full text-right hover:underline text-blue-600"
                              >
                                {item.controlPrice.toFixed(2)}
                              </button>
                            </td>
                            <td className="border border-slate-200 py-3 px-4 font-mono text-right">{(item.quantity * item.controlPrice).toFixed(2)}</td>
                            {[bidder1, bidder2].map((bidder) => {
                              const price = item.bidders[bidder];
                              const diffPercent = ((price - item.controlPrice) / item.controlPrice) * 100;
                              const diffClass = diffPercent >= 0 ? 'text-red-500' : 'text-blue-600';
                              return (
                                <React.Fragment key={bidder}>
                                  <td className="border border-slate-200 py-3 px-4 bg-blue-50/30 font-mono text-right">{item.quantity}</td>
                                  <td className="border border-slate-200 py-3 px-4 font-mono text-right">
                                    <button
                                      type="button"
                                      onClick={(e) => openCompareDrawer('price', item, bidder, price, e)}
                                      className="w-full text-right hover:underline text-blue-600"
                                    >
                                      {price.toFixed(2)}
                                    </button>
                                  </td>
                                  <td className="border border-slate-200 py-3 px-4 font-mono text-right">{(item.quantity * price).toFixed(2)}</td>
                                  <td className={`border border-slate-200 py-3 px-4 font-mono text-right ${diffClass}`}>
                                    <button
                                      type="button"
                                      onClick={(e) => openCompareDrawer('deviation', item, bidder, price, e)}
                                      className="w-full text-right hover:underline"
                                    >
                                      {diffPercent >= 0 ? '+' : ''}{diffPercent.toFixed(1)}%
                                    </button>
                                  </td>
                                </React.Fragment>
                              );
                            })}
                            <td className="border border-slate-200 py-3 px-4 bg-blue-50/30 font-mono text-right">{item.quantity}</td>
                            <td className="border border-slate-200 py-3 px-4 font-mono text-right">
                              <button
                                type="button"
                                onClick={(e) => openCompareDrawer('price', item, benchmarkBidder, item.bidders[benchmarkBidder], e)}
                                className="w-full text-right hover:underline text-blue-600"
                              >
                                {item.bidders[benchmarkBidder].toFixed(2)}
                              </button>
                            </td>
                            <td className="border border-slate-200 py-3 px-4 font-mono text-right">
                              {(item.quantity * item.bidders[benchmarkBidder]).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'unitCompare' && (
                <div className="space-y-4">
                  {/* 顶部操作区 */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="text-sm text-slate-500">
                      各投标单位及标底的单方造价对比分析，可手动修改建筑面积重新计算单方造价
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center space-x-1">
                        <Icon name="Download" size={14} />
                        <span>导出报表</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* 对比表格 */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse border border-slate-200 min-w-[1200px]">
                      <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold">
                        <tr>
                          <th className="border border-slate-200 py-3 px-2 w-16" rowSpan={2}>序号</th>
                          <th className="border border-slate-200 py-3 px-4 min-w-[200px]" rowSpan={2}>项目名称</th>
                          <th className="border border-slate-200 py-3 px-4 w-32" rowSpan={2}>建筑面积<br/>(m2)</th>
                          <th className="border border-slate-200 py-2 px-4" colSpan={2}>标底</th>
                          {Object.keys(unitCompareData[0]?.bidders || {}).map(bidder => (
                            <th key={bidder} className="border border-slate-200 py-2 px-4" colSpan={2}>{bidder}</th>
                          ))}
                        </tr>
                        <tr className="bg-slate-50 text-[12px] text-slate-600 font-medium">
                          <th className="border border-slate-200 py-2 px-4 font-normal">不含税金额<br/>(元)</th>
                          <th className="border border-slate-200 py-2 px-4 font-normal text-emerald-600">单方<br/>(元/㎡)</th>
                          {Object.keys(unitCompareData[0]?.bidders || {}).map(bidder => (
                            <React.Fragment key={bidder}>
                              <th className="border border-slate-200 py-2 px-4 font-normal">不含税金额<br/>(元)</th>
                              <th className="border border-slate-200 py-2 px-4 font-normal text-blue-700">单方<br/>(元/㎡)</th>
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm text-slate-600 bg-white">
                        {unitCompareData.map((item) => (
                          <tr key={item.id} className={`hover:bg-blue-50/30 transition-colors ${item.level === 0 ? 'bg-slate-50/50 font-medium text-slate-800' : ''}`}>
                            <td className="border border-slate-200 py-2 px-2">{item.index}</td>
                            <td className={`border border-slate-200 py-2 px-4 text-left ${item.level > 0 ? 'pl-8' : ''}`}>{item.name}</td>
                            <td className="border border-slate-200 py-1 px-2">
                              {item.index === '四' ? (
                                <span className="text-slate-400">-</span>
                              ) : (
                                <input 
                                  type="number" 
                                  value={item.area || ''} 
                                  onChange={(e) => handleUnitCompareAreaChange(item.id, e.target.value)}
                                  className="w-full h-8 px-2 text-center border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded bg-transparent focus:bg-white outline-none transition-all font-mono text-blue-600 font-medium"
                                  placeholder="输入面积"
                                />
                              )}
                            </td>
                            <td className="border border-slate-200 py-2 px-4 font-mono text-right">{item.standard.toFixed(2)}</td>
                            <td className="border border-slate-200 py-2 px-4 font-mono text-right text-emerald-600 font-medium bg-emerald-50/30">
                              {item.index === '四' 
                                ? getCalculatedTotalUnitCost(true)
                                : (item.area > 0 ? (item.standard / item.area).toFixed(2) : '-')}
                            </td>
                            {(Object.entries(item.bidders) as Array<[string, number]>).map(([bidder, amount]) => (
                              <React.Fragment key={bidder}>
                                <td className="border border-slate-200 py-2 px-4 font-mono text-right">{amount.toFixed(2)}</td>
                                <td className="border border-slate-200 py-2 px-4 font-mono text-right text-blue-600 font-medium bg-blue-50/30">
                                  {item.index === '四'
                                    ? getCalculatedTotalUnitCost(false, bidder)
                                    : (item.area > 0 ? (amount / item.area).toFixed(2) : '-')}
                                </td>
                              </React.Fragment>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab !== 'summary' && activeTab !== 'compliance' && activeTab !== 'unbalanced' && activeTab !== 'compare' && activeTab !== 'unitCompare' && activeTab !== 'arithmetic' && activeTab !== 'collusion' && (
                <div className="py-12 text-center text-slate-500 text-sm border border-slate-200 rounded">
                  {TABS.find(t => t.id === activeTab)?.label} 详细数据加载中...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 抽屉：问题明细 */}
      {problemDetailDrawer.visible && (
        <div id="bottom-drawer" className="absolute inset-x-0 bottom-0 z-[190] bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-slate-200 h-[60vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              {problemDetailDrawer.view === 'breakdown' && (
                <button 
                  onClick={() => setProblemDetailDrawer(prev => ({ ...prev, view: 'list', selectedItem: undefined }))}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <Icon name="ArrowLeft" size={18} />
                </button>
              )}
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-800">
                  {problemDetailDrawer.view === 'breakdown' ? '单价明细对比' : `${problemDetailDrawer.title}明细`}
                </h3>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {problemDetailDrawer.view === 'breakdown'
                    ? `${problemDetailDrawer.selectedItem?.code} ${problemDetailDrawer.selectedItem?.name}`
                    : problemDetailDrawer.type === 'samePrice' 
                      ? `涉及单位：${problemDetailDrawer.samePriceBidders?.join('、')}`
                      : `投标单位：${problemDetailDrawer.bidder}`
                  }
                </p>
              </div>
            </div>
            <button onClick={closeProblemDetailDrawer} className="text-slate-400 hover:text-slate-600 transition-colors">
              <Icon name="X" size={18} />
            </button>
          </div>
          <div className="p-6 overflow-auto flex-1 bg-slate-50/50">
            {problemDetailDrawer.view === 'breakdown' ? (
              <table className="w-full text-center border-collapse border border-slate-200 bg-white">
                <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="border border-slate-200 py-3 px-3 w-32">费用名称</th>
                    {problemDetailDrawer.samePriceBidders?.map(bidder => (
                      <th key={bidder} className="border border-slate-200 py-3 px-3 w-48 text-right pr-14">{bidder}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {priceBreakdownRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors bg-white">
                      <td className="border border-slate-200 py-2 px-3 text-slate-600">{row.label}</td>
                      {problemDetailDrawer.samePriceBidders?.map(bidder => {
                        const actualBidderPrice = problemDetailDrawer.selectedItem?.bidders?.[bidder] || 0;
                        return (
                          <td key={bidder} className="border border-slate-200 py-2 px-3">
                            <div className="flex items-center justify-end space-x-2">
                              <span className="font-mono">{(actualBidderPrice * row.ratio).toFixed(2)}</span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 w-10 justify-center">
                                {(row.ratio * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-medium text-slate-800">
                    <td className="border border-slate-200 py-3 px-3 whitespace-nowrap">综合单价</td>
                    {problemDetailDrawer.samePriceBidders?.map(bidder => {
                       const finalPrice = problemDetailDrawer.selectedItem?.bidders?.[bidder] || 0;
                       return (
                         <td key={bidder} className="border border-slate-200 py-3 px-3 text-right font-mono pr-14">
                           {finalPrice.toFixed(2)}
                         </td>
                       )
                    })}
                  </tr>
                </tbody>
              </table>
            ) : problemDetailDrawer.type === 'samePrice' || problemDetailDrawer.type === 'unbalanced' ? (
              <table className="w-full text-center border-collapse border border-slate-200 bg-white">
                <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold sticky top-0 shadow-sm z-10">
                  <tr>
                    {selectedHeaders.includes('序号') && <th className="border border-slate-200 py-3 px-4 w-16 bg-slate-100 text-slate-700" rowSpan={2}>序号</th>}
                    {selectedHeaders.includes('项目编码') && <th className="border border-slate-200 py-3 px-4 w-32 bg-slate-100 text-slate-700" rowSpan={2}>项目编码</th>}
                    {selectedHeaders.includes('名称') && <th className="border border-slate-200 py-3 px-4 text-left w-48 bg-slate-100 text-slate-700" rowSpan={2}>名称</th>}
                    {selectedHeaders.includes('项目特征') && <th className="border border-slate-200 py-3 px-4 text-left min-w-[200px] bg-slate-100 text-slate-700" rowSpan={2}>项目特征</th>}
                    {selectedHeaders.includes('单位') && <th className="border border-slate-200 py-3 px-4 w-16 bg-slate-100 text-slate-700" rowSpan={2}>单位</th>}
                    {selectedHeaders.includes('工程量') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>工程量</th>}
                    {selectedHeaders.includes('单价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>单价</th>}
                    {selectedHeaders.includes('合价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>合价</th>}
                    {selectedHeaders.includes('综合单价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>综合单价</th>}
                    {selectedHeaders.includes('暂估价') && <th className="border border-slate-200 py-3 px-4 w-24 bg-slate-100 text-slate-700" rowSpan={2}>暂估价</th>}
                    {selectedHeaders.includes('备注') && <th className="border border-slate-200 py-3 px-4 bg-slate-100 text-slate-700" rowSpan={2}>备注</th>}
                    
                    {/* 单价相同相似检查隐藏标底列，其他检查展示 */}
                    {problemDetailDrawer.type !== 'samePrice' && (
                      <th className="border border-slate-200 py-2 px-4 w-24 bg-slate-50 text-slate-700">
                        {problemDetailDrawer.type === 'unbalanced' 
                          ? (unbalancedSettings.quoteType === 'controlPrice' ? '控制价' : 
                             unbalancedSettings.quoteType === 'bidAvg' ? '投标均价' : 
                             unbalancedSettings.quoteType === 'bidLowest' ? '投标最低价' : '去极值均价')
                          : '标底'}
                      </th>
                    )}
                    
                    {problemDetailDrawer.type === 'samePrice' && problemDetailDrawer.samePriceBidders?.map(bidder => (
                      <th key={bidder} className="border border-slate-200 py-2 px-4 w-32 bg-slate-50 text-slate-700">{bidder}</th>
                    ))}
                    
                    {problemDetailDrawer.type === 'unbalanced' && (
                      <th className="border border-slate-200 py-2 px-4 w-32 bg-slate-50 text-slate-700">{problemDetailDrawer.bidder}</th>
                    )}

                    {/* 如果是规律性错误检查，新增一列差额列 */}
                    {problemDetailDrawer.isRegularError && problemDetailDrawer.samePriceBidders && problemDetailDrawer.samePriceBidders.length === 2 && (
                       <th className="border border-slate-200 py-2 px-4 w-24 bg-slate-50 text-slate-700" rowSpan={2}>差额</th>
                    )}
                    
                    {/* 不平衡报价检查偏差列 */}
                    {problemDetailDrawer.type === 'unbalanced' && (
                      <th className="border border-slate-200 py-2 px-4 w-24 bg-slate-50 text-slate-700 whitespace-nowrap">偏差百分比</th>
                    )}
                  </tr>
                  <tr className="bg-slate-50 text-[12px] text-slate-600">
                    {/* 单价相同相似检查隐藏标底列，其他检查展示 */}
                    {problemDetailDrawer.type !== 'samePrice' && (
                      <th className="border border-slate-200 py-2 px-4 font-normal whitespace-nowrap">单价</th>
                    )}
                    
                    {problemDetailDrawer.type === 'samePrice' && problemDetailDrawer.samePriceBidders?.map(bidder => (
                      <th key={bidder} className="border border-slate-200 py-2 px-4 font-normal whitespace-nowrap">单价</th>
                    ))}
                    
                    {problemDetailDrawer.type === 'unbalanced' && (
                      <th className="border border-slate-200 py-2 px-4 font-normal whitespace-nowrap">单价</th>
                    )}
                    
                    {problemDetailDrawer.type === 'unbalanced' && (
                      <th className="border border-slate-200 py-2 px-4 font-normal whitespace-nowrap">单价偏差</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {MOCK_COMPARE_DATA.map((item, idx) => {
                    // 为了演示规律性错误，如果是这个检查，强行让价格差额等于10
                    let displayItem = { ...item };
                    if (problemDetailDrawer.isRegularError && problemDetailDrawer.samePriceBidders && problemDetailDrawer.samePriceBidders.length === 2) {
                       const b1 = problemDetailDrawer.samePriceBidders[0];
                       const b2 = problemDetailDrawer.samePriceBidders[1];
                       // 基于该项的标底价，模拟其中一家相差10元
                       const basePrice = item.controlPrice || 20; 
                       displayItem = {
                         ...item,
                         bidders: {
                           ...item.bidders,
                           [b1]: basePrice + 10,
                           [b2]: basePrice
                         }
                       }
                    }

                    // 计算基准价（根据不平衡报价参数设置）
                    let basePrice = displayItem.controlPrice;
                    if (problemDetailDrawer.type === 'unbalanced' && displayItem.bidders) {
                      const prices = Object.values(displayItem.bidders);
                      if (prices.length > 0) {
                        if (unbalancedSettings.quoteType === 'bidAvg') {
                          basePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
                        } else if (unbalancedSettings.quoteType === 'bidLowest') {
                          basePrice = Math.min(...prices);
                        } else if (unbalancedSettings.quoteType === 'bidHighestLowestAvg') {
                          if (prices.length > 2) {
                            const sorted = [...prices].sort((a, b) => a - b);
                            const trimmed = sorted.slice(1, -1);
                            basePrice = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
                          } else {
                            basePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
                          }
                        }
                      }
                    }

                    // 不平衡报价时获取对应投标单位的单价和偏差
                    const unbalancedBidderPrice = problemDetailDrawer.type === 'unbalanced' 
                      ? ((displayItem.bidders as Record<string, number>)[problemDetailDrawer.bidder] || displayItem.controlPrice * (1 + (Math.random() * 0.4 - 0.2))) // 随机模拟一个偏差
                      : 0;
                    const unbalancedDiffPercent = ((unbalancedBidderPrice - basePrice) / basePrice) * 100;
                    const floatRange = parseFloat(unbalancedSettings.floatRange) || 15;
                    const isExceeding = Math.abs(unbalancedDiffPercent) > floatRange;
                    const diffClass = unbalancedDiffPercent >= 0 ? 'text-red-500' : 'text-blue-600';

                    return (
                    <tr key={idx} className={`hover:bg-blue-50/30 transition-colors ${problemDetailDrawer.type === 'unbalanced' && isExceeding ? 'bg-red-50/20' : ''}`}>
                      {selectedHeaders.includes('序号') && <td className="border border-slate-200 py-3 px-4 text-slate-500">{idx + 1}</td>}
                      {selectedHeaders.includes('项目编码') && <td className="border border-slate-200 py-3 px-4 text-slate-500 font-mono">{displayItem.code}</td>}
                      {selectedHeaders.includes('名称') && <td className="border border-slate-200 py-3 px-4 text-left font-medium text-slate-800">{displayItem.name}</td>}
                      {selectedHeaders.includes('项目特征') && <td className="border border-slate-200 py-3 px-4 text-left text-slate-600 text-xs leading-relaxed">{displayItem.feature}</td>}
                      {selectedHeaders.includes('单位') && <td className="border border-slate-200 py-3 px-4 text-slate-600">{displayItem.unit}</td>}
                      {selectedHeaders.includes('工程量') && <td className="border border-slate-200 py-3 px-4 font-mono">{displayItem.quantity}</td>}
                      {selectedHeaders.includes('单价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                      {selectedHeaders.includes('合价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                      {selectedHeaders.includes('综合单价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                      {selectedHeaders.includes('暂估价') && <td className="border border-slate-200 py-3 px-4 font-mono text-right">-</td>}
                      {selectedHeaders.includes('备注') && <td className="border border-slate-200 py-3 px-4 text-left">-</td>}
                      
                      {/* 单价相同相似检查隐藏标底数据列，其他检查展示 */}
                      {problemDetailDrawer.type !== 'samePrice' && (
                        <td className="border border-slate-200 py-3 px-4 font-mono text-slate-500">
                          {problemDetailDrawer.type === 'unbalanced' ? (
                            basePrice.toFixed(2)
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                setCurrentStep(3);
                                setActiveTab('compare');
                                closeProblemDetailDrawer();
                                openCompareDrawer('price', displayItem, '标底', basePrice, e, problemDetailDrawer.samePriceBidders);
                              }}
                              className="w-full text-right hover:underline text-blue-600"
                            >
                              {basePrice.toFixed(2)}
                            </button>
                          )}
                        </td>
                      )}
                      
                      {problemDetailDrawer.type === 'samePrice' && problemDetailDrawer.samePriceBidders?.map(bidder => {
                        const price = (displayItem.bidders as Record<string, number>)[bidder] || displayItem.controlPrice;
                        return (
                          <td key={bidder} className="border border-slate-200 py-3 px-4 font-mono text-red-500 font-medium">
                            <button
                              type="button"
                              onClick={(e) => {
                                setProblemDetailDrawer(prev => ({
                                  ...prev,
                                  view: 'breakdown',
                                  selectedItem: displayItem
                                }));
                              }}
                              className="w-full text-right hover:underline text-blue-600"
                            >
                              {price.toFixed(2)}
                            </button>
                          </td>
                        );
                      })}
                      
                      {problemDetailDrawer.type === 'unbalanced' && (
                        <td className="border border-slate-200 py-3 px-4 font-mono font-medium">
                          <span className={Math.abs(unbalancedDiffPercent) > floatRange ? 'text-red-500' : 'text-slate-700'}>
                            {unbalancedBidderPrice.toFixed(2)}
                          </span>
                        </td>
                      )}

                      {problemDetailDrawer.isRegularError && problemDetailDrawer.samePriceBidders && problemDetailDrawer.samePriceBidders.length === 2 && (
                         <td className="border border-slate-200 py-3 px-4 font-mono text-red-500 font-medium bg-red-100/50">
                           {((displayItem.bidders as Record<string, number>)[problemDetailDrawer.samePriceBidders[0]] - (displayItem.bidders as Record<string, number>)[problemDetailDrawer.samePriceBidders[1]]).toFixed(2)}
                         </td>
                      )}
                      
                      {problemDetailDrawer.type === 'unbalanced' && (
                        <td className={`border border-slate-200 py-3 px-4 font-mono font-medium ${diffClass} ${isExceeding ? 'bg-red-50' : ''}`}>
                          <span>
                            {unbalancedDiffPercent >= 0 ? '+' : ''}{unbalancedDiffPercent.toFixed(1)}%
                          </span>
                        </td>
                      )}
                    </tr>
                  )})}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-center border-collapse border border-slate-200 bg-white">
                <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold sticky top-0 shadow-sm">
                  <tr>
                    <th className="border border-slate-200 py-3 px-4 w-16">序号</th>
                    <th className="border border-slate-200 py-3 px-4 min-w-[200px]">文件名称</th>
                    <th className="border border-slate-200 py-3 px-4 w-48">页签名称</th>
                    <th className="border border-slate-200 py-3 px-4 text-left">问题说明</th>
                    <th className="border border-slate-200 py-3 px-4 w-24">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {/* 模拟几条明细数据 */}
                  {[1, 2, 3].map((idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="border border-slate-200 py-3 px-4 text-slate-500">{idx}</td>
                      <td className="border border-slate-200 py-3 px-4 text-slate-800">宁波住宅项目施工总承包工程.xml</td>
                      <td className="border border-slate-200 py-3 px-4 text-slate-600">
                        {idx === 1 ? '分部分项工程和单价措施项目清单与计价表' : '-'}
                      </td>
                      <td className="border border-slate-200 py-3 px-4 text-left text-slate-600">
                        <span className="text-red-500 mr-1">异常:</span>
                        项目编码 010101001001 对应数量与招标控制价不一致。
                      </td>
                      <td className="border border-slate-200 py-3 px-4">
                        <button 
                          onClick={() => {
                            const problemDescription = "项目编码 010101001001 对应数量与招标控制价不一致。";
                            const tabs = idx === 1 
                              ? ['宁波住宅项目施工总承包工程.xml', '宁波住宅项目补充文件.xml'] 
                              : ['宁波住宅项目施工总承包工程.xml'];
                            openFilePreview(problemDescription, tabs);
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          查看
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 抽屉：单价明细 / 偏差原因分析 */}
      {compareDrawerData.visible && (
        <div id="bottom-drawer" className="absolute inset-x-0 bottom-0 z-[190] bg-white rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] border-t border-slate-200 max-h-[70vh] flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-800">
                {compareDrawerData.view === 'price' ? '单价明细' : '偏差原因分析'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {compareDrawerData.itemCode} / {compareDrawerData.itemName} / {compareDrawerData.bidder}
              </p>
            </div>
            <button onClick={closeCompareDrawer} className="text-slate-400 hover:text-slate-600 transition-colors">
              <Icon name="X" size={18} />
            </button>
          </div>
          <div className="p-6 overflow-auto flex-1">
            {compareDrawerData.view === 'price' ? (
              <div className="space-y-4 w-full overflow-x-auto">
                <table className="w-full text-center border-collapse border border-slate-200 min-w-[600px]">
                  <thead className="bg-slate-50 text-[13px] text-slate-700 font-semibold sticky top-0">
                    <tr>
                      <th className="border border-slate-200 py-2 px-3 whitespace-nowrap bg-slate-50">费用构成</th>
                      <th className="border border-slate-200 py-2 px-3 whitespace-nowrap bg-slate-50">标底</th>
                      {/* 这里假设默认展示3家投标单位的数据对比，如果没有传入则默认用所有单位名 */}
                      {(compareDrawerData.samePriceBidders || compareBidderKeys.slice(0, 3)).map(bidder => (
                        <th key={bidder} className="border border-slate-200 py-2 px-3 whitespace-nowrap bg-slate-50">{bidder}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-600">
                    {priceBreakdownRows.map((row) => (
                      <tr key={row.label} className="hover:bg-slate-50/70 transition-colors">
                        <td className="border border-slate-200 py-2 px-3 font-medium text-slate-700 whitespace-nowrap">{row.label}</td>
                        <td className="border border-slate-200 py-2 px-3">
                          <div className="flex items-center justify-end space-x-2">
                            <span className="font-mono">{(compareDrawerData.controlPrice * row.ratio).toFixed(2)}</span>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 w-10 justify-center">
                              {(row.ratio * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        {(compareDrawerData.samePriceBidders || compareBidderKeys.slice(0, 3)).map(bidder => {
                          // 使用传入的biddersPrices以保证价格一致，否则使用当前bidderPrice做基础浮动
                          const actualBidderPrice = compareDrawerData.biddersPrices?.[bidder] ?? (compareDrawerData.bidderPrice * (1 + (Math.random() * 0.1 - 0.05)));
                          return (
                            <td key={bidder} className="border border-slate-200 py-2 px-3">
                              <div className="flex items-center justify-end space-x-2">
                                <span className="font-mono">{(actualBidderPrice * row.ratio).toFixed(2)}</span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 w-10 justify-center">
                                  {(row.ratio * 100).toFixed(0)}%
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    <tr className="bg-slate-50 font-medium text-slate-800">
                      <td className="border border-slate-200 py-3 px-3 whitespace-nowrap">综合单价</td>
                      <td className="border border-slate-200 py-3 px-3 text-right font-mono pr-14">{compareDrawerData.controlPrice.toFixed(2)}</td>
                      {(compareDrawerData.samePriceBidders || compareBidderKeys.slice(0, 3)).map((bidder, idx) => {
                         const finalPrice = compareDrawerData.biddersPrices?.[bidder] ?? (idx === 0 ? compareDrawerData.bidderPrice : compareDrawerData.bidderPrice * (1 + (idx * 0.05)));
                         return (
                           <td key={bidder} className="border border-slate-200 py-3 px-3 text-right font-mono pr-14">
                             {finalPrice.toFixed(2)}
                           </td>
                         )
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
                    <div className="text-slate-500 text-xs">控制价</div>
                    <div className="font-mono text-slate-800 mt-1">{compareDrawerData.controlPrice.toFixed(2)}</div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
                    <div className="text-slate-500 text-xs">投标单价</div>
                    <div className="font-mono text-slate-800 mt-1">{compareDrawerData.bidderPrice.toFixed(2)}</div>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60">
                    <div className="text-slate-500 text-xs">偏差百分比</div>
                    <div className={`font-mono mt-1 ${compareDrawerData.diffPercent >= 0 ? 'text-red-500' : 'text-blue-600'}`}>
                      {compareDrawerData.diffPercent >= 0 ? '+' : ''}{compareDrawerData.diffPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                  <div className="font-medium text-slate-800">原因分析</div>
                  <div className="text-slate-600">1. 主要材料价格波动导致单价偏离基准区间。</div>
                  <div className="text-slate-600">2. 施工组织方案差异造成人工与机械投入不同。</div>
                  <div className="text-slate-600">3. 企业管理费率与风险计取策略存在差异。</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 表头设置弹窗 */}
      {showHeaderSettingsModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-[600px] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">表头设置</h3>
              <button onClick={() => setShowHeaderSettingsModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <Icon name="X" size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-sm text-slate-600 mb-6">请手动选择或确认原文件识别出来的前几列表头项。若存在识别错误、漏识别或多识别，可在此调整。</div>
              <div className="grid grid-cols-3 gap-4">
                {availableHeaders.map(header => (
                  <label key={header} className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedHeaders.includes(header)}
                      onChange={() => toggleHeader(header)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
                    />
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm text-slate-700">{header}</span>
                      {defaultAIHeaders.includes(header) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200/50">
                          AI识别
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50 space-x-3">
              <button 
                onClick={() => setShowHeaderSettingsModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => setShowHeaderSettingsModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                确定
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 参数设置弹窗 */}
      {showSettingsModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-[600px] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-800">不平衡报价设置</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <Icon name="X" size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="text-sm text-slate-600 mb-6">设置基准的超出比例阈值，超出部分将被认定为不平衡报价</div>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">报价类型</label>
                  <div className="relative">
                    <select 
                      value={unbalancedSettings.quoteType}
                      onChange={(e) => setUnbalancedSettings(prev => ({ ...prev, quoteType: e.target.value }))}
                      className="w-full h-10 px-3 pr-10 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm appearance-none bg-white"
                    >
                      <option value="controlPrice">控制价</option>
                      <option value="bidAvg">投标均价</option>
                      <option value="bidLowest">投标最低价</option>
                      <option value="bidHighestLowestAvg">投标均价-移除最高价最低价</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                      <Icon name="ChevronDown" size={16} />
                    </div>
                  </div>
                </div>
                <div className="w-48">
                  <label className="block text-sm font-medium text-slate-700 mb-2">浮动金额区间 (%)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 text-sm">±</span>
                    <input 
                      type="number" 
                      value={unbalancedSettings.floatRange} 
                      onChange={(e) => setUnbalancedSettings(prev => ({ ...prev, floatRange: e.target.value }))} 
                      className="w-full h-10 pl-8 pr-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm" 
                      placeholder="例如: 15" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50 space-x-3">
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                确定
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 原文件预览弹窗 */}
      {filePreviewData.visible && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[90vw] h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={20} className="text-amber-500" />
                <h3 className="text-lg font-bold text-slate-800">{filePreviewData.problemDescription}</h3>
              </div>
              <button onClick={closeFilePreview} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200">
                <Icon name="X" size={20} />
              </button>
            </div>
            
            {/* Tabs */}
            {filePreviewData.tabs.length > 1 && (
              <div className="flex bg-slate-50 border-b border-slate-200 px-4 pt-2 shrink-0 overflow-x-auto hide-scrollbar">
                {filePreviewData.tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilePreviewData(prev => ({ ...prev, activeTab: tab }))}
                    className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
                      filePreviewData.activeTab === tab 
                        ? 'bg-white text-blue-600 border border-slate-200 border-b-white relative top-[1px]' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                  >
                    <Icon name="FileText" size={14} className={filePreviewData.activeTab === tab ? 'text-blue-600' : 'text-slate-400'} />
                    <span>{tab}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Content (Mock Spreadsheet View) */}
            <div className="flex-1 bg-white overflow-auto p-6">
              <div className="border border-slate-200 rounded-lg h-full flex flex-col overflow-hidden">
                <div className="bg-slate-100 border-b border-slate-200 p-2 text-sm font-medium text-slate-700 flex items-center space-x-2">
                  <Icon name="Table" size={16} className="text-slate-500" />
                  <span>{filePreviewData.activeTab || '预览内容'}</span>
                </div>
                <div className="flex-1 p-4 flex items-center justify-center bg-slate-50/50">
                  <div className="text-center space-y-3">
                    <Icon name="FileSearch" size={48} className="mx-auto text-slate-300" />
                    <p className="text-slate-600 font-medium">正在预览原文件数据</p>
                    <p className="text-sm text-slate-400 max-w-md mx-auto">
                      当前文件: {filePreviewData.activeTab} <br/>
                      此处将展示解析后的电子表格或清单详细数据，并高亮显示与问题相关的内容
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default RebiddingCheckResultView;
