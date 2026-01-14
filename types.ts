
export interface ToolItem {
  id: string;
  name: string;
  description?: string;
  icon: string;
  category: string;
  isHot?: boolean;
  pricingType?: 'free' | 'paid'; // 定价类型：免费或付费
  isActivated?: boolean;        // 是否已激活/开通
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
}

export type ViewType = 'home' | 'ai-chat' | 'tool-view';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
