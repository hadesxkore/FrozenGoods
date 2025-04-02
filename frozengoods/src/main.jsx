import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { getTheme } from './lib/utils'

// Import Lucide icons' CSS (for the icons used throughout the app)
import 'lucide-react/dist/esm/defaultAttributes'

// Initialize theme from local storage
const setInitialTheme = () => {
  const theme = getTheme();
  document.documentElement.classList.add(theme);
};
setInitialTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
