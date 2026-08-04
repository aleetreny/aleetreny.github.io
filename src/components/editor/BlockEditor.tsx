import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, type ChangeEvent } from 'react';
import { createBlock, normalizeBlockPositions, type EditableBlockType } from '../../lib/editor';
import { uploadImage } from '../../lib/content-repository';
import type { ContentBlock } from '../../types/content';

type BlockEditorProps = {
  blocks: ContentBlock[];
  disabled?: boolean;
  onChange: (blocks: ContentBlock[]) => void;
};

type SortableBlockProps = {
  block: ContentBlock;
  disabled: boolean;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, block: ContentBlock) => void;
};

function stringProp(block: ContentBlock, key: string): string {
  return typeof block.props[key] === 'string' ? block.props[key] : '';
}

function SortableBlock({
  block,
  disabled,
  index,
  total,
  onMove,
  onRemove,
  onUpdate,
}: SortableBlockProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const updateProps = (next: Record<string, unknown>) => {
    onUpdate(block.id, { ...block, props: { ...block.props, ...next } });
  };
  const updateLayout = (next: Record<string, unknown>) => {
    onUpdate(block.id, { ...block, layout: { ...block.layout, ...next } });
  };

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const asset = await uploadImage(file, stringProp(block, 'alt'));
      updateProps({ url: asset.publicUrl, assetId: asset.id });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  return (
    <article
      className={`block-editor__item${isDragging ? ' block-editor__item--dragging' : ''}`}
      ref={setNodeRef}
      style={style}
    >
      <div className="block-editor__toolbar">
        <button
          aria-label={`Arrastrar bloque ${index + 1}`}
          className="icon-button drag-handle"
          disabled={disabled}
          type="button"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <strong>{block.type}</strong>
        <span className="block-editor__position">{index + 1}/{total}</span>
        <button
          aria-label="Mover bloque hacia arriba"
          className="icon-button"
          disabled={disabled || index === 0}
          onClick={() => onMove(index, index - 1)}
          type="button"
        >
          ↑
        </button>
        <button
          aria-label="Mover bloque hacia abajo"
          className="icon-button"
          disabled={disabled || index === total - 1}
          onClick={() => onMove(index, index + 1)}
          type="button"
        >
          ↓
        </button>
        <button
          aria-label="Eliminar bloque"
          className="icon-button icon-button--danger"
          disabled={disabled}
          onClick={() => onRemove(block.id)}
          type="button"
        >
          ×
        </button>
      </div>

      <div className="block-editor__fields">
        {block.type === 'text' || block.type === 'heading' ? (
          <label>
            Texto
            <textarea
              disabled={disabled}
              onChange={(event) => updateProps({ text: event.target.value })}
              rows={block.type === 'text' ? 5 : 2}
              value={stringProp(block, 'text')}
            />
          </label>
        ) : null}

        {block.type === 'list' ? (
          <label>
            Elementos, uno por línea
            <textarea
              disabled={disabled}
              onChange={(event) => updateProps({ items: event.target.value.split('\n') })}
              rows={5}
              value={Array.isArray(block.props.items) ? block.props.items.join('\n') : ''}
            />
          </label>
        ) : null}

        {block.type === 'metric' ? (
          <div className="field-grid field-grid--two">
            <label>
              Valor
              <input
                disabled={disabled}
                onChange={(event) => updateProps({ value: event.target.value })}
                value={stringProp(block, 'value')}
              />
            </label>
            <label>
              Etiqueta
              <input
                disabled={disabled}
                onChange={(event) => updateProps({ label: event.target.value })}
                value={stringProp(block, 'label')}
              />
            </label>
          </div>
        ) : null}

        {block.type === 'quote' ? (
          <>
            <label>
              Cita
              <textarea
                disabled={disabled}
                onChange={(event) => updateProps({ text: event.target.value })}
                rows={4}
                value={stringProp(block, 'text')}
              />
            </label>
            <label>
              Atribución
              <input
                disabled={disabled}
                onChange={(event) => updateProps({ attribution: event.target.value })}
                value={stringProp(block, 'attribution')}
              />
            </label>
          </>
        ) : null}

        {block.type === 'image' ? (
          <>
            <label>
              Texto alternativo
              <input
                disabled={disabled}
                onChange={(event) => updateProps({ alt: event.target.value })}
                required
                value={stringProp(block, 'alt')}
              />
            </label>
            <label>
              URL pública
              <input
                disabled={disabled}
                onChange={(event) => updateProps({ url: event.target.value, assetId: '' })}
                type="url"
                value={stringProp(block, 'url')}
              />
            </label>
            <label className="file-picker">
              O subir imagen (AVIF, GIF, JPEG, PNG o WebP; máximo 10 MiB)
              <input
                accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
                disabled={disabled || uploading}
                onChange={handleFile}
                type="file"
              />
            </label>
            {stringProp(block, 'url') ? (
              <img className="block-editor__preview" src={stringProp(block, 'url')} alt="Previsualización del bloque" />
            ) : null}
            {uploading ? <p className="form-note" role="status">Subiendo imagen…</p> : null}
            {uploadError ? <p className="form-error" role="alert">{uploadError}</p> : null}
          </>
        ) : null}

        <div className="field-grid field-grid--two">
          <label>
            Anchura
            <select
              disabled={disabled}
              onChange={(event) => updateLayout({ width: event.target.value })}
              value={typeof block.layout.width === 'string' ? block.layout.width : 'wide'}
            >
              <option value="narrow">Estrecha</option>
              <option value="medium">Media</option>
              <option value="wide">Ancha</option>
              <option value="full">Completa</option>
            </select>
          </label>
          <label>
            Alineación
            <select
              disabled={disabled}
              onChange={(event) => updateLayout({ align: event.target.value })}
              value={typeof block.layout.align === 'string' ? block.layout.align : 'start'}
            >
              <option value="start">Inicio</option>
              <option value="center">Centro</option>
              <option value="end">Final</option>
            </select>
          </label>
        </div>
      </div>
    </article>
  );
}

export function BlockEditor({ blocks, disabled = false, onChange }: BlockEditorProps) {
  const [newBlockType, setNewBlockType] = useState<EditableBlockType>('text');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function moveBlock(from: number, to: number) {
    onChange(normalizeBlockPositions(arrayMove(blocks, from, to)));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((block) => block.id === active.id);
    const to = blocks.findIndex((block) => block.id === over.id);
    if (from >= 0 && to >= 0) moveBlock(from, to);
  }

  function updateBlock(id: string, next: ContentBlock) {
    onChange(blocks.map((block) => (block.id === id ? next : block)));
  }

  return (
    <fieldset className="block-editor" disabled={disabled}>
      <legend>Bloques de contenido</legend>
      {blocks.length === 0 ? <p className="empty-state">Todavía no hay bloques.</p> : null}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
        <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
          <div className="block-editor__list">
            {blocks.map((block, index) => (
              <SortableBlock
                block={block}
                disabled={disabled}
                index={index}
                key={block.id}
                onMove={moveBlock}
                onRemove={(id) => onChange(normalizeBlockPositions(blocks.filter((item) => item.id !== id)))}
                onUpdate={updateBlock}
                total={blocks.length}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <div className="block-editor__add">
        <label>
          Tipo de bloque
          <select
            disabled={disabled}
            onChange={(event) => setNewBlockType(event.target.value as EditableBlockType)}
            value={newBlockType}
          >
            <option value="text">Texto</option>
            <option value="heading">Título</option>
            <option value="list">Lista</option>
            <option value="metric">Métrica</option>
            <option value="quote">Cita</option>
            <option value="image">Imagen</option>
          </select>
        </label>
        <button
          className="button button--secondary"
          disabled={disabled}
          onClick={() => onChange(normalizeBlockPositions([...blocks, createBlock(newBlockType)]))}
          type="button"
        >
          Añadir bloque
        </button>
      </div>
    </fieldset>
  );
}
