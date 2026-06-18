import { useState, useEffect, useCallback } from 'react';

interface LiveDataState {
  lastUpdated: number;
  refreshKey: number;
}

export function useLiveData(interval: number = 5000) {
  const [state, setState] = useState<LiveDataState>({
    lastUpdated: Date.now(),
    refreshKey: 0,
  });

  const refresh = useCallback(() => {
    setState((prev) => ({
      lastUpdated: Date.now(),
      refreshKey: prev.refreshKey + 1,
    }));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setState((prev) => ({
        lastUpdated: Date.now(),
        refreshKey: prev.refreshKey + 1,
      }));
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  const secondsAgo = Math.floor((Date.now() - state.lastUpdated) / 1000);

  return {
    lastUpdated: state.lastUpdated,
    refreshKey: state.refreshKey,
    secondsAgo,
    refresh,
  };
}

export function useTimeAgo(timestamp: number = Date.now()): string {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - timestamp;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) setTimeAgo(`${seconds}s ago`);
      else if (minutes < 60) setTimeAgo(`${minutes}m ago`);
      else if (hours < 24) setTimeAgo(`${hours}h ago`);
      else setTimeAgo(`${days}d ago`);
    };

    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, [timestamp]);

  return timeAgo;
}
