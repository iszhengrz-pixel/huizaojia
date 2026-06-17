import { MenuItem, ToolItem } from './types';

export const NAVIGATION_MENU: MenuItem[] = [
  { id: 'home', label: '首页', icon: 'Home' },
  { 
    id: 'quantity', 
    label: '汇计量', 
    icon: 'Ruler',
    children: [
      { id: 'ai-vision', label: 'AI识图算量', parentId: 'quantity' },
      { id: 'document-extraction', label: '文档识别提取', parentId: 'quantity' },
      { id: 'ai-cad', label: 'AI批量提取CAD表', parentId: 'quantity' },
      { id: 'home-calc', label: '家装计算器', parentId: 'quantity' },
      { id: 'list-compare', label: '清单工程量超额调差对比', parentId: 'quantity' },
      { id: 'formula', label: '公式大全', parentId: 'quantity' },
      { id: 'hardware-calc', label: '五金计算器', parentId: 'quantity' },
    ]
  },
  { 
    id: 'pricing', 
    label: '汇计价', 
    icon: 'Settings2',
    children: [
      { id: 'material-diff', label: '智能调差', parentId: 'pricing' },
      { id: 'fee-standards', label: '收费标准库', parentId: 'pricing' },
      { id: 'ai-plant-list', label: 'AI苗木清单', parentId: 'pricing' },
      { id: 'one-vs-one-compare', label: '1V1文件对比', parentId: 'pricing' },
      { id: 'list-optimization', label: '清单优算', parentId: 'pricing' },
      { id: 'rebidding-analysis', label: '回标分析', parentId: 'pricing' },
    ]
  },
  { 
    id: 'general', 
    label: '汇通用', 
    icon: 'Calculator',
    children: [
      { id: 'ok-date-calc', label: '日期计算器', parentId: 'general' },
      { id: 'duration-quota', label: '工期定额', parentId: 'general' },
      { id: 'fee-calc', label: '收费计算器', parentId: 'general' },
      { id: 'smart-cad', label: '智能CAD', parentId: 'general' },
      { id: 'amount-converter', label: '金额大小写转换', parentId: 'general' },
      { id: 'ok-tax-calc', label: '税费计算', parentId: 'general' },
    ]
  },
  { 
    id: 'library', 
    label: '汇文库', 
    icon: 'BookMarked',
    children: [
      { id: 'lib-list', label: '清单文库', parentId: 'library' },
      { id: 'lib-quota', label: '定额文库', parentId: 'library' },
      { id: 'lib-exam', label: '真题文库', parentId: 'library' },
    ]
  },
  { 
    id: 'settings', 
    label: '系统设置', 
    icon: 'UserCog',
    children: [
      { id: 'user-management', label: '用户管理', parentId: 'settings' },
      { id: 'role-management', label: '角色管理', parentId: 'settings' },
      { id: 'menu-management', label: '菜单管理', parentId: 'settings' },
      { id: 'points', label: '我的积分', parentId: 'settings' },
      { id: 'profile', label: '个人中心', parentId: 'settings' },
    ]
  },
];

export interface ToolCategory {
  category: string;
  tools: ToolItem[];
}

export const ALL_TOOLS_CATEGORIZED: ToolCategory[] = [
  {
    category: '汇计量',
    tools: [
      { 
        id: 'ai-vision', 
        name: 'AI识图算量', 
        icon: 'ScanSearch', 
        category: '汇计量', 
        parentId: 'quantity',
        isHot: true,
        pricingType: 'paid',
        isActivated: true,
        description: '高精度图形识别，秒级导出工程量',
      },
      { 
        id: 'ai-cad', 
        name: 'AI批量提取CAD表', 
        icon: 'Layers', 
        category: '汇计量', 
        parentId: 'quantity', 
        isHot: true, 
        pricingType: 'paid', 
        isActivated: false,
      },
      {
        id: 'document-extraction',
        name: '文档识别提取',
        icon: 'FileSearch',
        category: '汇计量',
        parentId: 'quantity',
        pricingType: 'paid',
        isActivated: true,
        description: '识别并提取文档中的表格与关键信息',
      },
      { 
        id: 'home-calc', 
        name: '家装计算器', 
        icon: 'Home', 
        category: '汇计量', 
        parentId: 'quantity',
        isHot: true, 
        description: '墙砖、地砖、窗帘、地板、涂料专项计算',
      },
      { id: 'list-compare', name: '清单工程量超额调差对比', icon: 'ArrowLeftRight', category: '汇计量', parentId: 'quantity', pricingType: 'paid', isActivated: true, description: '多版本工程量精准对比与超额预警' },
      { id: 'formula', name: '公式大全', icon: 'FunctionSquare', category: '汇计量', parentId: 'quantity', pricingType: 'free' },
      { id: 'hardware-calc', name: '五金计算器', icon: 'Anvil', category: '汇计量', parentId: 'quantity', pricingType: 'free' },
    ]
  },
  {
    category: '汇计价',
    tools: [
      { id: 'material-diff', name: '智能调差', icon: 'TrendingUp', category: '汇计价', parentId: 'pricing' },
      { id: 'fee-standards', name: '收费标准库', icon: 'LibraryBig', category: '汇计价', parentId: 'pricing' },
      { id: 'ai-plant-list', name: 'AI苗木清单', icon: 'Sprout', category: '汇计价', parentId: 'pricing' },
      { id: 'ok-contract', name: '相同清单量价一致性对比', icon: 'FileDiff', category: '汇计价', parentId: 'pricing', isHot: true, description: '智能对比相同清单的单价/工程量差异，快速统计相同清单工程量' },
      { id: 'material-price-consistency', name: '相同材料单价一致性对比', icon: 'Scale', category: '汇计价', parentId: 'pricing', description: '智能对比相同材料的单价差异，快速定位偏差' },
      { id: 'rebidding-analysis', name: '回标分析', icon: 'BarChartHorizontal', category: '汇计价', parentId: 'pricing', description: '全方位回标数据深度解析，自动识别不平衡报价与异常波动' },
      { id: 'one-vs-one-compare', name: '1V1对比（暂存）', icon: 'Copy', category: '汇计价', parentId: 'pricing', description: '单对单文件级精细化对比与暂存管理' },
      { id: 'price-file-compare', name: '计价文件对比', icon: 'Files', category: '汇计价', parentId: 'pricing', description: '两版计价文件量价差异分析，适用预结算审核、对账前后版本对比，生成核增减说明' },
      { id: 'price-file-compare-2', name: '计价分析报告', icon: 'FileText', category: '汇计价', parentId: 'pricing', description: '两版计价文件量价差异分析，适用预结算审核、对账前后版本对比，生成核增减说明' },
    ]
  },
  {
    category: '汇通用',
    tools: [
      { id: 'ok-date-calc', name: '日期计算器', icon: 'CalendarDays', category: '汇通用', parentId: 'general' },
      { id: 'duration-quota', name: '工期定额', icon: 'Clock', category: '汇通用', parentId: 'general' },
      { id: 'fee-calc', name: '收费计算器', icon: 'Wallet', category: '汇通用', parentId: 'general' },
      { id: 'smart-cad', name: '智能CAD', icon: 'PencilLine', category: '汇通用', parentId: 'general', description: 'CAD智能看图、AI图纸对比及格式转换', isHot: true },
      { id: 'amount-converter', name: '金额大小写转换', icon: 'Coins', category: '汇通用', parentId: 'general' },
      { id: 'ok-tax-calc', name: '税费计算', icon: 'Calculator', category: '汇通用', parentId: 'general' },
    ]
  }
];

export const ALL_TOOLS: ToolItem[] = ALL_TOOLS_CATEGORIZED.flatMap(cat => cat.tools);

export const DEFAULT_HOT_TOOLS: string[] = ['ai-vision', 'ai-cad', 'home-calc', 'ok-contract', 'formula'];
export const DEFAULT_MY_TOOLS: string[] = ['ai-vision', 'home-calc', 'formula', 'ok-contract', 'material-diff', 'one-vs-one-compare', 'smart-cad'];
