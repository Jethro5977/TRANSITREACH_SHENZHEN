import {
  Home,
  Map,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
export interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: '首页', icon: Home },
  { path: '/map', label: '可达地图', icon: Map },
  { path: '/methodology', label: '模型说明', icon: BookOpen },
];
