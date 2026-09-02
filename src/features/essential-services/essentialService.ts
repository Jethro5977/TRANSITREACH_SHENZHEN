import { SERVICES } from '@/shared/data';
import { servicesInPolygon } from '@/shared/lib/spatial';
import type { MapPoint } from '@/shared/types/location';
import type { ServiceCategory, ServiceLocation } from '@/shared/types/service';

export function getServicesInsideReach(polygon: MapPoint[]): ServiceLocation[] {
  return servicesInPolygon(SERVICES, polygon);
}

export function filterServicesByCategories(
  services: ServiceLocation[],
  categories: Set<ServiceCategory>,
): ServiceLocation[] {
  return services.filter(service => categories.has(service.category));
}

export function getCategoryCounts(services: ServiceLocation[]): Partial<Record<ServiceCategory, number>> {
  const counts: Partial<Record<ServiceCategory, number>> = {};
  services.forEach(service => {
    counts[service.category] = (counts[service.category] ?? 0) + 1;
  });
  return counts;
}
