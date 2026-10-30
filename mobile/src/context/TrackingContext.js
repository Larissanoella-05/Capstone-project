import { createContext, useContext, useMemo, useState } from 'react';

// What the location tracker is doing right now, so a screen can say it truthfully.
// 'idle' | 'starting' | 'sharing' | 'denied' (permission refused) | 'error' (GPS could not start)
const TrackingContext = createContext({ status: 'idle', setStatus: () => {} });

export function TrackingProvider({ children }) {
  const [status, setStatus] = useState('idle');
  const value = useMemo(() => ({ status, setStatus }), [status]);
  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>;
}

export const useTracking = () => useContext(TrackingContext);
