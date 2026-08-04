import { lazy, Suspense, useEffect, useState } from 'react';
import { PublicPortfolio } from './components/PublicPortfolio';
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

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href={ownerMode ? '/' : '#inicio'}>Alejandro Treny</a>
        <nav aria-label="Navegación principal">
          {ownerMode ? (
            <a href="/">Portfolio</a>
          ) : (
            <>
              <a href="#proyectos">Proyectos</a>
              <a href="#experiencia">Experiencia</a>
              <a href="#contacto">Contacto</a>
              <a href="?owner=1">Propietario</a>
            </>
          )}
        </nav>
      </header>

      <main>
        {ownerMode ? (
          <Suspense fallback={<p className="loading-state" role="status">Cargando editor…</p>}>
            <OwnerMode />
          </Suspense>
        ) : (
          <>
            {loading ? <p className="loading-state" role="status">Cargando portfolio…</p> : null}
            {error ? <p className="form-error site-error" role="alert">{error}</p> : null}
            {!loading ? (
              <PublicPortfolio entries={entries} remoteDataEnabled={runtimeConfig.remoteDataEnabled} />
            ) : null}
          </>
        )}
      </main>

      <footer>
        <span>© {new Date().getFullYear()} Alejandro Treny</span>
        <span>Diseñado para ser reproducible desde GitHub.</span>
      </footer>
    </div>
  );
}
