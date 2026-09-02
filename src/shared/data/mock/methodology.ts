import type { MethodologyStep } from '@/shared/types/methodology';

export const METHODOLOGY_STEPS: MethodologyStep[] = [
  {
    id: 'step1',
    title: 'Stop Identification',
    icon: 'MapPin',
    description: 'Locate all walkable transit stops within a 400m catchment of the origin point.',
    details: [
      '400m walkable radius (≈5 min walk)',
      'Snapped to OSM pedestrian network',
      'Includes bus, LRT, BRT, MRT stops',
    ],
  },
  {
    id: 'step2',
    title: 'Schedule-Based Reach',
    icon: 'Clock',
    description: 'Query GTFS timetable to find services reachable within the time budget.',
    details: [
      'Per-departure vehicle boarding',
      'Headway-aware waiting times',
      'Maximum 2 transfers',
    ],
  },
  {
    id: 'step3',
    title: 'Egress Walk',
    icon: 'Footprints',
    description: 'From each alighting stop, walk 400m to compute the final accessible area.',
    details: [
      'Network-constrained walking',
      'Penalised crossings & slopes',
      'Produces reachable polygon',
    ],
  },
  {
    id: 'step4',
    title: 'Service Matching',
    icon: 'Building2',
    description: 'Overlay essential-service locations against the reachable polygon.',
    details: [
      '11 service categories',
      'Opening-hours awareness',
      'Accessibility flag per facility',
    ],
  },
  {
    id: 'step5',
    title: 'Confidence Scoring',
    icon: 'Gauge',
    description: 'Estimate data confidence from schedule age, OSM freshness, and GPS trace density.',
    details: [
      'A–E confidence grade',
      'Schedule staleness penalty',
      'OSM contributor recency',
    ],
  },
];
