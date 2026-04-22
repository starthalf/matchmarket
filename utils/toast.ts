// utils/toast.ts - 커스텀 토스트 알림

type ToastListener = (message: string, type?: 'success' | 'error' | 'info') => void;

let listener: ToastListener | null = null;

export const toast = {
  show: (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (listener) {
      listener(message, type);
    }
  },
  setListener: (fn: ToastListener) => {
    listener = fn;
  },
  removeListener: () => {
    listener = null;
  },
};