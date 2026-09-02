import { useCallback, useEffect, useRef, useState } from 'react';
import {
  computeReachability,
  RoutingTimeoutError,
  type IsochroneResult,
} from '@/shared/data/adapters/routingAdapter';
import { DEFAULT_DEPARTURE_PROFILE, type DepartureProfileId } from '@/shared/data/shenzhen/timetable';
import type { LatLng, Origin, PlaceResult, RailStop } from '../types';
import { isInStudyArea } from '../reachabilityService';

/** AC 1.1.2 — a click outside the covered area is rejected with this message. */
const OUTSIDE_AREA = '所选位置超出深圳 Demo 覆盖范围';

/** AC 1.1.4 — device location is optional; nothing is disabled when it is unavailable. */
const LOCATION_UNAVAILABLE = '无法获取定位，请搜索地铁站或点击地图。';
const LOCATION_OUTSIDE_AREA = '你当前的位置不在深圳 Demo 覆盖范围内';

/** AC 1.2.1 — 30 min is selected before any starting point has been chosen. */
const DEFAULT_TIME_BUDGET = 30;

/**
 * The reachable area's lifecycle.
 *
 * `budgetMinutes` on the computing and ready states is the budget that computation was
 * started with — not whatever is currently selected. AC 1.2.2 requires the budget shown
 * beside an area to be the one the area was computed with; keeping it on the state rather
 * than reading the selector is what makes the two incapable of disagreeing.
 */
export type ReachabilityState =
  | { status: 'idle' }
  | { status: 'computing'; budgetMinutes: number }
  | { status: 'ready'; budgetMinutes: number; result: IsochroneResult; walkingOnly: boolean }
  | { status: 'failed'; budgetMinutes: number }
  /** Exceeded the time limit. AC 1.3.2 requires this to read distinctly from a failure. */
  | { status: 'timedout'; budgetMinutes: number; limitMs: number };

export function useReachability(
  initialStop: RailStop | null,
  initialPlace: PlaceResult | null,
  onToast: (message: string, icon?: string) => void,
) {
  const [origin, setOrigin] = useState<Origin | null>(
    initialStop
      ? { at: { lat: initialStop.lat, lon: initialStop.lon }, source: 'stop', stop: initialStop }
      : initialPlace
        ? { at: initialPlace, source: 'place', place: initialPlace }
        : null,
  );
  const [timeBudget, setTimeBudget] = useState(DEFAULT_TIME_BUDGET);
  const [departureProfile, setDepartureProfile] = useState<DepartureProfileId>(DEFAULT_DEPARTURE_PROFILE);
  const [state, setState] = useState<ReachabilityState>({ status: 'idle' });

  // Guards against a superseded result ever reaching the screen. Every run takes a
  // ticket; only the holder of the current ticket is allowed to write state.
  const runId = useRef(0);
  const inFlight = useRef<AbortController | null>(null);

  const run = useCallback(
    (at: LatLng, budgetMinutes: number, profile: DepartureProfileId) => {
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;
      const ticket = ++runId.current;

      // AC 1.1.5 / AC 1.2.2 — the previous area is removed when the new computation
      // starts, not when it finishes, so two areas are never on the map at once.
      setState({ status: 'computing', budgetMinutes });

      computeReachability(at, budgetMinutes, profile, controller.signal)
        .then(({ result, walkingOnly }) => {
          if (ticket !== runId.current) return; // superseded — discard, never render
          setState({ status: 'ready', budgetMinutes, result, walkingOnly });
        })
        .catch(error => {
          // A superseded run aborts its own controller — that is not a failure to report.
          // A timeout also arrives as an abort, so check it before the aborted guard.
          if (error instanceof RoutingTimeoutError) {
            if (ticket !== runId.current) return;
            setState({ status: 'timedout', budgetMinutes, limitMs: error.limitMs });
            return;
          }
          if (controller.signal.aborted || ticket !== runId.current) return;
          console.error('Reachability computation failed', error);
          setState({ status: 'failed', budgetMinutes });
        });
    },
    [],
  );

  // Recompute whenever the origin or the budget changes, and only then.
  useEffect(() => {
    if (!origin) {
      inFlight.current?.abort();
      runId.current++;
      setState({ status: 'idle' });
      return;
    }
    run(origin.at, timeBudget, departureProfile);
  }, [origin, timeBudget, departureProfile, run]);

  useEffect(() => () => inFlight.current?.abort(), []);

  /** Selecting a stop places the origin at its stop_lat / stop_lon from the feed. */
  const selectStop = (stop: RailStop) => {
    setOrigin({ at: { lat: stop.lat, lon: stop.lon }, source: 'stop', stop });
  };

  /**
   * AC 1.1.2 — sets the origin at an arbitrary in-area coordinate. A stop need not be
   * nearby. Out of area, the previous origin is retained rather than cleared.
   */
  const selectPoint = (at: LatLng) => {
    if (!isInStudyArea(at)) {
      onToast(OUTSIDE_AREA, '!');
      return;
    }
    setOrigin({ at, source: 'map' });
  };

  /** A geocoded place remains a coordinate origin; it is never silently coerced to a station. */
  const selectPlace = (place: PlaceResult) => {
    if (!isInStudyArea(place)) {
      onToast(OUTSIDE_AREA, '!');
      return;
    }
    setOrigin({ at: place, source: 'place', place });
  };

  /**
   * AC 1.1.4 — the permission is requested here and nowhere else, so nothing prompts on
   * page load. The position sets the origin directly, with no confirmation step. It is
   * held in state only: never stored beyond the session, never sent anywhere.
   */
  const requestDeviceLocation = () => {
    if (!('geolocation' in navigator)) {
      onToast(LOCATION_UNAVAILABLE, '!');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        const at = { lat: position.coords.latitude, lon: position.coords.longitude };
        if (!isInStudyArea(at)) {
          onToast(LOCATION_OUTSIDE_AREA, '!');
          return;
        }
        setOrigin({ at, source: 'device' });
      },
      () => onToast(LOCATION_UNAVAILABLE, '!'),
    );
  };

  /** AC 1.1.5 — clears the starting point and the area, and returns to the default view. */
  const clearOrigin = () => setOrigin(null);

  /** AC 1.1.5 / AC 1.2.2 — the budget survives a change of starting point, and vice versa. */
  const changeTimeBudget = (minutes: number) => setTimeBudget(minutes);
  const changeDepartureProfile = (profile: DepartureProfileId) => setDepartureProfile(profile);

  /** AC 1.3.2 — re-runs the same settings without the user re-entering anything. */
  const retry = () => {
    if (origin) run(origin.at, timeBudget, departureProfile);
  };

  return {
    origin,
    timeBudget,
    departureProfile,
    state,
    selectStop,
    selectPoint,
    selectPlace,
    requestDeviceLocation,
    clearOrigin,
    changeTimeBudget,
    changeDepartureProfile,
    retry,
  };
}
