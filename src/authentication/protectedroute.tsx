import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();

    // Check localStorage as well to prevent flicker on refresh before context hydrates
    const storedAuth = localStorage.getItem('isAuthenticated') === 'true';

    if (!isAuthenticated && !storedAuth) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
