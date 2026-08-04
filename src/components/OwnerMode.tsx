import { type FormEvent, useEffect, useState } from 'react';
import { createEntry } from '../lib/editor';
import {
  hasOwnerSession,
  isCurrentUserOwner,
  listOwnerEntries,
  signInOwner,
  signOutOwner,
} from '../lib/content-repository';
import { runtimeConfig } from '../lib/config';
import type { PortfolioEntry } from '../types/content';
import { EntryEditor } from './editor/EntryEditor';

type AuthState = 'checking' | 'signed-out' | 'signed-in';

export function OwnerMode() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>(
    runtimeConfig.remoteDataEnabled ? 'checking' : 'signed-out',
  );
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!runtimeConfig.remoteDataEnabled) {
      return;
    }

    let active = true;
    async function restoreSession() {
      try {
        if (!(await hasOwnerSession()) || !(await isCurrentUserOwner())) {
          if (active) setAuthState('signed-out');
          return;
        }
        const nextEntries = await listOwnerEntries();
        if (active) {
          setEntries(nextEntries);
          setSelectedId(nextEntries[0]?.id ?? null);
          setAuthState('signed-in');
        }
      } catch {
        if (active) setAuthState('signed-out');
      }
    }
    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  if (!runtimeConfig.remoteDataEnabled) {
    return (
      <section className="owner-panel owner-panel--narrow" aria-labelledby="owner-title">
        <p className="eyebrow">Modo propietario</p>
        <h1 id="owner-title">Neon todavía no está conectado</h1>
        <p>
          La interfaz pública funciona con fixtures versionados. Configura las variables de <code>.env.example</code>,
          aplica las migraciones y vuelve a cargar esta ruta para activar autenticación y edición.
        </p>
      </section>
    );
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      await signInOwner(email, password);
      if (!(await isCurrentUserOwner())) {
        await signOutOwner();
        throw new Error('La cuenta es válida, pero no está en la allowlist de propietarios.');
      }
      const nextEntries = await listOwnerEntries();
      setEntries(nextEntries);
      setSelectedId(nextEntries[0]?.id ?? null);
      setPassword('');
      setAuthState('signed-in');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOutOwner();
      setEntries([]);
      setSelectedId(null);
      setAuthState('signed-out');
    } finally {
      setBusy(false);
    }
  }

  async function reloadInventory() {
    setBusy(true);
    setMessage('');
    try {
      const nextEntries = await listOwnerEntries();
      setEntries(nextEntries);
      if (selectedId && !nextEntries.some((entry) => entry.id === selectedId)) setSelectedId(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar el inventario.');
    } finally {
      setBusy(false);
    }
  }

  if (authState === 'checking') {
    return (
      <section className="owner-panel owner-panel--narrow" aria-live="polite">
        <p className="eyebrow">Modo propietario</p>
        <h1>Recuperando la sesión…</h1>
      </section>
    );
  }

  if (authState === 'signed-out') {
    return (
      <section className="owner-panel owner-panel--narrow" aria-labelledby="owner-title">
        <p className="eyebrow">Modo propietario</p>
        <h1 id="owner-title">Acceso editorial</h1>
        <p>Solo las cuentas autenticadas y añadidas a la allowlist privada obtienen permisos de escritura.</p>
        <form className="owner-form" onSubmit={handleSignIn}>
          <label>
            Correo
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Contraseña
            <input
              autoComplete="current-password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button className="button" disabled={busy} type="submit">
            {busy ? 'Verificando…' : 'Entrar'}
          </button>
          {message ? <p className="form-error" role="alert">{message}</p> : null}
        </form>
      </section>
    );
  }

  const selectedEntry = entries.find((entry) => entry.id === selectedId) ?? null;

  return (
    <section className="owner-workspace" aria-labelledby="owner-title">
      <header className="owner-workspace__header">
        <div>
          <p className="eyebrow">Modo propietario</p>
          <h1 id="owner-title">Estudio editorial</h1>
        </div>
        <div className="owner-workspace__actions">
          <button className="button button--secondary" disabled={busy} onClick={reloadInventory} type="button">
            Actualizar
          </button>
          <button className="button button--secondary" disabled={busy} onClick={handleSignOut} type="button">
            Cerrar sesión
          </button>
        </div>
      </header>

      {message ? <p className="form-error" role="alert">{message}</p> : null}
      <div className="owner-workspace__layout">
        <aside className="entry-inventory" aria-label="Inventario de entradas">
          <button
            className="button entry-inventory__new"
            disabled={busy}
            onClick={() => {
              const entry = createEntry();
              setEntries((current) => [entry, ...current]);
              setSelectedId(entry.id);
            }}
            type="button"
          >
            Nueva entrada
          </button>
          <div className="entry-inventory__list">
            {entries.map((entry) => (
              <button
                aria-current={entry.id === selectedId ? 'true' : undefined}
                className="entry-inventory__item"
                key={entry.id}
                onClick={() => setSelectedId(entry.id)}
                type="button"
              >
                <span>{entry.title || 'Entrada sin título'}</span>
                <small>{entry.entryType} · {entry.status} · v{entry.version}</small>
              </button>
            ))}
          </div>
        </aside>

        <div className="owner-workspace__editor">
          {selectedEntry ? (
            <EntryEditor
              entry={selectedEntry}
              key={selectedEntry.id}
              onDeleted={(id) => {
                setEntries((current) => current.filter((entry) => entry.id !== id));
                setSelectedId(null);
              }}
              onSaved={(saved) => {
                setEntries((current) => {
                  const exists = current.some((entry) => entry.id === saved.id);
                  return exists
                    ? current.map((entry) => (entry.id === saved.id ? saved : entry))
                    : [saved, ...current];
                });
                setSelectedId(saved.id);
              }}
            />
          ) : (
            <div className="empty-state empty-state--large">
              <p>Selecciona una entrada o crea una nueva para comenzar.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
