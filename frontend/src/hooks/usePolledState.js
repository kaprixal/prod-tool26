import { useState, useEffect, useRef } from 'react';
import { getState } from '../localStore';

/**
 * Hook that polls localStorage every `intervalMs` milliseconds.
 * Used by overlay pages to stay in sync with the dashboard.
 */
export function usePolledState(intervalMs = 1000) {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const prevGameRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      try {
        const data = getState();
        if (!cancelled) {
          if (prevGameRef.current !== null && prevGameRef.current !== data.game) {
            // Game changed — overlays might want to know
          }
          prevGameRef.current = data.game;
          setState(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    };

    poll();
    const handle = setInterval(poll, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(handle);
    };
  }, [intervalMs]);

  return { state, error };
}
