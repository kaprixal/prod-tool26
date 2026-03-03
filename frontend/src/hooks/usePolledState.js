import { useState, useEffect, useRef } from 'react';
import { fetchState } from '../api';

/**
 * Hook that polls the backend state every `intervalMs` milliseconds.
 * Used by overlay pages to stay in sync.
 */
export function usePolledState(intervalMs = 1000) {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const prevGameRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await fetchState();
        if (!cancelled) {
          // Detect game change for overlays that need to re-render
          if (prevGameRef.current !== null && prevGameRef.current !== data.game) {
            // Game changed - overlays might want to know
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
