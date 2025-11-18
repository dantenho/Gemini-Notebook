
/**
 * @fileoverview Application Entry Point
 *
 * Initializes the React application with error boundary protection.
 * Wraps the main App component in ErrorBoundary for graceful error handling.
 *
 * @module index
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
