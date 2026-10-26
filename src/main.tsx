import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { migrar } from './almacenamiento/migraciones';
import { registrarServiceWorker } from './pwa/registro';
import './estilos/global.css';

migrar();
registrarServiceWorker();

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
