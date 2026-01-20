import { useEffect } from 'react';

/**
 * Deprecated: Admin login is now unified with the main login page.
 * This component handles legacy redirects.
 */
export default function AdminLogin() {
    useEffect(() => {
        // Redirection to main login
        window.location.href = '/login';
    }, []);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#0f172a',
            color: 'white'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h2>Redirecting to Unified Login...</h2>
                <p>Admin portal access is now via the main login page.</p>
            </div>
        </div>
    );
}
