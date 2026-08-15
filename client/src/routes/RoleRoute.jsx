import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function RoleRoute({ allowedRoles = [], children }) {
  const { currentUser, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-bone-white">Verifying authorization permissions...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="p-12 text-center text-onyx-black">
        <h2 className="text-xl font-bold">Authentication Required</h2>
        <p className="mt-2 text-sm text-gray-600">Please sign in to proceed.</p>
      </div>
    );
  }

  if (!allowedRoles.includes(currentUser?.role)) {
    return (
      <div className="p-12 text-center text-red-600 bg-red-50 rounded-xl m-8 border border-red-200">
        <h2 className="text-xl font-bold">403 Forbidden Access</h2>
        <p className="mt-2 text-sm text-red-700">
          Your account role ('{currentUser?.role}') does not have authorization to view this section.
        </p>
      </div>
    );
  }

  return children;
}
