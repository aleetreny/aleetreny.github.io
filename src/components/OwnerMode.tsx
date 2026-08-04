import { type FormEvent, useEffect, useState } from 'react';
import { createEntry } from '../lib/editor';
import {
  hasOwnerSession,
  isCurrentUserOwner,
  listDeletedEntries,
  listOwnerEntries,
  restoreDeletedContentEntry,
  signInOwner,
  signOutOwner,
  signUpOwner,
} from '../lib/content-repository';
import { runtimeConfig } from '../lib/config';
import type { DeletedEntrySummary, PortfolioEntry } from '../types/content';
import { ConfirmDialog } from './editor/ConfirmDialog';
import { EntryEditor } from './editor/EntryEditor';

type AuthState = 'checking' | 'signed-out' | 'signed-in';
type AccessAction = 'sign-in' | 'sign-up';

export function OwnerMode() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [accessAction, setAccessAction] = useState<AccessAction>('sign-in');
  const [candidateUserId, setCandidateUserId] = useState('');
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [deletedEntries, setDeletedEntries] = useState<DeletedEntrySummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inventoryView, setInventoryView] = useState<'active' | 'trash'>('active');
  const [authState, setAuthState] = useState<AuthState>(
    runtimeConfig.remoteDataEnabled ? 'checking' : 'signed-out',
  );
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('error');
  const [busy, setBusy] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<DeletedEntrySummary | null>(null);

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
        const [nextEntries, nextDeletedEntries] = await Promise.all([
          listOwnerEntries(),
          listDeletedEntries(),
        ]);
        if (active) {
          setEntries(nextEntries);
          setDeletedEntries(nextDeletedEntries);
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
    setCandidateUserId('');
    try {
      if (accessAction === 'sign-up') {
        const userId = await signUpOwner(name.trim(), email, password);
        await signOutOwner();
        setPassword('');
        setMessageTone('success');
        setMessage('Cuenta creada. Todavía no tiene permisos editoriales.');
        setCandidateUserId(userId);
        return;
      }
      await signInOwner(email, password);
      if (!(await isCurrentUserOwner())) {
        await signOutOwner();
        throw new Error('La cuenta es válida, pero no está en la allowlist de propietarios.');
      }
      const [nextEntries, nextDeletedEntries] = await Promise.all([
        listOwnerEntries(),
        listDeletedEntries(),
      ]);
      setEntries(nextEntries);
      setDeletedEntries(nextDeletedEntries);
      setSelectedId(nextEntries[0]?.id ?? null);
      setPassword('');
      setAuthState('signed-in');
    } catch (error) {
      setMessageTone('error');
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
      setDeletedEntries([]);
      setSelectedId(null);
      setInventoryView('active');
      setAuthState('signed-out');
    } finally {
      setBusy(false);
    }
  }

  async function reloadInventory() {
    setBusy(true);
    setMessage('');
    try {
      const [nextEntries, nextDeletedEntries] = await Promise.all([
        listOwnerEntries(),
        listDeletedEntries(),
      ]);
      setEntries(nextEntries);
      setDeletedEntries(nextDeletedEntries);
      if (selectedId && !nextEntries.some((entry) => entry.id === selectedId)) setSelectedId(null);
    } catch (error) {
      setMessageTone('error');
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar el inventario.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRestoreDeleted(entry: DeletedEntrySummary) {
    setBusy(true);
    setMessage('');
    try {
      const restored = await restoreDeletedContentEntry(entry);
      setDeletedEntries((current) => current.filter((item) => item.id !== entry.id));
      setEntries((current) => [restored, ...current]);
      setInventoryView('active');
      setSelectedId(restored.id);
      setMessageTone('success');
      setMessage(`“${restored.title}” se ha restaurado correctamente.`);
    } catch (error) {
      setMessageTone('error');
      setMessage(error instanceof Error ? error.message : 'No se pudo restaurar la entrada.');
    } finally {
      setBusy(false);
      setRestoreTarget(null);
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
        <h1 id="owner-title">{accessAction === 'sign-in' ? 'Acceso editorial' : 'Crear cuenta editorial'}</h1>
        <p>
          {accessAction === 'sign-in'
            ? 'Solo las cuentas autenticadas y añadidas a la allowlist privada obtienen permisos de escritura.'
            : 'Crear una cuenta no concede acceso por sí solo. Después, un operador debe añadir su UUID a la allowlist privada.'}
        </p>
        <form className="owner-form" onSubmit={handleSignIn}>
          {accessAction === 'sign-up' ? (
            <label>
              Nombre
              <input
                autoComplete="name"
                minLength={2}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </label>
          ) : null}
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
              autoComplete={accessAction === 'sign-in' ? 'current-password' : 'new-password'}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          <button className="button" disabled={busy} type="submit">
            {busy
              ? (accessAction === 'sign-in' ? 'Verificando…' : 'Creando…')
              : (accessAction === 'sign-in' ? 'Entrar' : 'Crear cuenta')}
          </button>
          <button
            className="button button--secondary"
            disabled={busy}
            onClick={() => {
              setAccessAction((current) => current === 'sign-in' ? 'sign-up' : 'sign-in');
              setMessage('');
              setCandidateUserId('');
              setPassword('');
            }}
            type="button"
          >
            {accessAction === 'sign-in' ? 'Crear una cuenta' : 'Ya tengo una cuenta'}
          </button>
          {message ? (
            <p
              className={messageTone === 'error' ? 'form-error' : 'form-success'}
              role={messageTone === 'error' ? 'alert' : 'status'}
            >
              {message}
              {candidateUserId ? <> Identificador: <code>{candidateUserId}</code></> : null}
            </p>
          ) : null}
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

      {message ? (
        <p
          className={messageTone === 'error' ? 'form-error' : 'form-success'}
          role={messageTone === 'error' ? 'alert' : 'status'}
        >
          {message}
        </p>
      ) : null}
      <div className="owner-workspace__layout">
        <aside className="entry-inventory" aria-label="Inventario de entradas">
          <div className="entry-inventory__tabs" aria-label="Estado de las entradas">
            <button
              aria-pressed={inventoryView === 'active'}
              className="entry-inventory__tab"
              onClick={() => setInventoryView('active')}
              type="button"
            >
              Entradas <span>{entries.length}</span>
            </button>
            <button
              aria-pressed={inventoryView === 'trash'}
              className="entry-inventory__tab"
              onClick={() => {
                setInventoryView('trash');
                setSelectedId(null);
              }}
              type="button"
            >
              Papelera <span>{deletedEntries.length}</span>
            </button>
          </div>
          {inventoryView === 'active' ? (
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
          ) : null}
          <div
            aria-label={inventoryView === 'active' ? 'Entradas activas' : 'Entradas eliminadas'}
            className="entry-inventory__list"
          >
            {inventoryView === 'active' ? entries.map((entry) => (
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
            )) : deletedEntries.map((entry) => (
              <article className="entry-inventory__deleted" key={entry.id}>
                <span>{entry.title}</span>
                <small>
                  Eliminada {new Date(entry.deletedAt).toLocaleString('es')} · v{entry.version}
                </small>
                <button
                  className="button button--secondary"
                  disabled={busy}
                  onClick={() => setRestoreTarget(entry)}
                  type="button"
                >
                  Restaurar
                </button>
              </article>
            ))}
            {inventoryView === 'trash' && deletedEntries.length === 0 ? (
              <p className="empty-state">La papelera está vacía.</p>
            ) : null}
          </div>
        </aside>

        <div className="owner-workspace__editor">
          {selectedEntry ? (
            <EntryEditor
              entry={selectedEntry}
              key={selectedEntry.id}
              onDeleted={(id) => {
                const deleted = entries.find((entry) => entry.id === id);
                setEntries((current) => current.filter((entry) => entry.id !== id));
                if (deleted) {
                  setDeletedEntries((current) => [{
                    id: deleted.id,
                    version: deleted.version + 1,
                    slug: deleted.slug,
                    title: deleted.title,
                    entryType: deleted.entryType,
                    status: deleted.status,
                    deletedAt: new Date().toISOString(),
                  }, ...current]);
                  setMessageTone('success');
                  setMessage(`“${deleted.title}” se ha movido a la papelera.`);
                }
                setSelectedId(null);
                setInventoryView('trash');
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

      {restoreTarget ? (
        <ConfirmDialog
          busy={busy}
          confirmLabel="Restaurar entrada"
          description={`“${restoreTarget.title}” volverá al inventario activo conservando su contenido y su historial.`}
          onCancel={() => setRestoreTarget(null)}
          onConfirm={() => void handleRestoreDeleted(restoreTarget)}
          title="¿Restaurar desde la papelera?"
        />
      ) : null}
    </section>
  );
}
