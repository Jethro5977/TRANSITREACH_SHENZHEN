import type { SearchResult } from '@/shared/types/location';

export const SEARCH_RESULTS: SearchResult[] = [
  { id: 'futian', name: '福田区', type: 'area', pos: { x: 470, y: 420 }, subtitle: '深圳市行政区' },
  { id: 'nanshan', name: '南山区', type: 'area', pos: { x: 300, y: 450 }, subtitle: '深圳市行政区' },
  { id: 'baoan', name: '宝安区', type: 'area', pos: { x: 210, y: 350 }, subtitle: '深圳市行政区' },
  { id: 'longhua', name: '龙华区', type: 'area', pos: { x: 430, y: 260 }, subtitle: '深圳市行政区' },
  { id: 'sz-north', name: '深圳北站', type: 'station', pos: { x: 420, y: 250 }, subtitle: '地铁 4/5/6 号线' },
];
