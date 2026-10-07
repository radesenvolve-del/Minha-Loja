import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure any stale service worker is completely unregistered to prevent freezing
if ('serviceWorker' in navigator && typeof window !== 'undefined') {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (const name of names) {
        caches.delete(name);
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
