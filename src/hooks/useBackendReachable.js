import { useState, useEffect } from 'react';
import { isBackendReachable, subscribeBackend } from '../services/connectivity';

export function useBackendReachable() {
  const [reachable, setReachable] = useState(isBackendReachable());

  useEffect(() => subscribeBackend(setReachable), []);

  return reachable;
}
