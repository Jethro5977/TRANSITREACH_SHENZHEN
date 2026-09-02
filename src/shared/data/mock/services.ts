import { Hospital, GraduationCap, ShoppingBag, Stethoscope, Trees } from 'lucide-react';
import type { ServiceCategory, ServiceCategoryMeta, ServiceLocation } from '@/shared/types/service';

export const CATEGORY_META: Record<ServiceCategory, ServiceCategoryMeta> = {
  hospital: { id: 'hospital', label: '医院', icon: Hospital, color: '#e11d48', colorLight: '#ffe4e6' },
  clinic: { id: 'clinic', label: '社区健康服务中心', icon: Stethoscope, color: '#0ea5e9', colorLight: '#e0f2fe' },
  pharmacy: { id: 'pharmacy', label: '药房', icon: Stethoscope, color: '#8b5cf6', colorLight: '#ede9fe' },
  school: { id: 'school', label: '学校', icon: GraduationCap, color: '#f59e0b', colorLight: '#fef3c7' },
  market: { id: 'market', label: '商圈', icon: ShoppingBag, color: '#10b981', colorLight: '#d1fae5' },
  govt: { id: 'govt', label: '政务服务', icon: Hospital, color: '#6366f1', colorLight: '#e0e7ff' },
  park: { id: 'park', label: '公园', icon: Trees, color: '#22c55e', colorLight: '#dcfce7' },
  bank: { id: 'bank', label: '银行', icon: ShoppingBag, color: '#14b8a6', colorLight: '#ccfbf1' },
  police: { id: 'police', label: '公安服务', icon: Hospital, color: '#3b82f6', colorLight: '#dbeafe' },
  childcare: { id: 'childcare', label: '托育服务', icon: GraduationCap, color: '#ec4899', colorLight: '#fce7f3' },
  food: { id: 'food', label: '餐饮', icon: ShoppingBag, color: '#f97316', colorLight: '#ffedd5' },
};

export const CATEGORY_ORDER: ServiceCategory[] = ['hospital', 'clinic', 'school', 'market', 'park'];

function svc(id: string, name: string, category: ServiceCategory, x: number, y: number, address: string): ServiceLocation {
  return { id, name, category, pos: { x, y }, walkMin: 0, transitMin: 0, accessible: false, waitingMin: 0, rating: 0, address, hours: '以机构公告为准' };
}

/**
 * OSM/Overpass 设施快照（2026-09-02）。x/y 由经纬度投影到 Demo 画布；
 * 等候、评分、无障碍与时间字段未获开放数据，因此不伪造数值。
 */
export const SERVICES: ServiceLocation[] = [
  svc('h1', '深圳市人民医院', 'hospital', 563, 467, '罗湖区'),
  svc('h2', '北京大学深圳医院', 'hospital', 447, 468, '福田区'),
  svc('h3', '南山区人民医院', 'hospital', 262, 514, '南山区'),
  svc('h4', '宝安区人民医院', 'hospital', 249, 458, '宝安区'),
  svc('h5', '深圳市龙华区人民医院', 'hospital', 423, 291, '龙华区'),
  svc('c1', '景蜜村社区健康服务中心', 'clinic', 431, 470, '福田区'),
  svc('c2', '白石洲社区健康中心', 'clinic', 326, 512, '南山区'),
  svc('c3', '流塘社区健康中心', 'clinic', 211, 427, '宝安区'),
  svc('c4', '大学城社区健康服务中心', 'clinic', 354, 410, '南山区'),
  svc('s1', '深圳中学', 'school', 552, 473, '罗湖区'),
  svc('s2', '深圳实验学校高中部', 'school', 291, 413, '南山区'),
  svc('s3', '南山外国语学校（集团）高新中学', 'school', 304, 527, '南山区'),
  svc('s4', '宝安中学（集团）高中部', 'school', 256, 441, '宝安区'),
  svc('m1', '华强北', 'market', 501, 490, '福田区'),
  svc('m2', '东门商业步行街', 'market', 550, 489, '罗湖区'),
  svc('m3', '海岸城购物中心', 'market', 281, 538, '南山区'),
  svc('m4', '壹方城', 'market', 210, 475, '宝安区'),
  svc('m5', '深圳万象城', 'market', 536, 493, '罗湖区'),
  svc('p1', '莲花山公园', 'park', 454, 483, '福田区'),
  svc('p2', '深圳湾公园', 'park', 365, 530, '南山区'),
  svc('p3', '深圳中心公园', 'park', 489, 494, '福田区'),
  svc('p4', '大南山', 'park', 237, 574, '南山区'),
];
