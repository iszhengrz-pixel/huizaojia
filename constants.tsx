
import { MenuItem, ToolItem } from './types';

export const NAVIGATION_MENU: MenuItem[] = [
  { id: 'home', label: '汇造价', icon: 'LayoutGrid' },
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
      { id: 'ok-contract', label: '合同价对比', parentId: 'pricing' },
      { id: 'price-file-compare', label: '计价文件对比', parentId: 'pricing' },
    ]
  },
  { 
    id: 'general', 
    label: '汇通用', 
    icon: 'Settings2',
    children: [
      { id: 'ok-date-calc', label: '日期计算器', parentId: 'general' },
      { id: 'duration-quota', label: '工期定额', parentId: 'general' },
      { id: 'fee-calc', label: '收费计算器', parentId: 'general' },
      { id: 'excel-tools', label: '表格处理功能', parentId: 'general' },
      { id: 'ok-dwg-compare', label: 'AI图纸对比', parentId: 'general' },
      { id: 'amount-converter', label: '金额大小写转换', parentId: 'general' },
      { id: 'ok-tax-calc', label: '税费计算', parentId: 'general' },
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
      { id: 'user-management', label: '用户管理', parentId: 'settings' },
      { id: 'role-management', label: '角色管理', parentId: 'settings' },
      { id: 'menu-management', label: '菜单管理', parentId: 'settings' },
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
        isHot: true,
        pricingType: 'paid',
        isActivated: true,
        description: '高精度图形识别，秒级导出工程量',
      },
      { id: 'ai-cad', name: 'AI批量提取CAD表', icon: 'Layers', category: '汇计量', isHot: true, pricingType: 'paid', isActivated: false },
      { id: 'list-compare', name: '清单工程量对比', icon: 'ArrowLeftRight', category: '汇计量', pricingType: 'paid', isActivated: false },
      { id: 'calc-tool', name: '工程量计算器', icon: 'Divide', category: '汇计量', pricingType: 'paid', isActivated: true, description: '内置常用土木工程计算简图' },
      { id: 'formula', name: '公式大全', icon: 'FunctionSquare', category: '汇计量', pricingType: 'free' },
      { id: 'hardware-calc', name: '五金计算器', icon: 'Anvil', category: '汇计量', pricingType: 'free' },
    ]
  },
  {
    category: '汇计价',
    tools: [
      { id: 'material-diff', name: '材料调差', icon: 'TrendingUp', category: '汇计价' },
      { id: 'fee-standards', name: '前后期收费标准库', icon: 'LibraryBig', category: '汇计价' },
      { id: 'ai-plant-list', name: 'AI苗木表编清单', icon: 'Sprout', category: '汇计价' },
      { id: 'ok-contract', name: '合同价对比', icon: 'FileDiff', category: '汇计价', isHot: true },
      { id: 'price-file-compare', name: '计价文件对比', icon: 'Files', category: '汇计价' },
    ]
  },
  {
    category: '汇通用',
    tools: [
      { id: 'ok-date-calc', name: '日期计算器', icon: 'CalendarDays', category: '汇通用' },
      { id: 'duration-quota', name: '工期定额', icon: 'Clock', category: '汇通用' },
      { id: 'fee-calc', name: '收费计算器', icon: 'Wallet', category: '汇通用' },
      { id: 'excel-tools', name: '表格处理功能', icon: 'Table2', category: '汇通用' },
      { id: 'ok-dwg-compare', name: 'AI图纸对比', icon: 'Dna', category: '汇通用' },
      { id: 'amount-converter', name: '金额大小写转换', icon: 'Coins', category: '汇通用' },
      { id: 'ok-tax-calc', name: '税费计算', icon: 'Calculator', category: '汇通用' },
      { id: 'simple-calc', name: '计算器', icon: 'PlusMinus', category: '汇通用' },
      { id: 'general-data', name: '通用数据', icon: 'Info', category: '汇通用' },
      { id: 'camera-watermark', name: '工程水印相机', icon: 'Camera', category: '汇通用' },
    ]
  }
];

export const ALL_TOOLS: ToolItem[] = ALL_TOOLS_CATEGORIZED.flatMap(cat => cat.tools);

export const DEFAULT_HOT_TOOLS: string[] = ['ai-vision', 'ai-cad', 'ok-contract', 'formula'];
export const DEFAULT_MY_TOOLS: string[] = ['ai-vision', 'calc-tool', 'formula', 'ok-contract', 'material-diff'];
