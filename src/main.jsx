import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import QueryProvider from './providers/QueryProvider.jsx'

// Rehydrate auth stores from localStorage on app start
import { useAuthStore, useCustomerAuthStore } from './stores/authStore.js'

// Initialize auth state from localStorage
useAuthStore.getState().rehydrate()
useCustomerAuthStore.getState().rehydrate()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <App />
      </QueryProvider>
    </ErrorBoundary>
  </StrictMode>,
)
