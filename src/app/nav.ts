import {
  Home,
  Map,
  BookOpen,
  type LucideIcon,
} from 'lucide-react';
import type { PageId } from './routes';

export interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'landing', label: '首页', icon: Home },
  { id: 'map', label: '可达地图', icon: Map },
  { id: 'methodology', label: '模型说明', icon: BookOpen },
];
