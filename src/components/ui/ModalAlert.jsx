'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
  HelpCircle,
} from 'lucide-react';

const ModalAlertContext = createContext(null);

export function ModalAlertProvider({ children }) {
  const [modalState, setModalState] = useState(null);
  const resolveRef = useRef(null);

  /**
   * Show a modern alert dialog (replaces window.alert)
   */
  const showAlert = useCallback(({
    title = 'Notification',
    message,
    variant = 'info', // 'info' | 'success' | 'warning' | 'error'
    confirmText = 'Got it',
  }) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModalState({
        type: 'alert',
        title,
        message,
        variant,
        confirmText,
      });
    });
  }, []);

  /**
   * Show a modern confirmation dialog (replaces window.confirm)
   */
  const showConfirm = useCallback(({
    title = 'Confirm Action',
    message,
    variant = 'warning', // 'warning' | 'danger' | 'info' | 'success'
    confirmText = 'Confirm',
    cancelText = 'Cancel',
  }) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModalState({
        type: 'confirm',
        title,
        message,
        variant,
        confirmText,
        cancelText,
      });
    });
  }, []);

  /**
   * Helper shortcuts for alerts
   */
  const showSuccess = useCallback((title, message, confirmText = 'Got it') => {
    return showAlert({ title, message, variant: 'success', confirmText });
  }, [showAlert]);

  const showError = useCallback((title, message, confirmText = 'Got it') => {
    return showAlert({ title, message, variant: 'error', confirmText });
  }, [showAlert]);

  const showWarning = useCallback((title, message, confirmText = 'Got it') => {
    return showAlert({ title, message, variant: 'warning', confirmText });
  }, [showAlert]);

  const handleClose = (result) => {
    setModalState(null);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  };

  return (
    <ModalAlertContext.Provider value={{ showAlert, showConfirm, showSuccess, showError, showWarning }}>
      {children}

      {/* Modern UI Modal Alert / Confirm Backdrop */}
      {modalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="bg-white rounded-3xl border border-[#F0E7DE] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Top Icon & Title */}
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  modalState.variant === 'success'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : modalState.variant === 'error' || modalState.variant === 'danger'
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : modalState.variant === 'warning'
                    ? 'bg-amber-50 text-[#C2410C] border-orange-200'
                    : 'bg-orange-50 text-[#F97316] border-orange-200'
                }`}
              >
                {modalState.variant === 'success' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : modalState.variant === 'error' || modalState.variant === 'danger' ? (
                  <XCircle className="w-6 h-6" />
                ) : modalState.variant === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-base font-bold text-[#292524] tracking-tight">
                  {modalState.title}
                </h3>
                <p className="text-xs text-[#78716C] mt-1 leading-relaxed whitespace-pre-wrap">
                  {modalState.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleClose(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              {modalState.type === 'confirm' && (
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                >
                  {modalState.cancelText || 'Cancel'}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleClose(true)}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors cursor-pointer ${
                  modalState.variant === 'error' || modalState.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#F97316] hover:bg-[#C2410C]'
                }`}
              >
                {modalState.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalAlertContext.Provider>
  );
}

export function useModalAlert() {
  const context = useContext(ModalAlertContext);
  if (!context) {
    throw new Error('useModalAlert must be used within a ModalAlertProvider');
  }
  return context;
}
