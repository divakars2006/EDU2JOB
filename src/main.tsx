import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './authentication/AuthContext';
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="1039201455328-lpcts2vvvdru343nipkt60cpv8n5td8f.apps.googleusercontent.com">
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
