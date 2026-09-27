import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  // Dev only: error objects and component stacks can carry internals, so they
  // are not written to a production console.
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
