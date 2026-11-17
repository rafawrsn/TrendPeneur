// [REQUIREMENT: Task 03 - Geofencing Hook]
import { useEffect, useRef } from 'react';
import { useLocationStore } from '../stores/location';
import { isInsideZone } from './geo';
import { useToast } from '../components/ui/Toast';
import type { Zone } from './types';

export function useGeofence(zones: Zone[]) {
  const currentFix = useLocationStore((s) => s.currentFix);
  const insideZoneIds = useLocationStore((s) => s.insideZoneIds);
  const setInsideZoneIds = useLocationStore((s) => s.setInsideZoneIds);
  const addEvent = useLocationStore((s) => s.addEvent);
  const toast = useToast();

  const previousInsideRef = useRef<string[]>([]);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!currentFix) {
      if (insideZoneIds.length > 0) {
        setInsideZoneIds([]);
        previousInsideRef.current = [];
      }
      return;
    }

    // Determine current inside zones
    const currentInsideZones = zones.filter((zone) =>
      isInsideZone(currentFix, zone)
    );
    const currentInsideIds = currentInsideZones.map((z) => z.id);

    // If first time evaluating, just set state and log initial status without exit spam
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      previousInsideRef.current = currentInsideIds;
      setInsideZoneIds(currentInsideIds);

      // If user starts already inside a zone, trigger enter event
      currentInsideZones.forEach((zone) => {
        addEvent({
          zoneId: zone.id,
          zoneName: zone.name,
          type: 'enter',
          message: `Kamu berada di dalam zona ${zone.name}.`,
        });
        toast.show(`Kamu berada di zona ${zone.name}. Peluang usaha aktif!`, 'info');
      });
      return;
    }

    const prevIds = previousInsideRef.current;

    // Detect ENTER events
    const enteredZones = currentInsideZones.filter((z) => !prevIds.includes(z.id));
    enteredZones.forEach((zone) => {
      addEvent({
        zoneId: zone.id,
        zoneName: zone.name,
        type: 'enter',
        message: `Kamu masuk zona ${zone.name}. Produk tren sedang naik di sini!`,
      });
      toast.show(
        `Kamu masuk zona ${zone.name}. Produk tren sedang naik di sini!`,
        'info'
      );
    });

    // Detect EXIT events
    const exitedIds = prevIds.filter((id) => !currentInsideIds.includes(id));
    exitedIds.forEach((id) => {
      const zone = zones.find((z) => z.id === id);
      const name = zone?.name ?? id;
      addEvent({
        zoneId: id,
        zoneName: name,
        type: 'exit',
        message: `Kamu keluar dari zona ${name}.`,
      });
      toast.show(`Kamu keluar dari zona ${name}.`, 'info');
    });

    previousInsideRef.current = currentInsideIds;
    setInsideZoneIds(currentInsideIds);
  }, [currentFix, zones, setInsideZoneIds, addEvent, toast, insideZoneIds.length]);
}
