import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

createRoot(document.getElementById('root')!, {
  onCaughtError: (error, errorInfo) => {
    if (import.meta.env.DEV) {
      console.error(error, errorInfo.componentStack);
    }
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
