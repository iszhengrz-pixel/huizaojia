
import React from 'react';
import * as Icons from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  fill?: string;
}

const Icon: React.FC<IconProps> = ({ name, size = 20, className = "", strokeWidth, fill }) => {
  const LucideIcon = (Icons as any)[name] || Icons.HelpCircle;

  // 构造传递给图标组件的属性对象
  const iconProps: any = {
    size,
    className
  };

  // 只有在显式提供时才添加以下属性，避免 undefined 覆盖组件默认值
  if (strokeWidth !== undefined) {
    iconProps.strokeWidth = strokeWidth;
  }
  
  if (fill !== undefined) {
    iconProps.fill = fill;
  }

  return <LucideIcon {...iconProps} />;
};

export default Icon;
