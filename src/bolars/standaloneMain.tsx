import React from 'react';
import ReactDOM from 'react-dom/client';
import { BolarsSelfCheckoutApp } from './BolarsSelfCheckoutApp';
import { createStandaloneRuntimeUrl } from './standaloneRuntimeUrl';
import '../styles/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BolarsSelfCheckoutApp runtimeUrl={createStandaloneRuntimeUrl(window.location.href)} />
  </React.StrictMode>
);
