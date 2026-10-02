import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initDNSFairFoundation } from './services/foundation';
import './styles/index.css';

initDNSFairFoundation();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
