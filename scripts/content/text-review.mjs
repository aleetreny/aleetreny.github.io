// Exact text patches also travel into the offline fixtures when that source
// revision exists there. Newer owner edits and unrelated structure stay intact.
export function applyTextReview(entries, settings, patches) {
  for (const patch of patches) {
    const rows = patch.table === 'content_entries' ? entries
      : patch.table === 'content_blocks' ? entries.flatMap((entry) => entry.blocks)
        : settings;
    const row = rows.find((item) => (item.id ?? item.key) === patch.id);
    if (!row) continue;
    let parent = row[patch.column];
    for (const key of patch.path.slice(0, -1)) parent = parent?.[key];
    const key = patch.path.at(-1);
    if (!parent || JSON.stringify(parent[key]) !== JSON.stringify(patch.before)) continue;
    parent[key] = structuredClone(patch.after);
    if (patch.table === 'content_entries' && patch.path[0] === 'i18n' && patch.path.at(-1) === 'es') {
      row[patch.path[1]] = patch.after;
    }
  }
}
