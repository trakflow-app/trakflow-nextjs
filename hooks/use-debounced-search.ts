import { useEffect, useRef, useState } from 'react';

type UseDebouncedSearchOptions = {
  debounceMs: number;
  onDebouncedChange: (value: string) => void;
  serverValue: string;
};

/**
 * Keeps search input responsive while safely synchronizing debounced URL state.
 */
export function useDebouncedSearch({
  debounceMs,
  onDebouncedChange,
  serverValue,
}: UseDebouncedSearchOptions) {
  // Current text shown in the search input.
  const [inputValue, setInputValue] = useState(serverValue);

  // Most recent search value sent to the URL.
  const latestRequestedValueRef = useRef<string | null>(null);

  // Latest callback without restarting the debounce timer.
  const onDebouncedChangeRef = useRef(onDebouncedChange);

  // Search values waiting for a matching server response.
  const pendingRequestedValuesRef = useRef(new Set<string>());

  // Previous URL value used to detect an actual URL change.
  const previousServerValueRef = useRef(serverValue);

  /**
   * Keeps the callback ref current without changing debounce behavior.
   */
  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  /**
   * Synchronizes external URL changes without overwriting newer local typing.
   */
  useEffect(() => {
    // Ignore renders where the URL search value did not change.
    if (previousServerValueRef.current === serverValue) {
      return;
    }

    // Store the new URL value for the next comparison.
    previousServerValueRef.current = serverValue;

    // Treat a known value as the server acknowledging one of our searches.
    if (pendingRequestedValuesRef.current.has(serverValue)) {
      pendingRequestedValuesRef.current.delete(serverValue);

      // Clear completed requests when the newest search has arrived.
      if (latestRequestedValueRef.current === serverValue) {
        pendingRequestedValuesRef.current.clear();
        latestRequestedValueRef.current = null;
      }

      return;
    }

    // An unknown value came from navigation such as browser back or forward.
    pendingRequestedValuesRef.current.clear();
    latestRequestedValueRef.current = null;

    // Defer the state update so the effect only synchronizes external state.
    const syncTimer = window.setTimeout(() => {
      setInputValue(serverValue);
    }, 0);

    // Cancel stale synchronization when another URL change arrives.
    return () => window.clearTimeout(syncTimer);
  }, [serverValue]);

  /**
   * Sends the local search value after the user stops typing.
   */
  useEffect(() => {
    // Skip values already represented by the URL or already requested.
    if (
      inputValue === serverValue ||
      latestRequestedValueRef.current === inputValue
    ) {
      return;
    }

    // Wait before navigating so typing does not trigger a request per character.
    const searchTimer = window.setTimeout(() => {
      pendingRequestedValuesRef.current.add(inputValue);
      latestRequestedValueRef.current = inputValue;
      onDebouncedChangeRef.current(inputValue);
    }, debounceMs);

    // Cancel the previous search when the user types again.
    return () => window.clearTimeout(searchTimer);
  }, [debounceMs, inputValue, serverValue]);

  return {
    inputValue,
    setInputValue,
  };
}
