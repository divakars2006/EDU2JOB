import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './authentication/AuthContext';
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
