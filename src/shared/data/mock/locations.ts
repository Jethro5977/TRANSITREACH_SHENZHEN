import type { SearchResult } from '@/shared/types/location';

export const SEARCH_RESULTS: SearchResult[] = [
  { id: 'sr1', name: 'Bandar Utama',       type: 'area',     pos: { x: 620, y: 240 }, subtitle: 'Petaling Jaya · 4.2 km²' },
  { id: 'sr2', name: 'Subang Jaya SS15',   type: 'area',     pos: { x: 200, y: 530 }, subtitle: 'Subang Jaya · 3.8 km²' },
  { id: 'sr3', name: 'TTDI',               type: 'area',     pos: { x: 680, y: 200 }, subtitle: 'Kuala Lumpur · 5.1 km²' },
  { id: 'sr4', name: 'Section 17',         type: 'area',     pos: { x: 250, y: 320 }, subtitle: 'Petaling Jaya · 2.9 km²' },
  { id: 'sr5', name: 'Ara Damansara',      type: 'area',     pos: { x: 450, y: 430 }, subtitle: 'Petaling Jaya · 3.2 km²' },
  { id: 'sr6', name: 'Dataran Station',    type: 'station',  pos: { x: 500, y: 360 }, subtitle: 'LRT Kelana · BRT Sunway' },
  { id: 'sr7', name: 'MBPJ City Hall',     type: 'landmark', pos: { x: 520, y: 360 }, subtitle: 'Government office' },
  { id: 'sr8', name: 'Bandar Utama Mall',  type: 'landmark', pos: { x: 590, y: 245 }, subtitle: 'Shopping centre' },
];
