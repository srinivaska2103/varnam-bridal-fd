'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, description, variant = 'default', duration = 4000 }) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const newToast = { id, title, description, variant };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Toast container floating at bottom-right */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border text-sm transition-all duration-200 transform translate-y-0 ${
              toast.variant === 'destructive'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : toast.variant === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-white border-stone-200 text-stone-800'
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                {toast.title && <div className="font-semibold">{toast.title}</div>}
                {toast.description && <div className="text-xs mt-0.5 opacity-90">{toast.description}</div>}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-stone-400 hover:text-stone-600 -mr-1 -mt-1 p-1 text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
