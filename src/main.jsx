import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from "./contexts/ThemeContext";
import { OfflineProvider } from "./contexts/OfflineContext";
import "./i18n/config";
import './index.css'
import App from './App.jsx'

const link = document.createElement("link");
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined";
document.head.appendChild(link);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <OfflineProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </OfflineProvider>
    </ThemeProvider>
  </StrictMode>,
)
