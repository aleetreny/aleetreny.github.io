import { lazy, Suspense, useEffect, useState } from 'react';
import { CorkboardPortfolio } from './components/CorkboardPortfolio';
import { listPublishedEntries } from './lib/content-repository';
import { runtimeConfig } from './lib/config';
import type { PortfolioEntry } from './types/content';

const OwnerMode = lazy(() => import('./components/OwnerMode').then((module) => ({
  default: module.OwnerMode,
})));

export default function App() {
  const ownerMode = new URLSearchParams(window.location.search).get('owner') === '1';
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!ownerMode);

  useEffect(() => {
    if (ownerMode) return;
    let active = true;
    listPublishedEntries()
      .then((nextEntries) => {
        if (active) {
          setEntries(nextEntries);
          setLoading(false);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'No se pudo cargar el contenido.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [ownerMode]);

  if (!ownerMode) {
    return (
      <CorkboardPortfolio
        entries={entries}
        error={error}
        loading={loading}
        remoteDataEnabled={runtimeConfig.remoteDataEnabled}
      />
    );
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="/">Alejandro Treny</a>
        <nav aria-label="Navegación principal"><a href="/">Volver al tablero</a></nav>
      </header>
      <Suspense fallback={<p className="loading-state" role="status">Cargando editor…</p>}>
        <OwnerMode />
      </Suspense>
    </div>
  );
}
