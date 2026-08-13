// Self-hosted type. Fraunces ships its full axis set (opsz / SOFT / WONK) —
// the display cut of the headline depends on them.
import '@fontsource-variable/fraunces/full.css';
import '@fontsource-variable/inter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root missing from index.html');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
