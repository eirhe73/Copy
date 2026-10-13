import './bootstrap/backend-env'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { HomeRegionProvider } from './context/HomeRegionContext.tsx'
import './styles/app-overrides.css'

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <AuthProvider>
      <HomeRegionProvider>
        <App />
      </HomeRegionProvider>
    </AuthProvider>
  </HashRouter>,
)
