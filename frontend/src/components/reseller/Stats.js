import React from 'react';

const Stats = ({ stats }) => {
  const {
    assigned = 0,
    received = 0,
    sold = 0,
    // returned wird nicht mehr verwendet/angezeigt
    totalRevenue = 0
  } = stats;

  // Debug-Ausgabe in der Konsole
  console.log('Stats Komponente erhalten (bereinigt):', stats);

  const total = assigned + received + sold; // returned nicht mehr enthalten

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">📦</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Zugewiesen
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {assigned}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">✓</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Erhalten
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {received}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">💰</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Verkauft
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {sold}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">€</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Reseller-Umsatz
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {totalRevenue > 0 ? `${totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€` : '0,00€'}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Optional: Hinweis für Reseller über versteckte entzogene Geräte */}
      <div className="col-span-full bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-700">
          <span className="font-medium">ℹ️ Hinweis:</span> Diese Statistiken zeigen nur Ihre aktiven Gerätezuweisungen. 
          Von Administratoren entzogene Geräte werden nicht angezeigt.
        </p>
      </div>

      {/* Debug-Info (nur in Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="col-span-full bg-gray-100 p-3 rounded text-xs">
          <strong>Debug (bereinigt):</strong> {JSON.stringify(stats)}
        </div>
      )}
    </div>
  );
};

export default Stats;