import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="text-center py-10">
      <h2 className="text-5xl font-bold text-blue-900 mb-4">404</h2>
      <p className="text-xl text-gray-600 mb-6">Seite nicht gefunden</p>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
        Die angeforderte Seite existiert nicht oder wurde verschoben.
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Zurück zum Dashboard
      </Link>
    </div>
  );
};

export default NotFound;