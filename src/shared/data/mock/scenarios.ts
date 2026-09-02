import type { ScenarioRoute } from '@/shared/types/scenario';

export const SCENARIO_ROUTES: ScenarioRoute[] = [
  {
    id: 'sc-proposed-1',
    name: 'Proposed Feeder Route A',
    type: 'proposed',
    color: '#14b8a6',
    path: [
      { x: 200, y: 530 }, { x: 280, y: 490 }, { x: 360, y: 440 }, { x: 440, y: 400 },
      { x: 480, y: 360 }, { x: 460, y: 300 }, { x: 420, y: 240 }, { x: 380, y: 180 },
    ],
    stops: [
      { name: 'SS15', pos: { x: 200, y: 530 } },
      { name: 'SS19', pos: { x: 280, y: 490 } },
      { name: 'Glenmarie', pos: { x: 360, y: 440 } },
      { name: 'Ara', pos: { x: 440, y: 400 } },
      { name: 'Dataran', pos: { x: 480, y: 360 } },
      { name: 'Mentari', pos: { x: 460, y: 300 } },
      { name: 'Bandar', pos: { x: 420, y: 240 } },
      { name: 'PJD', pos: { x: 380, y: 180 } },
    ],
  },
  {
    id: 'sc-suspended-1',
    name: 'Suspend Bus 222 (Section 17–24)',
    type: 'suspended',
    color: '#f43f5e',
    path: [
      { x: 260, y: 320 }, { x: 360, y: 340 }, { x: 460, y: 360 }, { x: 560, y: 380 }, { x: 660, y: 400 },
    ],
    stops: [
      { name: 'Section 17', pos: { x: 260, y: 320 } },
      { name: 'Section 19', pos: { x: 360, y: 340 } },
      { name: 'Section 20', pos: { x: 460, y: 360 } },
      { name: 'Section 21', pos: { x: 560, y: 380 } },
      { name: 'Section 22', pos: { x: 660, y: 400 } },
    ],
  },
];
