'use client'

import { Provider } from 'react-redux'
import { store } from '@/store'
import { AuthProvider } from '@/components/AuthProvider'
import { ToastProvider } from '@/components/ToastProvider'
import ErrorBoundary from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </Provider>
  )
}





