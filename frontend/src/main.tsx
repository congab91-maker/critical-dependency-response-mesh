import React from 'react';
import ReactDOM from 'react-dom/client';
import { WalletProvider } from './wallet/WalletContext';
import { App } from './App';
import './styles/tokens.css';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>
);
