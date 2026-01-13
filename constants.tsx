
import { MenuItem, ToolItem } from './types';

export const NAVIGATION_MENU: MenuItem[] = [
  { id: 'home', label: '汇造价', icon: 'LayoutGrid' },
  { 
    id: 'ai-qa', 
    label: 'AI问答', 
    icon: 'BrainCircuit',
    children: [
      { id: 'qa-2024-list', label: '2024清单', parentId: 'ai-qa' },
      { id: 'qa-quota', label: '定额', parentId: 'ai-qa' },
      { id: 'qa-indicators', label: '指标数据', parentId: 'ai-qa' },
      { id: 'qa-policy', label: '政策文件', parentId: 'ai-qa' },
    ]
  },
  { 
    id: 'quantity', 
    label: '汇计量', 
    icon: 'Ruler',
    children: [
      { id: 'ai-vision', label: 'AI识图算量', parentId: 'quantity' },
      { id: 'ai-cad', label: 'AI批量提取CAD表', parentId: 'quantity' },
      { id: 'list-compare', label: '清单工程量对比', parentId: 'quantity' },
      { id: 'calc-tool', label: '工程量计算器', parentId: 'quantity' },
      { id: 'formula', label: '公式大全', parentId: 'quantity' },
      { id: 'hardware-calc', label: '五金计算器', parentId: 'quantity' },
    ]
  },
  { 
    id: 'pricing', 
    label: '汇计价', 
    icon: 'Calculator',
    children: [
      { id: 'material-diff', label: '材料调差', parentId: 'pricing' },
      { id: 'fee-standards', label: '前后期收费标准库', parentId: 'pricing' },
      { id: 'ai-plant-list', label: 'AI苗木表编清单', parentId: 'pricing' },
      { id: 'ok-contract', label: 'ok合同价对比', parentId: 'pricing' },
      { id: 'price-file-compare', label: '计价文件对比', parentId: 'pricing' },
    ]
  },
  { 
    id: 'general', 
    label: '汇通用', 
    icon: 'Settings2',
    children: [
      { id: 'ok-date-calc', label: 'ok日期计算器', parentId: 'general' },
      { id: 'duration-quota', label: '工期定额', parentId: 'general' },
      { id: 'fee-calc', label: '收费计算器', parentId: 'general' },
      { id: 'excel-tools', label: '表格处理功能', parentId: 'general' },
      { id: 'ok-dwg-compare', label: 'okAI图纸对比', parentId: 'general' },
      { id: 'amount-converter', label: '金额大小写转换', parentId: 'general' },
      { id: 'ok-tax-calc', label: 'OK税费计算', parentId: 'general' },
      { id: 'simple-calc', label: '计算器', parentId: 'general' },
      { id: 'general-data', label: '通用数据', parentId: 'general' },
      { id: 'camera-watermark', label: '工程水印相机', parentId: 'general' },
    ]
  },
  { 
    id: 'settings', 
    label: '系统设置', 
    icon: 'UserCog',
    children: [
      { id: 'survey', label: '问卷功能', parentId: 'settings' },
      { id: 'register', label: '用户注册', parentId: 'settings' },
      { id: 'profile', label: '个人中心', parentId: 'settings' },
      { id: 'payment', label: '支付管理', parentId: 'settings' },
      { id: 'points', label: '积分管理', parentId: 'settings' },
      { id: 'legal', label: '法律条款', parentId: 'settings' },
      { id: 'customer-service', label: '客户服务', parentId: 'settings' },
    ]
  },
];

export const HOT_TOOLS: ToolItem[] = [
  { id: 'h1', name: '2024清单', icon: 'FileText', category: 'hot', isHot: true },
  { id: 'h2', name: '定额', icon: 'Database', category: 'hot', isHot: true },
  { id: 'h3', name: '指标数据', icon: 'BarChart3', category: 'hot', isHot: true },
  { id: 'h4', name: 'zc文件', icon: 'ScrollText', category: 'hot', isHot: true },
  { id: 'h5', name: 'AI文本统计', icon: 'FileJson', category: 'hot', isHot: true },
  { id: 'h6', name: 'AI识图算量', icon: 'ScanSearch', category: 'hot', isHot: true },
  { id: 'h7', name: 'AI批量提取CAD表', icon: 'Layers', category: 'hot', isHot: true },
];

export const MY_TOOLS: ToolItem[] = [
  { id: 'm1', name: '工程量计算器', icon: 'Divide', category: 'mine' },
  { id: 'm2', name: '公式大全', icon: 'FunctionSquare', category: 'mine' },
  { id: 'm3', name: '五金计算器', icon: 'Anvil', category: 'mine' },
  { id: 'm4', name: '材料调差', icon: 'TrendingUp', category: 'mine' },
  { id: 'm5', name: '前后期收费标准库', icon: 'LibraryBig', category: 'mine' },
  { id: 'm6', name: 'AI苗木表编清单', icon: 'Sprout', category: 'mine' },
  { id: 'm7', name: 'ok合同价对比', icon: 'FileDiff', category: 'mine' },
];
