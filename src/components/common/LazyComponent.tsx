/**
 * TimeBar - 懶加載組件
 * 帶有 loading 和錯誤處理的 React.lazy 包裝
 */

import { Suspense, type ComponentType, type ReactNode, lazy } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

export interface LazyComponentOptions {
  /** 載入中的 UI */
  fallback?: ReactNode;
  /** 錯誤時的 UI */
  errorFallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** 預載延遲 (ms) */
  preloadDelay?: number;
}

/**
 * 默認載入中 UI
 */
function DefaultLoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '200px',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '3px solid #e4e4e7',
        borderTopColor: '#10b981',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/**
 * 創建懶加載組件
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): T {
  const LazyComponent = lazy(importFn);
  const {
    fallback = <DefaultLoadingFallback />,
    errorFallback,
  } = options;

  const WrappedComponent = (props: any) => (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `Lazy(${LazyComponent.displayName || 'Component'})`;

  // 預載功能
  (WrappedComponent as any).preload = importFn;

  return WrappedComponent as unknown as T;
}

/**
 * 預載多個組件
 */
export async function preloadComponents(
  components: Array<{ preload: () => Promise<any> }>
): Promise<void> {
  await Promise.all(components.map((c) => c.preload()));
}
