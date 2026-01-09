import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './authentication/AuthContext';
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="232841381092-8c1brgamv08b833qbn7t8fg7cgoi3vsa.apps.googleusercontent.com">
      <AuthProvider>
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
