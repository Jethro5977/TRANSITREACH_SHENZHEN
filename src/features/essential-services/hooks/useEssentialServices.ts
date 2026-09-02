import { useMemo, useState } from 'react';
import { CATEGORY_ORDER } from '@/shared/data';
import type { MapPoint } from '@/shared/types/location';
import type { ServiceCategory, ServiceLocation } from '@/shared/types/service';
import { filterServicesByCategories, getCategoryCounts, getServicesInsideReach } from '../essentialService';

export function useEssentialServices(polygon: MapPoint[], enabled = true) {
  const [selectedCategories, setSelectedCategories] = useState<Set<ServiceCategory>>(new Set(CATEGORY_ORDER));
  const [hoveredService, setHoveredService] = useState<ServiceLocation | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceLocation | null>(null);

  const allReachableServices = useMemo(
    () => enabled ? getServicesInsideReach(polygon) : [],
    [polygon, enabled],
  );
  const reachableServices = useMemo(
    () => filterServicesByCategories(allReachableServices, selectedCategories),
    [allReachableServices, selectedCategories],
  );
  const categoryCounts = useMemo(() => getCategoryCounts(allReachableServices), [allReachableServices]);

  const toggleCategory = (category: ServiceCategory) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  return {
    selectedCategories,
    reachableServices,
    allReachableServices,
    categoryCounts,
    hoveredService,
    selectedService,
    setHoveredService,
    setSelectedService,
    toggleCategory,
  };
}
