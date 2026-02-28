import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PrivateRoute - Protège les routes nécessitant une authentification
 * Si l'user n'est pas connecté → redirige vers /login
 * Pendant le chargement → affiche un spinner
 */
export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#EBF2FB',
        fontSize: '16px',
        color: '#26A69A',
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}