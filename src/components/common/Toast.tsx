import { useState, useEffect, useCallback } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'points';
  duration?: number;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  subMessage?: string;
}

export function Toast({ 
  message, 
  type = 'success', 
  duration = 2500, 
  onClose,
  action,
  subMessage
}: ToastProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 如果有 action，加長顯示時間
    const actualDuration = action ? 5000 : duration;
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onClose, 300);
    }, actualDuration);

    return () => clearTimeout(timer);
  }, [duration, onClose, action]);

  const bgColor = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    points: 'bg-gradient-to-r from-amber-500 to-orange-500'
  }[type];

  const icon = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    points: '⏳'
  }[type];

  const handleAction = () => {
    action?.onClick();
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isLeaving ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className={`${bgColor} text-white px-4 py-3 rounded-xl shadow-lg max-w-sm`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div className="flex-1">
            <span className="text-sm font-medium">{message}</span>
            {subMessage && (
              <div className="text-xs opacity-80 mt-0.5">{subMessage}</div>
            )}
          </div>
          {/* 關閉按鈕 */}
          <button 
            onClick={() => {
              setIsLeaving(true);
              setTimeout(onClose, 300);
            }}
            className="text-white/60 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
        {action && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleAction}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white text-sm py-1.5 px-3 rounded-lg transition-all"
            >
              {action.label}
            </button>
            <button
              onClick={() => {
                setIsLeaving(true);
                setTimeout(onClose, 300);
              }}
              className="bg-white/10 hover:bg-white/20 text-white/80 text-sm py-1.5 px-3 rounded-lg transition-all"
            >
              忽略
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Toast Manager Hook
interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'points';
  id: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  subMessage?: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = useCallback((
    message: string, 
    type: 'success' | 'error' | 'info' | 'points' = 'success',
    options?: { action?: ToastState['action']; subMessage?: string }
  ) => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id, ...options }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const ToastContainer = () => (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          action={toast.action}
          subMessage={toast.subMessage}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );

  return { showToast, ToastContainer };
}

