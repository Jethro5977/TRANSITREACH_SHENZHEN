import type { LucideIcon } from 'lucide-react';
import type { MapPoint } from './location';

export type ServiceCategory =
  | 'hospital'
  | 'clinic'
  | 'pharmacy'
  | 'school'
  | 'market'
  | 'govt'
  | 'park'
  | 'bank'
  | 'police'
  | 'childcare'
  | 'food';

export interface ServiceCategoryMeta {
  id: ServiceCategory;
  label: string;
  icon: LucideIcon;
  color: string;
  colorLight: string;
}

export interface ServiceLocation {
  id: string;
  name: string;
  category: ServiceCategory;
  pos: MapPoint;
  address: string;
  hours: string;
  rating: number;
  walkMin: number;
  transitMin: number;
  accessible: boolean;
  waitingMin: number;
}
