import { useEffect, useState } from 'react';
import { EntryCard } from './components/EntryCard';
import { OwnerMode } from './components/OwnerMode';
import { listPublishedEntries } from './lib/content-repository';
import { runtimeConfig } from './lib/config';
import type { PortfolioEntry } from './types/content';

export default function App() {
  const ownerMode = new URLSearchParams(window.location.search).get('owner') === '1';
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ownerMode) return;
    let active = true;

    listPublishedEntries()
      .then((nextEntries) => {
        if (active) setEntries(nextEntries);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'No se pudo cargar el contenido.');
      });

    return () => {
      active = false;
    };
  }, [ownerMode]);

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="/">Alejandro Treny</a>
        <nav aria-label="Navegación principal">
          <a href={ownerMode ? '/' : '?owner=1'}>{ownerMode ? 'Portfolio' : 'Propietario'}</a>
          <a href="https://github.com/aleetreny" rel="noreferrer" target="_blank">GitHub</a>
        </nav>
      </header>

      <main>
        {ownerMode ? (
          <OwnerMode />
        ) : (
          <>
            <section className="hero">
              <p className="eyebrow">Estadística · datos · producto</p>
              <h1>Modelos rigurosos, decisiones que se pueden explicar.</h1>
              <p className="hero__lede">
                Portfolio evolutivo de proyectos de ciencia de datos, forecasting y optimización. El
                contenido se publica desde un modo propietario protegido y se entrega como sitio estático.
              </p>
              <div className="runtime-badge">
                <span aria-hidden="true" />
                {runtimeConfig.remoteDataEnabled ? 'Contenido servido por Neon' : 'Vista reproducible con fixtures'}
              </div>
            </section>

            <section className="work" aria-labelledby="work-title">
              <div className="section-heading">
                <p className="eyebrow">Trabajo seleccionado</p>
                <h2 id="work-title">Casos y proyectos</h2>
              </div>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              <div className="entry-grid">
                {entries.map((entry) => (
                  <EntryCard entry={entry} key={entry.id} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <footer>
        <span>Construido para poder continuar desde cualquier ordenador.</span>
        <a href="mailto:alejandrotreny100@gmail.com">Contacto</a>
      </footer>
    </div>
  );
}
