import { useEffect, useRef, useState } from "react";

const useMinimumLoading = (isLoading, minDurationMs = 500) => {
  const [visibleLoading, setVisibleLoading] = useState(Boolean(isLoading));
  const startedAtRef = useRef(0);

  useEffect(() => {
    let timeoutId;

    if (isLoading) {
      startedAtRef.current = Date.now();
      setVisibleLoading(true);
      return undefined;
    }

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(0, minDurationMs - elapsed);

    timeoutId = window.setTimeout(() => {
      setVisibleLoading(false);
    }, remaining);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isLoading, minDurationMs]);

  return visibleLoading;
};

export default useMinimumLoading;