
import React from 'react';
import * as Icons from 'lucide-react';

// Added strokeWidth to IconProps to resolve type errors in components that customize icon weights
interface IconProps {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const Icon: React.FC<IconProps> = ({ name, size = 20, className = "", strokeWidth }) => {
  const LucideIcon = (Icons as any)[name];
  // Forward strokeWidth to the underlying Lucide component if provided
  if (!LucideIcon) return <Icons.HelpCircle size={size} className={className} strokeWidth={strokeWidth} />;
  return <LucideIcon size={size} className={className} strokeWidth={strokeWidth} />;
};

export default Icon;
