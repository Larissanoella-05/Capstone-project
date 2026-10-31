import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ToastContext = createContext(() => {});

/** One short confirmation or error message at the bottom of the screen. */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, kind = 'success') => {
    setToast({ message, kind, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[1100] flex justify-center px-4 md:bottom-8"
      >
        {toast && (
          <div
            role="status"
            className={`pointer-events-auto max-w-md border border-ink px-4 py-3 text-sm font-bold ${
              toast.kind === 'error' ? 'bg-danger text-white' : 'bg-ink text-white'
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
