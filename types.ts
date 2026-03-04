
export interface ToolItem {
  id: string;
  name: string;
  description?: string;
  icon: string;
  category: string;
  isHot?: boolean;
  pricingType?: 'free' | 'paid'; // 定价类型：免费或付费
  isActivated?: boolean;        // 是否已激活/开通
  // Added parentId to ToolItem to link tools to their respective navigation categories
  parentId?: string;
  tutorial?: {
    overview: string;
    steps: string[];
    tips?: string[];
  };
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  children?: SubMenuItem[];
}

export interface SubMenuItem {
  id: string;
  label: string;
  parentId: string;
  children?: SubMenuItem[]; // 增加子级支持，用于实现三级菜单
}

export type ViewType = 'home' | 'ai-chat' | 'tool-view';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
