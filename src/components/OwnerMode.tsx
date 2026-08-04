import { type FormEvent, useState } from 'react';
import {
  isCurrentUserOwner,
  listOwnerEntries,
  signInOwner,
  signOutOwner,
} from '../lib/content-repository';
import { runtimeConfig } from '../lib/config';
import type { PortfolioEntry } from '../types/content';
import { EntryCard } from './EntryCard';

export function OwnerMode() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [entries, setEntries] = useState<PortfolioEntry[] | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!runtimeConfig.remoteDataEnabled) {
    return (
      <section className="owner-panel" aria-labelledby="owner-title">
        <p className="eyebrow">Modo propietario</p>
        <h1 id="owner-title">Neon todavía no está conectado</h1>
        <p>
          La interfaz pública funciona con fixtures. Configura las variables de <code>.env.example</code>,
          aplica las migraciones y vuelve a cargar esta ruta para activar autenticación.
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
      setEntries(await listOwnerEntries());
      setPassword('');
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
      setEntries(null);
    } finally {
      setBusy(false);
    }
  }

  if (entries) {
    return (
      <section className="owner-panel" aria-labelledby="owner-title">
        <div className="owner-panel__header">
          <div>
            <p className="eyebrow">Modo propietario</p>
            <h1 id="owner-title">Inventario editorial</h1>
          </div>
          <button className="button button--secondary" disabled={busy} onClick={handleSignOut}>
            Cerrar sesión
          </button>
        </div>
        <p className="owner-note">
          La autenticación, RLS y lectura de borradores están conectadas. La edición visual se implementará
          en la siguiente fase; consulta <code>PROJECT_STATUS.md</code> antes de modificar el esquema.
        </p>
        <div className="entry-grid">
          {entries.map((entry) => (
            <EntryCard entry={entry} key={entry.id} showStatus />
          ))}
        </div>
      </section>
    );
  }

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
