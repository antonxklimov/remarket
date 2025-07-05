import './polyfills.js'
// Полифил для draft-js (fix: global is not defined)
window.global = window;

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminPanel from './components/AdminPanel.jsx'
import LoginForm from './components/LoginForm.jsx'
import { AuthProvider, useAuthContext } from './contexts/AuthContext.jsx'

// Компонент-обертка для защищенного роута
// function ProtectedAdminRoute() {
//   const { isAuthenticated } = useAuthContext();
//   if (!isAuthenticated) {
//     return <LoginForm onLoginSuccess={() => window.location.reload()} />;
//   }
//   return <AdminPanel />;
// }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
