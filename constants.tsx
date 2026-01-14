
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

export interface ToolCategory {
  category: string;
  tools: ToolItem[];
}

export const ALL_TOOLS_CATEGORIZED: ToolCategory[] = [
  {
    category: '汇计量',
    tools: [
      { id: 'qa-text-stats', name: 'AI文本统计', icon: 'FileJson', category: '汇计量', isHot: true },
      { 
        id: 'ai-vision', 
        name: 'AI识图算量', 
        icon: 'ScanSearch', 
        category: '汇计量', 
        isHot: true,
        tutorial: {
          overview: "AI 识图算量是一款基于计算机视觉的自动化计量工具，支持对建筑图纸中的构件进行快速识别与测量。",
          steps: [
            "选择识图模式（如土建、精装、安装等）",
            "上传对应的 PDF、CAD 或高清照片图纸",
            "点击“开始分析”，AI 将自动提取几何特征",
            "在线核对并导出工程量清单 Excel 表格"
          ],
          tips: ["矢量 CAD 文件的识别精度远高于照片", "确保图纸比例尺清晰，以便获得准确结果"]
        }
      },
      { id: 'ai-cad', name: 'AI批量提取CAD表', icon: 'Layers', category: '汇计量', isHot: true },
      { id: 'list-compare', name: '清单工程量对比', icon: 'ArrowLeftRight', category: '汇计量' },
      { id: 'calc-tool', name: '工程量计算器', icon: 'Divide', category: '汇计量' },
      { id: 'formula', name: '公式大全', icon: 'FunctionSquare', category: '汇计量' },
      { id: 'hardware-calc', name: '五金计算器', icon: 'Anvil', category: '汇计量' },
    ]
  },
  {
    category: '汇计价',
    tools: [
      { id: 'material-diff', name: '材料调差', icon: 'TrendingUp', category: '汇计价' },
      { id: 'fee-standards', name: '前后期收费标准库', icon: 'LibraryBig', category: '汇计价' },
      { id: 'ai-plant-list', name: 'AI苗木表编清单', icon: 'Sprout', category: '汇计价' },
      { 
        id: 'ok-contract', 
        name: '合同价对比', 
        icon: 'FileDiff', 
        category: '汇计价',
        tutorial: {
          overview: "合同价对比是一款智能审计辅助工具，能够快速识别两份计价文件间的单价、合价及子目差异。",
          steps: [
            "分别导入“合同价”和“送审价”对应的 Excel 文件",
            "点击“价格对比”按钮启动 AI 审计引擎",
            "通过右侧“AI 差异分析”栏快速定位红色差异项",
            "点击差异项可自动在表格中高亮对应行"
          ],
          tips: ["确保两份文件的清单编码尽可能一致", "红色高亮代表金额存在差异"]
        }
      },
      { id: 'price-file-compare', name: '计价文件对比', icon: 'Files', category: '汇计价' },
    ]
  },
  {
    category: '汇通用',
    tools: [
      { 
        id: 'ok-date-calc', 
        name: '日期计算器', 
        icon: 'CalendarDays', 
        category: '汇通用',
        tutorial: {
          overview: "日期计算器是专为工程工期管理设计的工具，支持工期计算与日期推算。",
          steps: [
            "工期计算：输入起始与结束日期，查看总天数及工作日统计",
            "日期推算：输入起始日期与推算天数，得出目标日期",
            "可勾选是否包含结束当天日期"
          ],
          tips: ["工作日计算已自动扣除周末时间"]
        }
      },
      { id: 'duration-quota', name: '工期定额', icon: 'Clock', category: '汇通用' },
      { id: 'fee-calc', name: '收费计算器', icon: 'Wallet', category: '汇通用' },
      { id: 'excel-tools', name: '表格处理功能', icon: 'Table2', category: '汇通用' },
      { id: 'ok-dwg-compare', name: 'AI图纸对比', icon: 'Dna', category: '汇通用' },
      { id: 'amount-converter', name: '金额大小写转换', icon: 'Coins', category: '汇通用' },
      { 
        id: 'ok-tax-calc', 
        name: '税费计算', 
        icon: 'Calculator', 
        category: '汇通用',
        tutorial: {
          overview: "税费计算工具支持含税金额与不含税金额的快速互转。",
          steps: [
            "在右上角设置需要保留的小数点位数",
            "选择“含税计算”或“不含税计算”模式",
            "输入金额并选择或手动输入税率百分比",
            "点击计算结果右侧的复制图标即可快速使用"
          ]
        }
      },
      { id: 'simple-calc', name: '计算器', icon: 'PlusMinus', category: '汇通用' },
      { id: 'general-data', name: '通用数据', icon: 'Info', category: '汇通用' },
      { id: 'camera-watermark', name: '工程水印相机', icon: 'Camera', category: '汇通用' },
    ]
  }
];

export const ALL_TOOLS: ToolItem[] = ALL_TOOLS_CATEGORIZED.flatMap(cat => cat.tools);

export const DEFAULT_HOT_TOOLS: string[] = ['ai-vision', 'ai-cad', 'qa-text-stats', 'ok-contract', 'material-diff', 'formula'];
export const DEFAULT_MY_TOOLS: string[] = ['calc-tool', 'formula', 'hardware-calc', 'material-diff', 'fee-standards', 'ai-plant-list', 'ok-contract'];
