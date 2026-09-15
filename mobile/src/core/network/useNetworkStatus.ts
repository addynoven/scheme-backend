import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
}

/**
 * Hook listening to real-time network connectivity.
 * Can invoke an onReconnect callback when connection is restored.
 */
export function useNetworkStatus(onReconnect?: () => void): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'unknown',
  });

  useEffect(() => {
    let wasDisconnected = false;

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = Boolean(state.isConnected);
      const isInternetReachable = state.isInternetReachable;

      if (wasDisconnected && isConnected && isInternetReachable !== false) {
        onReconnect?.();
      }

      wasDisconnected = !isConnected;

      setStatus({
        isConnected,
        isInternetReachable,
        connectionType: state.type,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [onReconnect]);

  return status;
}
