import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, onOpenLogin }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-bone-white">Authenticating access...</div>;
  }

  if (!isAuthenticated) {
    if (onOpenLogin) onOpenLogin();
    return (
      <div className="p-12 text-center text-onyx-black">
        <h2 className="text-xl font-bold">Authentication Required</h2>
        <p className="mt-2 text-sm text-gray-600">Please sign in to access this page.</p>
      </div>
    );
  }

  return children;
}
