// [REQUIREMENT: Task 02 - Map Component Props Contract]
import type { StyleProp, ViewStyle } from 'react-native';
import type { LocationFix, Zone, LatLng } from '../../location/types';

export interface LocationMapProps {
  userLocation: LocationFix | null;
  zones: Zone[];
  selectedZoneId?: string | null;
  insideZoneIds?: string[];
  onZonePress?: (zone: Zone) => void;
  onMapPress?: (coords: LatLng) => void;
  followUser?: boolean;
  height?: number;
  style?: StyleProp<ViewStyle>;
  onRecenter?: () => void;
}
