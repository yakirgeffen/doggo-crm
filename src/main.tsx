import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('Main.tsx executing...');
const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

createRoot(rootElement!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
