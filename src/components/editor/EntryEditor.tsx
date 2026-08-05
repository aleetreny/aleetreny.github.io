import { useState, type FormEvent } from 'react';
import { slugify } from '../../lib/editor';
import {
  deleteContentEntry,
  listEntryVersions,
  restoreEntryVersion,
  saveContentEntry,
} from '../../lib/content-repository';
import { portfolioEntrySchema, type EntryVersionSummary, type PortfolioEntry } from '../../types/content';
import { BlockEditor } from './BlockEditor';
import { ConfirmDialog } from './ConfirmDialog';

type EntryEditorProps = {
  entry: PortfolioEntry;
  onDeleted: (id: string) => void;
  onSaved: (entry: PortfolioEntry) => void;
};

type PendingConfirmation = { kind: 'delete' } | { kind: 'restore'; version: number };

function metadataString(entry: PortfolioEntry, key: string): string {
  return typeof entry.metadata[key] === 'string' ? entry.metadata[key] : '';
}

export function EntryEditor({ entry, onDeleted, onSaved }: EntryEditorProps) {
  const [draft, setDraft] = useState(entry);
  const [slugTouched, setSlugTouched] = useState(entry.version > 0);
  const [versions, setVersions] = useState<EntryVersionSummary[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<PendingConfirmation | null>(null);

  const updateMetadata = (key: string, value: unknown) => {
    setDraft((current) => ({ ...current, metadata: { ...current.metadata, [key]: value } }));
  };

  async function refreshVersions(entryId = draft.id) {
    setVersions(await listEntryVersions(entryId));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const validated = portfolioEntrySchema.parse({
        ...draft,
        slug: slugify(draft.slug),
        blocks: draft.blocks.map((block, position) => ({ ...block, position })),
      });
      const saved = await saveContentEntry(validated);
      setDraft(saved);
      setSlugTouched(true);
      onSaved(saved);
      await refreshVersions(saved.id);
      setMessage(`Guardado como versión ${saved.version}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar la entrada.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError('');
    try {
      await deleteContentEntry(draft);
      onDeleted(draft.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar la entrada.');
    } finally {
      setBusy(false);
      setConfirmation(null);
    }
  }

  async function handleRestore(version: number) {
    setBusy(true);
    setError('');
    try {
      const restored = await restoreEntryVersion(draft.id, version, draft.version);
      setDraft(restored);
      onSaved(restored);
      await refreshVersions(restored.id);
      setMessage(`Versión ${version} restaurada; ahora estás en la versión ${restored.version}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo restaurar la versión.');
    } finally {
      setBusy(false);
      setConfirmation(null);
    }
  }

  return (
    <form className="entry-editor" onSubmit={handleSave}>
      <div className="entry-editor__header">
        <div>
          <p className="eyebrow">{draft.version === 0 ? 'Nueva entrada' : `Versión ${draft.version}`}</p>
          <h2>{draft.title || 'Entrada sin título'}</h2>
        </div>
        <div className="entry-editor__actions">
          {draft.version > 0 ? (
            <button
              className="button button--danger"
              disabled={busy}
              onClick={() => setConfirmation({ kind: 'delete' })}
              type="button"
            >
              Eliminar
            </button>
          ) : null}
          <button className="button" disabled={busy} type="submit">
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <fieldset className="editor-section" disabled={busy}>
        <legend>Identidad y publicación</legend>
        <label>
          Título
          <input
            onChange={(event) => {
              const title = event.target.value;
              setDraft((current) => ({
                ...current,
                title,
                slug: current.version === 0 && !slugTouched ? slugify(title) : current.slug,
              }));
            }}
            required
            value={draft.title}
          />
        </label>
        <label>
          Slug
          <input
            onChange={(event) => {
              setSlugTouched(true);
              setDraft((current) => ({ ...current, slug: event.target.value }));
            }}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
            value={draft.slug}
          />
        </label>
        <label>
          Resumen
          <textarea
            onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
            rows={4}
            value={draft.summary}
          />
        </label>
        <div className="field-grid field-grid--two">
          <label>
            Tipo
            <select
              onChange={(event) => setDraft((current) => ({
                ...current,
                entryType: event.target.value as PortfolioEntry['entryType'],
              }))}
              value={draft.entryType}
            >
              <option value="project">Proyecto</option>
              <option value="case-study">Caso de estudio</option>
              <option value="experience">Experiencia</option>
              <option value="education">Formación</option>
              <option value="note">Nota</option>
              <option value="custom">Personalizado</option>
            </select>
          </label>
          <label>
            Estado
            <select
              onChange={(event) => setDraft((current) => ({
                ...current,
                status: event.target.value as PortfolioEntry['status'],
              }))}
              value={draft.status}
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="editor-section" disabled={busy}>
        <legend>Metadatos de presentación</legend>
        <div className="field-grid field-grid--two">
          <label>
            Organización
            <input
              onChange={(event) => updateMetadata('organization', event.target.value)}
              value={metadataString(draft, 'organization')}
            />
          </label>
          <label>
            Periodo
            <input
              onChange={(event) => updateMetadata('period', event.target.value)}
              placeholder="2024 — presente"
              value={metadataString(draft, 'period')}
            />
          </label>
        </div>
        <div className="field-grid field-grid--two">
          <label>
            Archivo / sección
            <select
              onChange={(event) => updateMetadata('section', event.target.value)}
              value={metadataString(draft, 'section') || 'products'}
            >
              <option value="research">Research systems</option>
              <option value="ai">AI / interfaces</option>
              <option value="civic">Civic intelligence</option>
              <option value="products">Products in the wild</option>
              <option value="experiments">Interactive experiments</option>
              <option value="career">Career field notes</option>
              <option value="education">Education / awards</option>
              <option value="community">Community / culture</option>
              <option value="profile">Numbers with context</option>
            </select>
          </label>
          <label>
            Dato o señal breve
            <input
              maxLength={32}
              onChange={(event) => updateMetadata('signal', event.target.value)}
              placeholder="Ej.: 22 fuentes"
              value={metadataString(draft, 'signal')}
            />
          </label>
        </div>
        <label>
          Temas, separados por comas
          <input
            onChange={(event) => updateMetadata(
              'topics',
              event.target.value.split(',').map((topic) => topic.trim()).filter(Boolean),
            )}
            value={Array.isArray(draft.metadata.topics) ? draft.metadata.topics.join(', ') : ''}
          />
        </label>
        <div className="field-grid field-grid--two">
          <label>
            URL pública del proyecto
            <input
              onChange={(event) => updateMetadata('projectUrl', event.target.value)}
              placeholder="https://…"
              type="url"
              value={metadataString(draft, 'projectUrl')}
            />
          </label>
          <label>
            URL del repositorio
            <input
              onChange={(event) => updateMetadata('repositoryUrl', event.target.value)}
              placeholder="https://github.com/…"
              type="url"
              value={metadataString(draft, 'repositoryUrl')}
            />
          </label>
        </div>
        <label className="checkbox-field">
          <input
            checked={draft.metadata.featured === true}
            onChange={(event) => updateMetadata('featured', event.target.checked)}
            type="checkbox"
          />
          Destacar en la portada
        </label>
      </fieldset>

      <BlockEditor
        blocks={draft.blocks}
        disabled={busy}
        onChange={(blocks) => setDraft((current) => ({ ...current, blocks }))}
      />

      {message ? <p className="form-success" role="status">{message}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}

      {draft.version > 0 ? (
        <section className="version-history" aria-labelledby="version-history-title">
          <div className="version-history__header">
            <h3 id="version-history-title">Historial de versiones</h3>
            <button
              className="button button--secondary"
              disabled={busy}
              onClick={() => refreshVersions().catch((reason: unknown) => {
                setError(reason instanceof Error ? reason.message : 'No se pudo cargar el historial.');
              })}
              type="button"
            >
              {versions ? 'Actualizar' : 'Cargar historial'}
            </button>
          </div>
          {versions?.length === 0 ? <p className="empty-state">Aún no hay versiones anteriores.</p> : null}
          {versions ? (
            <ol className="version-list">
              {versions.map((version) => (
                <li key={version.id}>
                  <div>
                    <strong>Versión {version.version}</strong>
                    <span>{version.reason || 'Sin descripción'} · {new Date(version.createdAt).toLocaleString('es')}</span>
                  </div>
                  <button
                    className="button button--secondary"
                    disabled={busy}
                    onClick={() => setConfirmation({ kind: 'restore', version: version.version })}
                    type="button"
                  >
                    Restaurar
                  </button>
                </li>
              ))}
            </ol>
          ) : null}
        </section>
      ) : null}

      {confirmation ? (
        <ConfirmDialog
          busy={busy}
          confirmLabel={confirmation.kind === 'delete' ? 'Mover a la papelera' : 'Restaurar versión'}
          description={confirmation.kind === 'delete'
            ? `“${draft.title || 'Esta entrada'}” dejará de estar activa, pero podrás recuperarla desde la papelera.`
            : `La versión actual quedará guardada en el historial antes de recuperar la versión ${confirmation.version}.`}
          onCancel={() => setConfirmation(null)}
          onConfirm={() => {
            if (confirmation.kind === 'delete') void handleDelete();
            else void handleRestore(confirmation.version);
          }}
          title={confirmation.kind === 'delete' ? '¿Mover esta entrada a la papelera?' : `¿Restaurar la versión ${confirmation.version}?`}
          tone={confirmation.kind === 'delete' ? 'danger' : 'default'}
        />
      ) : null}
    </form>
  );
}
