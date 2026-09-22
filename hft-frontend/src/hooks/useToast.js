// useToast.js — lightweight toast notification hook (no extra deps)
import { useState, useCallback, useRef } from 'react';

let idCounter = 0;

/**
 * useToast — returns { toasts, toast }
 *
 * toast.success(msg), toast.error(msg), toast.info(msg)
 * Each toast auto-dismisses after `duration` ms.
 */
export function useToast(duration = 3500) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const add = useCallback(
    (type, message) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, type, message }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss, duration]
  );

  const toast = {
    success: (msg) => add('success', msg),
    error: (msg) => add('error', msg),
    info: (msg) => add('info', msg),
    warning: (msg) => add('warning', msg),
    dismiss,
  };

  return { toasts, toast };
}

