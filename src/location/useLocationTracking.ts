// [REQUIREMENT: Battery Optimization & Location Tracking]
import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useLocationStore, TRACKING_PROFILES } from '../stores/location';
import { haversineMeters } from './geo';
import type { LocationFix } from './types';

function mapProfileToExpoAccuracy(profileKey: string): Location.Accuracy {
  switch (profileKey) {
    case 'high_accuracy':
      return Location.Accuracy.High;
    case 'battery_saver':
      return Location.Accuracy.Low;
    case 'balanced':
    default:
      return Location.Accuracy.Balanced;
  }
}

export function useLocationTracking() {
  const trackingEnabled = useLocationStore((s) => s.trackingEnabled);
  const simulationEnabled = useLocationStore((s) => s.simulationEnabled);
  const selectedProfileKey = useLocationStore((s) => s.selectedProfileKey);
  const setCurrentFix = useLocationStore((s) => s.setCurrentFix);
  const incrementReceived = useLocationStore((s) => s.incrementReceived);
  const incrementProcessed = useLocationStore((s) => s.incrementProcessed);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastProcessedLocationRef = useRef<LocationFix | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function startWatcher() {
      // If tracking is off or simulation is on, stop subscription to conserve battery
      if (!trackingEnabled || simulationEnabled) {
        if (subscriptionRef.current) {
          subscriptionRef.current.remove();
          subscriptionRef.current = null;
        }
        return;
      }

      // Check permission
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        return;
      }

      const profile = TRACKING_PROFILES[selectedProfileKey];
      const accuracy = mapProfileToExpoAccuracy(selectedProfileKey);

      // Clean up previous subscription if profile changed
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }

      try {
        const sub = await Location.watchPositionAsync(
          {
            accuracy,
            timeInterval: profile.timeInterval,
            distanceInterval: profile.distanceInterval,
          },
          (loc) => {
            if (isCancelled) return;

            incrementReceived();

            const newFix: LocationFix = {
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
              accuracy: loc.coords.accuracy != null ? Math.round(loc.coords.accuracy) : null,
              timestamp: loc.timestamp || Date.now(),
              source: 'gps',
            };

            // Distance filter check: only process if moved at least distanceInterval or first fix
            const lastProcessed = lastProcessedLocationRef.current;
            if (
              !lastProcessed ||
              haversineMeters(lastProcessed, newFix) >= profile.distanceInterval
            ) {
              lastProcessedLocationRef.current = newFix;
              incrementProcessed();
              setCurrentFix(newFix);
            }
          }
        );

        if (!isCancelled) {
          subscriptionRef.current = sub;
        } else {
          sub.remove();
        }
      } catch (err) {
        console.warn('Failed to start location subscription:', err);
      }
    }

    startWatcher();

    return () => {
      isCancelled = true;
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, [
    trackingEnabled,
    simulationEnabled,
    selectedProfileKey,
    setCurrentFix,
    incrementReceived,
    incrementProcessed,
  ]);
}
