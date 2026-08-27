// Every word of chrome the board says out loud.
//
// Article prose lives in the documents (see `i18n.ts`); this file holds the
// other half — button labels, panel headings, placeholders, toasts and aria
// labels. Before it existed those strings were literals scattered across the
// components, which meant a board authored in Spanish still said `entries`,
// `fit` and `close · esc`, and the owner had no way to change them.
//
// Two rules make it work:
//
//  - every string has a built-in default per language, so a fresh install
//    speaks Spanish and English without any stored settings;
//  - every string can be overridden per language from the wording panel and
//    the overrides live in `site_settings['site.ui']`, exactly like the theme.
//
// A missing key or a missing language never blanks the interface: the resolver
// falls back to the primary language, then to the built-in default, then to
// the key itself.

import type { Localised } from './i18n';

/** `{name}` slots a caller fills in. */
export type UiVars = Record<string, string | number>;

/** The owner's overrides, as stored: key → text or language map. */
export type UiOverrides = Record<string, Localised>;

/** What components call. `t('owner.entries')`. */
export type UiText = (key: string, vars?: UiVars) => string;

type Entry = { es: string; en: string };

/** The built-in wording. Spanish first, because that is what this board is
 *  authored in; English second, for the visitor switcher. */
const CATALOGUE: Record<string, Entry> = {
  // ---------------------------------------------------------------- board
  'board.aria': { es: 'Tablero de trabajo', en: 'Working board' },
  'board.stamp': { es: 'A. Treny · tablero de trabajo', en: 'A. Treny · working board' },
  'board.hintOpen': { es: 'pulsa cualquier línea para abrir su página', en: 'click any line to open its page' },
  'board.hintMove': { es: 'arrastra el papel · rueda para acercar', en: 'drag the paper · scroll to zoom' },
  'board.label': { es: 'el tablero', en: 'the board' },
  'board.fit': { es: 'encajar', en: 'fit' },
  'board.scatter': { es: 'desordenar', en: 'scatter' },
  'board.reset': { es: 'reordenar', en: 'reset' },
  'board.tour': { es: '↻ visita', en: '↻ tour' },
  'board.tourTitle': { es: 'Repetir la visita guiada', en: 'Replay the guided tour' },
  'board.zoomIn': { es: 'Acercar', en: 'Zoom in' },
  'board.zoomOut': { es: 'Alejar', en: 'Zoom out' },
  'board.language': { es: 'Idioma', en: 'Language' },
  'board.signIn': { es: '⌗ entrar', en: '⌗ sign in' },
  'board.offline': {
    es: 'Contenido remoto no disponible; mostrando la copia segura. {detail}',
    en: 'Remote content unavailable; showing the safe copy. {detail}',
  },
  'board.offlineDetail': { es: 'contenido remoto no disponible', en: 'remote content unavailable' },

  // ---------------------------------------------------------------- jumps
  'jump.me': { es: 'quién', en: 'who' },
  'jump.work': { es: 'trabajo', en: 'work' },
  'jump.edu': { es: 'estudios', en: 'study' },
  'jump.vol': { es: 'voluntariado', en: 'giving' },
  'jump.hack': { es: 'premios', en: 'prizes' },
  'jump.repos': { es: 'código', en: 'code' },
  'jump.lab': { es: 'laboratorio', en: 'lab' },
  'jump.travel': { es: 'mundo', en: 'world' },
  'jump.random': { es: 'rarezas', en: 'odd' },
  'jump.contact': { es: 'contacto', en: 'reach' },
  'jump.now': { es: 'ahora', en: 'now' },
  'jump.diary': { es: 'frulogy', en: 'frulogy' },
  'jump.pod': { es: 'podcast', en: 'podcast' },

  // ---------------------------------------------------------------- owner bar
  'owner.editOn': { es: 'editando · sí', en: 'editing · on' },
  'owner.editOff': { es: 'modo edición', en: 'edit mode' },
  'owner.positionsLocked': { es: '🔒 posiciones', en: '🔒 positions' },
  'owner.positionsFree': { es: '🔓 posiciones', en: '🔓 positions' },
  'owner.positionsLockedTitle': { es: 'Las tarjetas están fijadas', en: 'Card positions are locked' },
  'owner.positionsFreeTitle': { es: 'Las tarjetas se pueden arrastrar', en: 'Card positions can be dragged' },
  'owner.add': { es: 'añadir:', en: 'add:' },
  'owner.addDrawer': { es: 'cajón', en: 'drawer' },
  'owner.addSpotlight': { es: 'destacado', en: 'spotlight' },
  'owner.addSticker': { es: 'pegatina', en: 'sticker' },
  'owner.addStamp': { es: 'sello', en: 'stamp' },
  'owner.addScrap': { es: 'garabato', en: 'doodle' },
  'owner.addSpotify': { es: 'Spotify', en: 'Spotify' },
  'owner.addPhoto': { es: 'foto', en: 'photo' },
  'owner.addNote': { es: 'nota', en: 'note' },
  'owner.writing': { es: 'escribiendo:', en: 'writing:' },
  'owner.primaryTitle': { es: '{label} — el idioma en el que escribes', en: '{label} — the language you author in' },
  'owner.translate': { es: '⇄ traducir todo', en: '⇄ translate all' },
  'owner.translating': { es: 'traduciendo…', en: 'translating…' },
  'owner.translateTitle': {
    es: 'Rellena las traducciones vacías de todo el tablero. Con Alt: rehace también las ya traducidas.',
    en: 'Fill every empty translation on the board. Hold Alt to redo the ones already translated.',
  },
  'owner.theme': { es: 'aspecto', en: 'theme' },
  'owner.tour': { es: 'visita', en: 'tour' },
  'owner.entries': { es: 'artículos', en: 'entries' },
  'owner.wording': { es: 'textos', en: 'wording' },
  'owner.objects': { es: 'objetos', en: 'objects' },
  'owner.preview': { es: 'vista previa', en: 'preview' },
  'owner.previewTitle': { es: 'Vista previa local — los cambios no se guardan', en: 'Local preview — changes are not saved' },
  'owner.signOut': { es: 'cerrar sesión', en: 'sign out' },
  'owner.cardSettings': { es: 'Ajustes de la tarjeta', en: 'Card settings' },
  'owner.dragHint': { es: '⠿ arrastrar', en: '⠿ drag' },
  'owner.deletePhoto': { es: 'Borrar foto', en: 'Delete photo' },
  'owner.deleteNote': { es: 'Borrar nota', en: 'Delete note' },
  'owner.noteStyle': { es: 'Cambiar el estilo de la nota', en: 'Change note style' },

  // ---------------------------------------------------------------- card menu
  'cardmenu.tone': { es: 'tono', en: 'tone' },
  'cardmenu.scrapKind': { es: 'marca', en: 'mark' },
  'cardmenu.fastener': { es: 'sujeción', en: 'fastener' },
  'cardmenu.fastenerTheme': { es: 'la del tema', en: 'the theme\u2019s' },
  'cardmenu.width': { es: 'ancho', en: 'width' },
  'cardmenu.bg': { es: 'fondo', en: 'bg' },
  'cardmenu.ink': { es: 'tinta', en: 'ink' },
  'cardmenu.rotation': { es: 'inclinar tarjeta', en: 'tilt card' },
  'cardmenu.list': { es: 'lista', en: 'list' },
  'cardmenu.layout': { es: 'diseño', en: 'layout' },
  'cardmenu.maxItems': { es: 'máximo', en: 'max items' },
  'cardmenu.all': { es: 'todos', en: 'all' },
  'cardmenu.opens': { es: 'abre', en: 'opens' },
  'cardmenu.delete': { es: 'borrar tarjeta', en: 'delete card' },

  // ---------------------------------------------------------------- cards
  'card.entryOne': { es: 'artículo', en: 'entry' },
  'card.entryMany': { es: 'artículos', en: 'entries' },
  'card.more': { es: '+ {count} más', en: '+ {count} more' },
  'card.currently': { es: 'ahora mismo', en: 'currently' },
  'card.next': { es: 'siguiente', en: 'next' },
  'card.addRole': { es: '+ rol', en: '+ role' },
  'card.newRole': { es: 'rol', en: 'role' },
  'card.addTool': { es: '+ herramienta', en: '+ tech' },
  'card.addToolsRow': { es: '+ fila de herramientas', en: '+ tools row' },
  'card.newTool': { es: 'herramienta', en: 'tool' },
  'card.addStat': { es: '+ cifra', en: '+ stat' },
  'card.statLabel': { es: 'etiqueta', en: 'label' },
  'card.removeRole': { es: 'Quitar {label}', en: 'Remove {label}' },
  'card.removeTool': { es: 'Quitar herramienta', en: 'Remove tool' },
  'card.removeStat': { es: 'Quitar {label}', en: 'Remove {label}' },
  'card.addEntry': { es: '+ añadir artículo', en: '+ add dossier' },
  'card.deleteEntry': { es: 'Borrar {title}', en: 'Delete {title}' },
  'card.addLang': { es: '+ fila', en: '+ row' },
  'card.stampDenom': { es: 'país · año', en: 'country · year' },
  'card.stampMark': { es: 'matasellos', en: 'postmark' },
  'card.langCode': { es: 'ES', en: 'ES' },
  'card.langLevel': { es: 'nivel', en: 'level' },
  'card.langMeter': { es: '{code}: {marks} de {of}', en: '{code}: {marks} of {of}' },
  'card.langUp': { es: 'Subir el nivel de {code}', en: 'Raise the level of {code}' },
  'card.langDown': { es: 'Bajar el nivel de {code}', en: 'Lower the level of {code}' },
  'card.removeLang': { es: 'Quitar {code}', en: 'Remove {code}' },
  'card.dropPhoto': { es: 'suelta una foto', en: 'drop a photo' },
  'card.changePhoto': { es: 'Cambiar foto: {placeholder}', en: 'Change photo: {placeholder}' },
  'card.dropMedia': { es: 'suelta una foto o vídeo', en: 'drop a photo or video' },
  'card.changeMedia': { es: 'Cambiar contenido: {placeholder}', en: 'Change media: {placeholder}' },
  'card.reframe': { es: 'reencuadrar', en: 'reframe' },
  'card.reframeImage': { es: 'Reencuadrar foto', en: 'Reframe photo' },
  'card.frameHint': { es: 'arrastra la foto', en: 'drag the photo' },
  'card.frameSave': { es: 'Guardar encuadre', en: 'Save crop' },
  'card.spotifyKicker': { es: 'escuchando', en: 'listening to' },
  'card.spotifyTitle': { es: 'una canción', en: 'a song' },
  'card.spotifyLink': { es: 'enlace de Spotify', en: 'Spotify link' },
  'card.spotifyPaste': { es: 'Pega el enlace de una canción de Spotify para mostrarla aquí.', en: 'Paste a Spotify song link to show it here.' },

  // ---------------------------------------------------------------- dossier
  'dossier.editFlag': { es: 'editando — pulsa cualquier texto', en: 'editing — click any text' },
  'dossier.close': { es: 'cerrar · esc', en: 'close · esc' },
  'dossier.prev': { es: 'Anterior', en: 'Previous' },
  'dossier.next': { es: 'Siguiente', en: 'Next' },
  'dossier.addBlock': { es: 'añadir bloque', en: 'add block' },
  'dossier.addParagraph': { es: 'añadir párrafo debajo', en: 'add paragraph below' },
  'dossier.dragBlock': { es: 'Arrastra para reordenar', en: 'Drag to reorder' },
  'dossier.deleteBlock': { es: 'Borrar bloque', en: 'Delete block' },
  'dossier.delete': { es: 'Borrar', en: 'Delete' },
  'dossier.filedUnder': { es: 'archivado en', en: 'filed under' },
  'dossier.addPoint': { es: '+ punto', en: '+ point' },
  'dossier.addNumber': { es: '+ cifra', en: '+ number' },
  'dossier.addLink': { es: '+ enlace', en: '+ link' },
  'dossier.addTag': { es: '+ etiqueta', en: '+ tag' },
  'dossier.newPoint': { es: 'Nuevo punto', en: 'New point' },
  'dossier.newTag': { es: 'etiqueta', en: 'tag' },
  'dossier.newLinkLabel': { es: 'Etiqueta', en: 'Label' },
  'dossier.linkLabelPlaceholder': { es: 'etiqueta', en: 'label' },
  'dossier.saving': { es: 'guardando…', en: 'saving…' },
  'dossier.saved': { es: 'guardado', en: 'saved' },
  'dossier.saveFailed': { es: 'sin guardar', en: 'unsaved' },
  'dossier.retry': { es: 'reintentar', en: 'retry' },
  'dossier.translate': { es: '⇄ traducir este artículo', en: '⇄ translate this article' },
  'dossier.translating': { es: 'traduciendo…', en: 'translating…' },
  'dossier.translateTitle': {
    es: 'Traduce este artículo desde el idioma seleccionado y actualiza las versiones existentes.',
    en: 'Translate this article from the selected language and update existing versions.',
  },
  'dossier.errorAria': { es: 'Error al mostrar el artículo', en: 'Dossier display error' },
  'dossier.errorTitle': { es: 'No se ha podido mostrar este dossier.', en: 'This dossier could not be displayed.' },
  'dossier.errorBody': {
    es: 'El tablero sigue disponible y puedes volver a él sin recargar la página.',
    en: 'The board is still available, and you can return to it without reloading the page.',
  },

  // ---------------------------------------------------------------- placeholders
  'ph.title': { es: 'Título del artículo', en: 'Article title' },
  'ph.lede': { es: 'Escribe la frase de entrada…', en: 'Write the opening line…' },
  'ph.kicker': { es: 'antetítulo', en: 'kicker' },
  'ph.when': { es: 'cuándo', en: 'when' },
  'ph.where': { es: 'dónde', en: 'where' },
  'ph.text': { es: 'Escribe aquí…', en: 'Write here…' },
  'ph.heading': { es: 'Título de sección', en: 'Section title' },
  'ph.callout': { es: 'Algo que merece destacarse', en: 'Something worth highlighting' },
  'ph.quote': { es: 'Una frase que merece citarse', en: 'A line worth quoting' },
  'ph.cite': { es: 'quién lo dijo', en: 'who said it' },
  'ph.caption': { es: 'pie de foto', en: 'caption' },
  'ph.item': { es: 'punto', en: 'point' },

  // ---------------------------------------------------------------- block palette
  'block.heading': { es: 'Título', en: 'Heading' },
  'block.heading.hint': { es: 'Un título de sección', en: 'A section title' },
  'block.text': { es: 'Párrafo', en: 'Paragraph' },
  'block.text.hint': { es: 'Un bloque de prosa', en: 'A block of prose' },
  'block.callout': { es: 'Destacado', en: 'Callout' },
  'block.callout.hint': { es: 'Una nota resaltada', en: 'A highlighted note' },
  'block.quote': { es: 'Cita', en: 'Quote' },
  'block.quote.hint': { es: 'Una cita entresacada', en: 'A pulled quotation' },
  'block.list': { es: 'Lista', en: 'List' },
  'block.list.hint': { es: 'Puntos con viñeta', en: 'Bulleted points' },
  'block.metrics': { es: 'Cifras', en: 'Numbers' },
  'block.metrics.hint': { es: 'Pares valor + etiqueta', en: 'Value + label figures' },
  'block.image': { es: 'Imagen', en: 'Image' },
  'block.image.hint': { es: 'Un hueco para una foto', en: 'A photo slot' },
  'block.links': { es: 'Enlaces', en: 'Links' },
  'block.links.hint': { es: 'Enlaces externos', en: 'External links' },
  'block.tags': { es: 'Etiquetas', en: 'Tags' },
  'block.tags.hint': { es: 'Palabras clave', en: 'Filed-under keywords' },
  'block.divider': { es: 'Separador', en: 'Divider' },
  'block.divider.hint': { es: 'Una línea fina', en: 'A thin rule' },

  // ---------------------------------------------------------------- inline links
  'link.aria': { es: 'Enlazar el texto seleccionado', en: 'Link selected text' },
  'link.linkTo': { es: 'enlazar a', en: 'link to' },
  'link.external': { es: 'página externa', en: 'external website' },
  'link.internal': { es: 'otro artículo', en: 'another article' },
  'link.article': { es: 'artículo', en: 'article' },
  'link.noArticles': { es: 'No hay artículos publicados', en: 'No published articles' },
  'link.address': { es: 'dirección web', en: 'web address' },
  'link.add': { es: 'añadir enlace', en: 'add link' },
  'link.update': { es: 'actualizar enlace', en: 'update link' },
  'link.remove': { es: 'quitar', en: 'remove' },
  'link.dismiss': { es: 'Cerrar el editor de enlaces', en: 'Dismiss link editor' },
  'link.errArticle': { es: 'Elige un artículo.', en: 'Choose an article.' },
  'link.errUrl': { es: 'Escribe una dirección web válida.', en: 'Enter a valid web address.' },

  // ---------------------------------------------------------------- inventory
  'inv.aria': { es: 'Gestionar artículos', en: 'Manage dossiers' },
  'inv.eyebrow': { es: 'inventario', en: 'inventory' },
  'inv.title': { es: 'Gestionar artículos', en: 'Manage dossiers' },
  'inv.hint': {
    es: 'Añade un artículo a cualquier cajón, cambia el orden con las flechas o mándalo a una papelera recuperable. Su texto y sus fotos se editan en la propia página.',
    en: 'Add a new card to any drawer, change its order with the arrows, or send it to the recoverable trash. Edit its text and photos inline on the board.',
  },
  'inv.newEntry': { es: 'artículo nuevo', en: 'new dossier' },
  'inv.drawer': { es: 'Cajón', en: 'Drawer' },
  'inv.titleField': { es: 'Título', en: 'Title' },
  'inv.titlePrompt': { es: 'Título del nuevo artículo', en: 'Title for the new dossier' },
  'inv.create': { es: '+ crear', en: '+ create' },
  'inv.creating': { es: 'creando…', en: 'creating…' },
  'inv.lists': { es: 'listas · {count}', en: 'lists · {count}' },
  'inv.newList': { es: 'Nombre de la lista', en: 'New list name' },
  'inv.addList': { es: '+ añadir', en: '+ add' },
  'inv.onBoard': { es: 'en el tablero · {count}', en: 'on the board · {count}' },
  'inv.orderHint': { es: 'Las flechas cambian el orden dentro de cada cajón.', en: 'The arrows change the order within each drawer.' },
  'inv.trash': { es: 'papelera · {count}', en: 'trash · {count}' },
  'inv.restore': { es: 'restaurar', en: 'restore' },
  'inv.close': { es: 'cerrar', en: 'close' },
  'inv.deleteList': { es: 'Borrar la lista {label}', en: 'Delete the list {label}' },
  'inv.moveEntry': { es: 'Mover {title} a otra lista', en: 'Move {title} to another list' },
  'inv.reorderEntry': { es: 'Cambiar el orden de {title}', en: 'Change the order of {title}' },
  'inv.moveEntryUp': { es: 'Subir {title}', en: 'Move {title} up' },
  'inv.moveEntryDown': { es: 'Bajar {title}', en: 'Move {title} down' },
  'inv.deleteEntry': { es: 'Borrar {title}', en: 'Delete {title}' },
  'inv.defaultSummary': { es: 'Pulsa para escribir la frase de entrada.', en: 'Click to write the opening line.' },
  'inv.needTitle': { es: 'Escribe primero un título.', en: 'Write a title first.' },
  'inv.created': { es: 'Artículo creado.', en: 'Dossier created.' },
  'inv.createFailed': { es: 'No se ha podido crear.', en: 'Could not create it.' },
  'inv.confirmTrash': { es: '¿Mandar «{title}» a la papelera?', en: 'Send "{title}" to the trash?' },
  'inv.trashed': { es: 'Movido a la papelera.', en: 'Moved to the trash.' },
  'inv.deleteFailed': { es: 'No se ha podido borrar.', en: 'Could not delete it.' },
  'inv.restored': { es: 'Restaurado.', en: 'Restored.' },
  'inv.restoreFailed': { es: 'No se ha podido restaurar.', en: 'Could not restore it.' },
  'inv.listCreated': { es: 'Lista creada.', en: 'List created.' },
  'inv.listDeleted': { es: 'Lista borrada.', en: 'List deleted.' },
  'inv.keepOneList': { es: 'Tiene que quedar al menos una lista.', en: 'At least one list has to remain.' },
  'inv.confirmDeleteListWith': {
    es: '«{label}» tiene {count} artículo(s); se moverán a «{fallback}». ¿Borrar la lista?',
    en: '"{label}" holds {count} dossier(s); they will move to "{fallback}". Delete the list?',
  },
  'inv.confirmDeleteList': { es: '¿Borrar la lista «{label}»?', en: 'Delete the list "{label}"?' },

  // ---------------------------------------------------------------- overflow
  'overflow.title': { es: 'Los {count} artículos', en: 'All {count} dossiers' },
  'overflow.aria': { es: 'Todos los artículos de {label}', en: 'Every dossier in {label}' },

  // ---------------------------------------------------------------- login
  'login.aria': { es: 'Acceso del propietario', en: 'Owner access' },
  'login.eyebrow': { es: 'acceso del propietario', en: 'owner access' },
  'login.title': { es: 'Entra para editar\nel tablero', en: 'Sign in to edit\nthe board' },
  'login.hint': {
    es: 'Desbloquea la edición de cada tarjeta y cada página, más el diseño, los colores, las tipografías y las fotos — todo guardado en tu base de datos Neon.',
    en: 'Unlocks inline editing of every card and page, plus draggable layout, colours, fonts and photos — all saved to your Neon database.',
  },
  'login.email': { es: 'correo', en: 'email' },
  'login.password': { es: 'contraseña', en: 'password' },
  'login.unlock': { es: 'desbloquear', en: 'unlock' },
  'login.cancel': { es: 'cancelar', en: 'cancel' },
  'login.notOwner': { es: 'Cuenta válida, pero no es la del propietario.', en: 'Valid account, but not the owner.' },
  'login.failed': { es: 'No se ha podido entrar.', en: 'Could not sign in.' },

  // ------------------------------------------------------------- theme panel
  'themepanel.aria': { es: 'Editar el aspecto', en: 'Edit the appearance' },
  'themepanel.eyebrow': { es: 'aspecto', en: 'appearance' },
  'themepanel.title': { es: 'Tema y tipografía', en: 'Theme & typography' },
  'themepanel.hint': { es: 'Cada cambio se previsualiza al instante y se publica para todo el mundo.', en: 'Every change previews instantly and publishes for everyone.' },
  'themepanel.done': { es: 'listo', en: 'done' },
  'themepanel.looks': { es: 'estilos', en: 'looks' },
  'themepanel.looksHint': { es: 'Un clic cambia a la vez la textura, pared, tarjetas, artículo y paleta. Tu texto, posiciones y visita no se tocan.', en: 'One click sets texture, wall, cards, article and palette together. Your text, positions and tour stay untouched.' },
  'themepanel.board': { es: 'tablero', en: 'board' },
  'themepanel.texture': { es: 'Textura', en: 'Texture' },
  'themepanel.cardTilt': { es: 'Inclinación de tarjetas', en: 'Card tilt' },
  'themepanel.cornerRadius': { es: 'Radio de las esquinas', en: 'Corner radius' },
  'themepanel.stickyNotes': { es: 'Notas adhesivas', en: 'Sticky notes' },
  'themepanel.backdrop': { es: 'fondo', en: 'backdrop' },
  'themepanel.hangWall': { es: 'Colgarlo en una pared', en: 'Hang it on a wall' },
  'themepanel.plateOnHint': { es: 'El tablero se convierte en una pizarra finita sobre la pared: esta es la pieza que aterriza al comenzar la visita.', en: 'The board becomes a finite slate on a wall — this is what the tour lands into place.' },
  'themepanel.plateOffHint': { es: 'Desactivado: la textura llena toda la ventana de borde a borde.', en: 'Off: the texture fills the whole viewport, edge to edge.' },
  'themepanel.wall': { es: 'Pared', en: 'Wall' },
  'themepanel.wallCentre': { es: 'Pared · centro', en: 'Wall · centre' },
  'themepanel.wallEdge': { es: 'Pared · borde', en: 'Wall · edge' },
  'themepanel.plasterGrain': { es: 'Grano del yeso', en: 'Plaster grain' },
  'themepanel.vignette': { es: 'Viñeta', en: 'Vignette' },
  'themepanel.slateMargin': { es: 'Margen de la pizarra', en: 'Slate margin' },
  'themepanel.frame': { es: 'Marco', en: 'Frame' },
  'themepanel.slateShadow': { es: 'Sombra de la pizarra', en: 'Slate shadow' },
  'themepanel.cornerStuds': { es: 'Remaches de esquina', en: 'Corner studs' },
  'themepanel.studSize': { es: 'Tamaño del remache', en: 'Stud size' },
  'themepanel.studInset': { es: 'Posición del remache', en: 'Stud inset' },
  'themepanel.pattern': { es: 'Patrón', en: 'Pattern' },
  'themepanel.gridFallback': { es: 'Sin pizarra donde pintarlo, el patrón se fija a la ventana.', en: 'With no slate to paint on, the pattern falls back to the viewport.' },
  'themepanel.gridHint.plate': { es: 'Pintado sobre la pizarra, así que hace zoom con el tablero.', en: 'Painted on the slate, so it zooms with the board.' },
  'themepanel.gridHint.viewport': { es: 'Densidad constante en pantalla: un fondo fijo y tranquilo.', en: 'Constant on-screen density — a calm fixed backdrop.' },
  'themepanel.gridHint.off': { es: 'Sin patrón.', en: 'No pattern at all.' },
  'themepanel.patternStyle': { es: 'Estilo del patrón', en: 'Pattern style' },
  'themepanel.patternInk': { es: 'Tinta del patrón', en: 'Pattern ink' },
  'themepanel.patternStrength': { es: 'Intensidad del patrón', en: 'Pattern strength' },
  'themepanel.patternScale': { es: 'Escala del patrón', en: 'Pattern scale' },
  'themepanel.slateColour': { es: 'color de la pizarra', en: 'slate colour' },
  'themepanel.slateColourHint': { es: 'Vacío usa el color del estilo. Elige uno para convertir la pizarra en cualquier color, incluidos los temas claros.', en: 'Empty uses the board style. Choose one to make the slate any colour, including pale themes.' },
  'themepanel.slateCentre': { es: 'Centro de la pizarra', en: 'Slate centre' },
  'themepanel.slateEdge': { es: 'Borde de la pizarra', en: 'Slate edge' },
  'themepanel.slateInk': { es: 'Tinta de la pizarra', en: 'Slate ink' },
  'themepanel.resetSlateColour': { es: 'volver al color propio del estilo', en: 'back to the board style’s own colour' },
  'themepanel.cards': { es: 'tarjetas', en: 'cards' },
  'themepanel.edge': { es: 'Borde', en: 'Edge' },
  'themepanel.fastenedWith': { es: 'Sujetas con', en: 'Fastened with' },
  'themepanel.onHover': { es: 'Al pasar el ratón', en: 'On hover' },
  'themepanel.shadow': { es: 'Sombra', en: 'Shadow' },
  'themepanel.paperGrain': { es: 'Grano del papel', en: 'Paper grain' },
  'themepanel.innerPadding': { es: 'Margen interior', en: 'Inner padding' },
  'themepanel.rowTint': { es: 'Tinte de filas', en: 'Row tint' },
  'themepanel.rowRule': { es: 'Línea de filas', en: 'Row rule' },
  'themepanel.articles': { es: 'artículos', en: 'articles' },
  'themepanel.articlesHint': { es: 'El dossier a página completa que abre una tarjeta.', en: 'The full-page dossier a card opens into.' },
  'themepanel.plateWidth': { es: 'Ancho de la hoja', en: 'Plate width' },
  'themepanel.measure': { es: 'Ancho de lectura', en: 'Measure' },
  'themepanel.bodyFace': { es: 'Tipografía del cuerpo', en: 'Body face' },
  'themepanel.bodySize': { es: 'Tamaño del cuerpo', en: 'Body size' },
  'themepanel.leading': { es: 'Interlineado', en: 'Leading' },
  'themepanel.titleSize': { es: 'Tamaño del título', en: 'Title size' },
  'themepanel.titleWeight': { es: 'Peso del título', en: 'Title weight' },
  'themepanel.titleTracking': { es: 'Espaciado del título', en: 'Title tracking' },
  'themepanel.titleCase': { es: 'Mayúsculas del título', en: 'Title case' },
  'themepanel.openingLine': { es: 'Línea de entrada', en: 'Opening line' },
  'themepanel.dropCap': { es: 'Letra capitular', en: 'Drop cap' },
  'themepanel.numberBlocks': { es: 'Numerar los bloques', en: 'Number the blocks' },
  'themepanel.centreColumn': { es: 'Centrar la columna', en: 'Centre the column' },
  'themepanel.blockGap': { es: 'Espacio entre bloques', en: 'Block gap' },
  'themepanel.opensWith': { es: 'Animación de apertura', en: 'Opens with' },
  'themepanel.scrim': { es: 'Oscurecimiento', en: 'Scrim' },
  'themepanel.scrimBlur': { es: 'Desenfoque del fondo', en: 'Scrim blur' },
  'themepanel.typography': { es: 'tipografía', en: 'typography' },
  'themepanel.displayFont': { es: 'Fuente de títulos', en: 'Display font' },
  'themepanel.monoFont': { es: 'Fuente monoespaciada', en: 'Mono font' },
  'themepanel.displayWeight': { es: 'Peso de títulos', en: 'Display weight' },
  'themepanel.displayTracking': { es: 'Espaciado de títulos', en: 'Display tracking' },
  'themepanel.bodyScale': { es: 'Escala del cuerpo', en: 'Body scale' },
  'themepanel.colours': { es: 'colores', en: 'colours' },
  'themepanel.color.accent': { es: 'Acento · óxido', en: 'Accent · rust' },
  'themepanel.color.accent2': { es: 'Acento 2 · azul', en: 'Accent 2 · blue' },
  'themepanel.color.signal': { es: 'Señal · ámbar', en: 'Signal · amber' },
  'themepanel.color.signalSoft': { es: 'Señal suave', en: 'Signal soft' },
  'themepanel.color.lab': { es: 'Laboratorio · frío', en: 'Lab · cool' },
  'themepanel.color.paper': { es: 'Papel', en: 'Paper' },
  'themepanel.color.paperWarm': { es: 'Papel cálido', en: 'Paper warm' },
  'themepanel.color.paperCream': { es: 'Papel crema', en: 'Paper cream' },
  'themepanel.color.ink': { es: 'Tinta', en: 'Ink' },
  'themepanel.color.dark': { es: 'Superficie oscura', en: 'Dark surface' },
  'themepanel.color.slate': { es: 'Superficie de pizarra', en: 'Slate surface' },
  'themepanel.color.slateInk': { es: 'Tinta de pizarra', en: 'Slate ink' },
  'themepanel.color.darkInk': { es: 'Tinta oscura', en: 'Dark ink' },
  'themepanel.languages': { es: 'idiomas', en: 'languages' },
  'themepanel.twoLanguages': { es: 'Dos idiomas', en: 'Two languages' },
  'themepanel.languagesOnHint': { es: 'Los visitantes ven un selector; tú escribes en el idioma principal y completas el resto con ⇄ traducir.', en: 'Visitors get a switcher; you write in the primary language and fill the rest with ⇄ translate.' },
  'themepanel.languagesOffHint': { es: 'Desactivado: un idioma y sin selector.', en: 'Off: one language, no switcher.' },
  'themepanel.youWriteIn': { es: 'Escribes en', en: 'You write in' },
  'themepanel.languageCode': { es: 'Código del idioma {index}', en: 'Language {index} code' },
  'themepanel.languageName': { es: 'Nombre del idioma {index}', en: 'Language {index} name' },
  'themepanel.removeLanguage': { es: 'Quitar {label}', en: 'Remove {label}' },
  'themepanel.newLanguage': { es: 'Idioma nuevo', en: 'New language' },
  'themepanel.addLanguage': { es: '+ idioma', en: '+ language' },
  'themepanel.translator': { es: 'Traductor', en: 'Translator' },
  'themepanel.providerHint.mymemory': { es: 'Gratis y sin clave desde el navegador. Aproximadamente 5.000 caracteres diarios de forma anónima y diez veces más al iniciar sesión.', en: 'Free and keyless from the browser. About 5,000 characters a day anonymously and ten times that when signed in.' },
  'themepanel.providerHint.google': { es: 'Endpoint sin clave del widget web de Google Translate: buen texto y sin techo diario práctico, pero no está documentado y puede cambiar.', en: 'The keyless endpoint used by Google Translate’s web widget: good prose and no practical daily ceiling, but undocumented and subject to change.' },
  'themepanel.providerHint.function': { es: 'Tu función de Neon guarda la clave del proveedor en el servidor; consulta docs/handbook.md.', en: 'Your Neon Function holds the provider key server-side; see docs/handbook.md.' },
  'themepanel.providerHint.off': { es: 'Sin traducción automática; escribe cada idioma a mano.', en: 'No machine translation; type each language yourself.' },
  'themepanel.translateAsWrite': { es: 'Traducir mientras escribo', en: 'Translate as I write' },
  'themepanel.rememberChoice': { es: 'Recordar su elección', en: 'Remember their choice' },
  'themepanel.followBrowser': { es: 'Seguir el idioma del navegador', en: 'Follow the browser' },

  'themepanel.preset.slate.label': { es: 'Pizarra de trabajo', en: 'Working slate' },
  'themepanel.preset.slate.hint': { es: 'el original: pizarra gris verdosa, pared de yeso, papel recto y sombras duras', en: 'the original — a green-grey slate, plaster wall, straight paper and hard shadows' },
  'themepanel.preset.solarized-light.label': { es: 'Solarized Light', en: 'Solarized Light' },
  'themepanel.preset.solarized-light.hint': { es: 'la paleta diurna de Ethan Schoonover: papel cálido, tinta cian y artículo serifeno', en: 'Ethan Schoonover’s daylight palette — warm paper, cyan-blue ink and a calm serif article' },
  'themepanel.preset.nord.label': { es: 'Nord', en: 'Nord' },
  'themepanel.preset.nord.hint': { es: 'paleta ártica: pizarra de noche polar, azules helados y papel de nieve', en: 'the arctic palette — polar-night slate, frost blues and snow-storm paper' },
  'themepanel.preset.gruvbox.label': { es: 'Gruvbox', en: 'Gruvbox' },
  'themepanel.preset.gruvbox.hint': { es: 'aire retro: pizarra carbón, papel crema, naranja quemado, capitular y fotos pegadas', en: 'retro groove — charcoal slate, cream paper, burnt orange, a drop cap and taped photos' },
  'themepanel.preset.dracula.label': { es: 'Dracula', en: 'Dracula' },
  'themepanel.preset.dracula.hint': { es: 'el clásico morado: pizarra casi negra, violeta y rosa, tarjetas redondas con brillo', en: 'the purple classic — near-black slate, violet and pink, rounded cards with a glow' },
  'themepanel.preset.latte.label': { es: 'Catppuccin Latte', en: 'Catppuccin Latte' },
  'themepanel.preset.latte.hint': { es: 'luz suave: gris lavanda claro, papel redondeado y artículo centrado sin líneas', en: 'soft light — pale lavender-grey, rounded paper and a centred article with no rules' },
  'themepanel.preset.tokyonight.label': { es: 'Tokyo Night', en: 'Tokyo Night' },
  'themepanel.preset.tokyonight.hint': { es: 'índigo profundo, azul y violeta neón, pizarra estrellada y bloques mono numerados', en: 'deep indigo, neon blue and violet, a starfield slate and numbered mono blocks' },
  'themepanel.preset.rosepine-dawn.label': { es: 'Rosé Pine Dawn', en: 'Rosé Pine Dawn' },
  'themepanel.preset.rosepine-dawn.hint': { es: 'rosado claro: papel rubor, tinta ciruela, fotos clavadas y capitular', en: 'light rosé — blush paper, muted plum ink, pinned photos and a drop cap' },
  'themepanel.preset.everforest.label': { es: 'Everforest', en: 'Everforest' },
  'themepanel.preset.everforest.hint': { es: 'verdes de bosque suaves sobre crema cálida, pizarra tejida y papel grapado', en: 'soft forest greens on warm cream, a woven slate and stapled paper' },
  'themepanel.preset.monokai.label': { es: 'Monokai', en: 'Monokai' },
  'themepanel.preset.monokai.hint': { es: 'el clásico de editor: pizarra oliva oscura, rosa intenso, lima y bordes gruesos', en: 'the editor classic — olive-black slate, hot pink, lime and heavy edges' },
  'themepanel.preset.newsprint.label': { es: 'Papel de periódico', en: 'Newsprint' },
  'themepanel.preset.newsprint.hint': { es: 'papel hueso de borde a borde, sin pizarra, líneas de tinta, bloques numerados y capitular', en: 'bone paper wall to wall, no slate, ink rules, numbered blocks and a drop cap' },
  'themepanel.preset.brutalist.label': { es: 'Brutalista', en: 'Brutalist' },
  'themepanel.preset.brutalist.hint': { es: 'sin sombra, bordes negros gruesos, acento rojo, todo plano y rotundo', en: 'no shadow, heavy black edges, a red accent, everything flat and loud' },

  // -------------------------------------------------------------- tour panel
  'tourpanel.aria': { es: 'Editar la visita guiada', en: 'Edit the guided tour' },
  'tourpanel.eyebrow': { es: 'visita guiada', en: 'guided tour' },
  'tourpanel.title': { es: 'La visita del tablero', en: 'The board tour' },
  'tourpanel.hint': {
    es: 'La pizarra llega a la pared y después el visitante recorre el tablero parada a parada. Todo se actualiza al instante: pulsa vista previa para probar los ajustes actuales.',
    en: 'The slate lands on the wall, then the visitor walks the board stop by stop. Everything updates live — press preview to watch the current settings.',
  },
  'tourpanel.preview': { es: 'vista previa', en: 'preview' },
  'tourpanel.done': { es: 'listo', en: 'done' },
  'tourpanel.run': { es: 'recorrido', en: 'run' },
  'tourpanel.playVisitors': { es: 'Reproducir para visitantes', en: 'Play for visitors' },
  'tourpanel.showIt': { es: 'Mostrarla', en: 'Show it' },
  'tourpanel.advance': { es: 'Avance', en: 'Advance' },
  'tourpanel.dwell': { es: 'Pausa', en: 'Dwell' },
  'tourpanel.speed': { es: 'Velocidad', en: 'Speed' },
  'tourpanel.loop': { es: 'Repetir al terminar', en: 'Loop at the end' },
  'tourpanel.replayHint.always': { es: 'en cada visita', en: 'every single visit' },
  'tourpanel.replayHint.session': { es: 'una vez por sesión del navegador', en: 'once per browser session' },
  'tourpanel.replayHint.once': { es: 'una vez y nunca más en este dispositivo', en: 'once, then never again on this device' },
  'tourpanel.advanceHint.manual': { es: 'el visitante pulsa siguiente o la barra espaciadora', en: 'the visitor clicks next or presses space' },
  'tourpanel.advanceHint.auto': { es: 'avanza solo después de la pausa indicada', en: 'moves on by itself after the dwell below' },
  'tourpanel.advanceHint.scroll': { es: 'la rueda avanza y retrocede en vez de hacer zoom', en: 'the wheel steps forward and back instead of zooming' },
  'tourpanel.route': { es: 'ruta', en: 'route' },
  'tourpanel.shape': { es: 'Forma', en: 'Shape' },
  'tourpanel.piecesPerStop': { es: 'Piezas por parada', en: 'Pieces per stop' },
  'tourpanel.leftovers': { es: 'Recoger las piezas sobrantes', en: 'Sweep up the leftovers' },
  'tourpanel.stopsCount': { es: '{count} paradas · cambia el orden con las flechas', en: '{count} stops · change the order with the arrows' },
  'tourpanel.stopLabel': { es: 'nombre de la parada', en: 'stop label' },
  'tourpanel.stopHeading': { es: 'Título de la parada {index}', en: 'Stop {index} heading' },
  'tourpanel.moveUp': { es: 'Subir', en: 'Move up' },
  'tourpanel.moveDown': { es: 'Bajar', en: 'Move down' },
  'tourpanel.deleteStop': { es: 'Borrar parada', en: 'Delete stop' },
  'tourpanel.removePiece': { es: 'Quitar {id}', en: 'Remove {id}' },
  'tourpanel.addPieceToStop': { es: 'Añadir una pieza a la parada {index}', en: 'Add a piece to stop {index}' },
  'tourpanel.landPieceAtStop': { es: 'Asociar una pieza a la parada {index} sin encuadrarla', en: 'Associate a piece with stop {index} without framing it' },
  'tourpanel.addPiece': { es: '+ pieza', en: '+ piece' },
  'tourpanel.landPiece': { es: '+ llega al final', en: '+ arrives at the end' },
  'tourpanel.addStop': { es: '+ parada', en: '+ stop' },
  'tourpanel.newStopLabel': { es: 'una parada nueva', en: 'a new stop' },
  'tourpanel.generatedStops': { es: '{count} paradas, reconstruidas desde el tablero en cada recorrido:', en: '{count} stops, rebuilt from the board every run:' },
  'tourpanel.copyCustom': { es: 'copiar como ruta personalizada', en: 'copy into custom' },
  'tourpanel.routeHint.custom': { es: 'las paradas que escribes abajo, en tu orden', en: 'the stops you write below, in your order' },
  'tourpanel.routeHint.lists': { es: 'una parada por cajón y después las piezas sueltas', en: 'one stop per drawer list, then the loose pieces' },
  'tourpanel.routeHint.columns': { es: 'columna a columna, de izquierda a derecha', en: 'column by column, left to right' },
  'tourpanel.routeHint.rows': { es: 'franja a franja, de arriba abajo', en: 'band by band, top to bottom' },
  'tourpanel.routeHint.reading': { es: 'como una página: de lado a lado y después hacia abajo', en: 'like reading a page: across, then down' },
  'tourpanel.routeHint.spiral': { es: 'desde el centro del tablero hacia fuera', en: 'from the middle of the board outwards' },
  'tourpanel.routeHint.clock': { es: 'alrededor del tablero, empezando a las doce', en: 'around the board, starting at twelve' },
  'tourpanel.routeHint.random': { es: 'un orden nuevo cada vez', en: 'a fresh shuffle every time it plays' },
  'tourpanel.routeHint.solo': { es: 'una pieza cada vez, sin saltarse ninguna', en: 'one piece at a time, nothing skipped' },
  'tourpanel.camera': { es: 'cámara', en: 'camera' },
  'tourpanel.motion': { es: 'Movimiento', en: 'Motion' },
  'tourpanel.easing': { es: 'Curva', en: 'Easing' },
  'tourpanel.firstFlight': { es: 'Primer vuelo', en: 'First flight' },
  'tourpanel.laterFlights': { es: 'Vuelos siguientes', en: 'Later flights' },
  'tourpanel.arcHeight': { es: 'Altura del arco', en: 'Arc height' },
  'tourpanel.swoopDepth': { es: 'Profundidad del vuelo', en: 'Swoop depth' },
  'tourpanel.zoomCeiling': { es: 'Límite de zoom', en: 'Zoom ceiling' },
  'tourpanel.breathingRoom': { es: 'Aire alrededor', en: 'Breathing room' },
  'tourpanel.padSides': { es: 'Margen · lados', en: 'Pad · sides' },
  'tourpanel.padTop': { es: 'Margen · arriba', en: 'Pad · top' },
  'tourpanel.padBottom': { es: 'Margen · abajo', en: 'Pad · bottom' },
  'tourpanel.motionHint.glide': { es: 'un vuelo recto y suave', en: 'a straight, eased flight' },
  'tourpanel.motionHint.arc': { es: 'se eleva sobre el tablero durante el trayecto', en: 'lifts over the board on the way' },
  'tourpanel.motionHint.swoop': { es: 'se aleja a mitad del vuelo y vuelve a entrar', en: 'pulls back mid-flight, then drops in' },
  'tourpanel.motionHint.push': { es: 'primero se desplaza y después se acerca', en: 'slides across first, zooms in after' },
  'tourpanel.motionHint.pull': { es: 'primero se aleja y después se desplaza', en: 'zooms out first, slides across after' },
  'tourpanel.motionHint.drift': { es: 'velocidad constante, sin suavizado', en: 'constant speed, no ease at all' },
  'tourpanel.motionHint.spring': { es: 'se pasa del punto y vuelve a asentarse', en: 'overshoots the mark and settles' },
  'tourpanel.motionHint.cut': { es: 'sin viaje: corte directo a la siguiente parada', en: 'no travel — hard cut to the next stop' },
  'tourpanel.phones': { es: 'móviles', en: 'phones' },
  'tourpanel.perStop': { es: '{count} por parada', en: '{count} per stop' },
  'tourpanel.off': { es: 'desactivado', en: 'off' },
  'tourpanel.adaptSmall': { es: 'Adaptar en pantallas pequeñas', en: 'Adapt on small screens' },
  'tourpanel.mobileHint': { es: 'El tablero mide 2540 px de ancho, así que un móvil siempre ve un detalle. Por debajo de este ancho, la misma ruta se recorre en grupos pequeños con márgenes legibles.', en: 'The board is 2540px wide, so a phone always sees a detail. Below this width, the same route is walked a few pieces at a time with readable padding.' },
  'tourpanel.appliesBelow': { es: 'Aplicar por debajo de', en: 'Applies below' },
  'tourpanel.pieces': { es: 'piezas', en: 'pieces' },
  'tourpanel.landing': { es: 'Entrada', en: 'Landing' },
  'tourpanel.order': { es: 'Orden', en: 'Order' },
  'tourpanel.duration': { es: 'Duración', en: 'Duration' },
  'tourpanel.stagger': { es: 'Escalonado', en: 'Stagger' },
  'tourpanel.travel': { es: 'Recorrido', en: 'Travel' },
  'tourpanel.motionBlur': { es: 'Desenfoque de movimiento', en: 'Motion blur' },
  'tourpanel.revealHint.stick': { es: 'entra desde fuera de la pizarra y queda fijada', en: 'thrown in from off-slate and pinned' },
  'tourpanel.revealHint.drop': { es: 'cae desde arriba', en: 'falls in from above' },
  'tourpanel.revealHint.rise': { es: 'sube desde abajo', en: 'comes up from below' },
  'tourpanel.revealHint.fade': { es: 'fundido sencillo, sin movimiento', en: 'plain fade, nothing moves' },
  'tourpanel.revealHint.zoom': { es: 'crece, se pasa y se asienta', en: 'scales up past the mark and settles' },
  'tourpanel.revealHint.flip': { es: 'se gira hasta quedar boca arriba', en: 'turns over onto its face' },
  'tourpanel.revealHint.swing': { es: 'entra balanceándose sobre una bisagra', en: 'swings in like it is on a hinge' },
  'tourpanel.revealHint.slam': { es: 'aterriza grande y encoge a su sitio', en: 'lands big and shrinks into place' },
  'tourpanel.revealHint.none': { es: 'aparece sin animación', en: 'appears with no animation at all' },
  'tourpanel.slate': { es: 'pizarra', en: 'slate' },
  'tourpanel.arrival': { es: 'Llegada', en: 'Arrival' },
  'tourpanel.emptyWall': { es: 'Pared vacía', en: 'Empty wall' },
  'tourpanel.settle': { es: 'Asentamiento', en: 'Settle' },
  'tourpanel.impactShake': { es: 'Sacudida de impacto', en: 'Impact shake' },
  'tourpanel.dustFlash': { es: 'Destello de polvo', en: 'Dust flash' },
  'tourpanel.studsPop': { es: 'Entrada de los remaches', en: 'Studs pop in' },
  'tourpanel.studStagger': { es: 'Escalonado de remaches', en: 'Stud stagger' },
  'tourpanel.introHint.slam': { es: 'cae con fuerza sobre la pared desde arriba', en: 'slams onto the wall from above' },
  'tourpanel.introHint.fade': { es: 'aparece fundiéndose con la pared', en: 'fades up out of the wall' },
  'tourpanel.introHint.raise': { es: 'sube hasta su sitio desde abajo', en: 'lifts into place from below' },
  'tourpanel.introHint.sweep': { es: 'entra con un barrido desde la izquierda', en: 'wipes in from the left edge' },
  'tourpanel.introHint.none': { es: 'ya está colgada', en: 'already hanging there' },
  'tourpanel.tourBar': { es: 'barra de la visita', en: 'tour bar' },
  'tourpanel.showBar': { es: 'Mostrar la barra', en: 'Show the bar' },
  'tourpanel.position': { es: 'Posición', en: 'Position' },
  'tourpanel.stopCounter': { es: 'Contador de paradas', en: 'Stop counter' },
  'tourpanel.progressBar': { es: 'Barra de progreso', en: 'Progress bar' },
  'tourpanel.jumpDots': { es: 'Puntos de salto', en: 'Jump dots' },
  'tourpanel.hintField': { es: 'Ayuda', en: 'Hint' },
  'tourpanel.next': { es: 'Siguiente', en: 'Next' },
  'tourpanel.lastStop': { es: 'Última parada', en: 'Last stop' },
  'tourpanel.back': { es: 'Atrás', en: 'Back' },
  'tourpanel.skip': { es: 'Saltar', en: 'Skip' },

  // Shared option names used by the owner panels.
  'option.custom': { es: 'personalizada', en: 'custom' },
  'option.lists': { es: 'listas', en: 'lists' },
  'option.columns': { es: 'columnas', en: 'columns' },
  'option.rows': { es: 'filas', en: 'rows' },
  'option.reading': { es: 'lectura', en: 'reading' },
  'option.spiral': { es: 'espiral', en: 'spiral' },
  'option.clock': { es: 'reloj', en: 'clock' },
  'option.random': { es: 'aleatoria', en: 'random' },
  'option.solo': { es: 'individual', en: 'solo' },
  'option.always': { es: 'siempre', en: 'always' },
  'option.session': { es: 'por sesión', en: 'per session' },
  'option.once': { es: 'una vez', en: 'once' },
  'option.manual': { es: 'manual', en: 'manual' },
  'option.auto': { es: 'automático', en: 'auto' },
  'option.scroll': { es: 'rueda', en: 'scroll' },
  'option.glide': { es: 'deslizar', en: 'glide' },
  'option.arc': { es: 'arco', en: 'arc' },
  'option.swoop': { es: 'vuelo', en: 'swoop' },
  'option.push': { es: 'acercar', en: 'push' },
  'option.pull': { es: 'alejar', en: 'pull' },
  'option.drift': { es: 'deriva', en: 'drift' },
  'option.spring': { es: 'muelle', en: 'spring' },
  'option.cut': { es: 'corte', en: 'cut' },
  'option.stick': { es: 'fijar', en: 'stick' },
  'option.drop': { es: 'caer', en: 'drop' },
  'option.rise': { es: 'subir', en: 'rise' },
  'option.fade': { es: 'fundido', en: 'fade' },
  'option.zoom': { es: 'zoom', en: 'zoom' },
  'option.flip': { es: 'voltear', en: 'flip' },
  'option.swing': { es: 'balancear', en: 'swing' },
  'option.slam': { es: 'impacto', en: 'slam' },
  'option.none': { es: 'ninguno', en: 'none' },
  'option.sequence': { es: 'secuencia', en: 'sequence' },
  'option.reverse': { es: 'inverso', en: 'reverse' },
  'option.together': { es: 'a la vez', en: 'together' },
  'option.raise': { es: 'elevar', en: 'raise' },
  'option.sweep': { es: 'barrido', en: 'sweep' },
  'option.bottom': { es: 'abajo', en: 'bottom' },
  'option.top': { es: 'arriba', en: 'top' },
  'option.inOutCubic': { es: 'cúbica · entrada/salida', en: 'cubic · in/out' },
  'option.outSoft': { es: 'salida suave', en: 'soft out' },
  'option.inOutQuint': { es: 'quíntica · entrada/salida', en: 'quint · in/out' },
  'option.inOutSine': { es: 'seno · entrada/salida', en: 'sine · in/out' },
  'option.outCubic': { es: 'cúbica · salida', en: 'cubic · out' },
  'option.outExpo': { es: 'exponencial · salida', en: 'expo · out' },
  'option.outBack': { es: 'rebote · salida', en: 'back · out' },
  'option.inOutBack': { es: 'rebote · entrada/salida', en: 'back · in/out' },
  'option.linear': { es: 'lineal', en: 'linear' },
  'option.blueprint': { es: 'plano técnico', en: 'blueprint' },
  'option.cork': { es: 'corcho', en: 'cork' },
  'option.graphite': { es: 'grafito', en: 'graphite' },
  'option.slate': { es: 'pizarra', en: 'slate' },
  'option.paper': { es: 'papel', en: 'paper' },
  'option.midnight': { es: 'medianoche', en: 'midnight' },
  'option.sunset': { es: 'atardecer', en: 'sunset' },
  'option.plaster': { es: 'yeso', en: 'plaster' },
  'option.concrete': { es: 'hormigón', en: 'concrete' },
  'option.studio': { es: 'estudio', en: 'studio' },
  'option.ink': { es: 'tinta', en: 'ink' },
  'option.warm': { es: 'cálida', en: 'warm' },
  'option.moss': { es: 'musgo', en: 'moss' },
  'option.void': { es: 'vacío', en: 'void' },
  'option.plate': { es: 'pizarra', en: 'slate' },
  'option.viewport': { es: 'ventana', en: 'viewport' },
  'option.off': { es: 'desactivado', en: 'off' },
  'option.texture': { es: 'textura', en: 'texture' },
  'option.dots': { es: 'puntos', en: 'dots' },
  'option.grid': { es: 'cuadrícula', en: 'grid' },
  'option.graph': { es: 'papel milimetrado', en: 'graph' },
  'option.rules': { es: 'líneas', en: 'rules' },
  'option.weave': { es: 'tejido', en: 'weave' },
  'option.stars': { es: 'estrellas', en: 'stars' },
  'option.diagonal': { es: 'diagonal', en: 'diagonal' },
  'option.light': { es: 'clara', en: 'light' },
  'option.dark': { es: 'oscura', en: 'dark' },
  'option.hairline': { es: 'fino', en: 'hairline' },
  'option.heavy': { es: 'grueso', en: 'heavy' },
  'option.double': { es: 'doble', en: 'double' },
  'option.dashed': { es: 'discontinuo', en: 'dashed' },
  'option.inked': { es: 'entintado', en: 'inked' },
  'option.tape': { es: 'cinta', en: 'tape' },
  'option.pin': { es: 'chincheta', en: 'pin' },
  'option.clip': { es: 'clip', en: 'clip' },
  'option.staple': { es: 'grapa', en: 'staple' },
  'option.straighten': { es: 'enderezar', en: 'straighten' },
  'option.tilt': { es: 'inclinar', en: 'tilt' },
  'option.glow': { es: 'brillo', en: 'glow' },
  'option.display': { es: 'títulos', en: 'display' },
  'option.mono': { es: 'monoespaciada', en: 'mono' },
  'option.upper': { es: 'mayúsculas', en: 'upper' },
  'option.lower': { es: 'minúsculas', en: 'lower' },
  'option.italic': { es: 'cursiva', en: 'italic' },
  'option.plain': { es: 'normal', en: 'plain' },
  'option.large': { es: 'grande', en: 'large' },
  'option.kicker': { es: 'antetítulo', en: 'kicker' },
  'option.sheet': { es: 'hoja', en: 'sheet' },
  'option.mymemory': { es: 'MyMemory', en: 'MyMemory' },
  'option.google': { es: 'Google', en: 'Google' },
  'option.function': { es: 'función propia', en: 'custom function' },
  'option.paperWarm': { es: 'papel cálido', en: 'warm paper' },
  'option.paperCream': { es: 'papel crema', en: 'cream paper' },
  'option.amber': { es: 'ámbar', en: 'amber' },
  'option.arrow': { es: 'flecha', en: 'arrow' },
  'option.circle': { es: 'círculo', en: 'circle' },
  'option.underline': { es: 'subrayado', en: 'underline' },
  'option.bracket': { es: 'corchete', en: 'bracket' },
  'option.star': { es: 'estrella', en: 'star' },
  'option.cross': { es: 'cruz', en: 'cross' },
  'option.wave': { es: 'onda', en: 'wave' },
  'option.coffee': { es: 'café', en: 'coffee' },
  'option.leaf': { es: 'hoja', en: 'leaf' },
  'option.bulb': { es: 'bombilla', en: 'bulb' },
  'option.die': { es: 'dado', en: 'die' },
  'option.list': { es: 'lista', en: 'list' },
  'option.compact': { es: 'compacto', en: 'compact' },
  'option.notes': { es: 'notas', en: 'notes' },
  'option.atlas': { es: 'atlas', en: 'atlas' },

  // ---------------------------------------------------------------- tour bar
  'tourbar.step': { es: 'parada {step} / {total}', en: 'stop {step} / {total}' },
  'tourbar.pause': { es: 'Pausar la visita', en: 'Pause the tour' },
  'tourbar.resume': { es: 'Reanudar la visita', en: 'Resume the tour' },
  'tourbar.goto': { es: 'Ir a la parada {index}', en: 'Go to stop {index}' },

  // ---------------------------------------------------------------- wording panel
  'wording.aria': { es: 'Textos de la interfaz', en: 'Interface wording' },
  'wording.eyebrow': { es: 'textos', en: 'wording' },
  'wording.title': { es: 'Palabras de la interfaz', en: 'Interface wording' },
  'wording.hint': {
    es: 'Cada palabra que dice el tablero, en {language}. Deja un campo vacío para volver al texto de fábrica. Cada idioma guarda el suyo.',
    en: 'Every word the board says, in {language}. Leave a field empty to fall back to the built-in text. Each language keeps its own.',
  },
  'wording.search': { es: 'Buscar una palabra…', en: 'Search a word…' },
  'wording.reset': { es: 'restaurar', en: 'reset' },
  'wording.resetAll': { es: 'restaurar todo el idioma', en: 'reset this language' },
  'wording.confirmResetAll': {
    es: '¿Borrar todos tus textos de {language} y volver a los de fábrica?',
    en: 'Discard every {language} wording of yours and go back to the built-in text?',
  },
  'wording.empty': { es: 'Nada coincide con esa búsqueda.', en: 'Nothing matches that search.' },
  'wording.changed': { es: 'cambiado', en: 'changed' },
  'wording.done': { es: 'listo', en: 'done' },

  // ----------------------------------------------------------- objects panel
  'objectspanel.aria': { es: 'Objetos del escritorio', en: 'The things on the desk' },
  'objectspanel.eyebrow': { es: 'el escritorio', en: 'the desk' },
  'objectspanel.title': { es: 'Objetos y huellas de visitantes', en: 'Objects & what visitors left' },
  'objectspanel.hint': { es: 'Arrastra cualquier objeto hasta su sitio y pulsa «guardar posiciones». Esta configuración vive en', en: 'Drag anything into place and press “take positions”. This configuration lives in' },
  'objectspanel.done': { es: 'listo', en: 'done' },
  'objectspanel.tab.objects': { es: 'objetos', en: 'objects' },
  'objectspanel.tab.notes': { es: 'notas', en: 'notes' },
  'objectspanel.tab.garden': { es: 'jardín', en: 'garden' },
  'objectspanel.tab.curiosity': { es: 'curiosidad', en: 'curiosity' },
  'objectspanel.tab.vote': { es: 'voto', en: 'vote' },
  'objectspanel.paint': { es: 'pintura', en: 'paint' },
  'objectspanel.paintDuration': { es: 'Cuánto dura una mancha', en: 'How long a splat lasts' },
  'objectspanel.paint.none': { es: 'no se guarda', en: 'not kept' },
  'objectspanel.paint.session': { es: 'esta visita', en: 'this visit' },
  'objectspanel.paint.global': { es: 'siempre en este navegador', en: 'this browser, for good' },
  'objectspanel.wash': { es: 'lavar el tablero', en: 'wash the board' },
  'objectspanel.resetWorld': { es: 'reiniciar el mundo', en: 'reset the world' },
  'objectspanel.clearPhotos': { es: 'borrar fotos', en: 'clear photos' },
  'objectspanel.onTable': { es: 'sobre la mesa', en: 'out on the table' },
  'objectspanel.takePositions': { es: 'guardar posiciones', en: 'take positions' },
  'objectspanel.putBack': { es: 'devolver todo a su sitio', en: 'put it all back' },
  'objectspanel.showAll': { es: 'mostrar todo', en: 'show all' },
  'objectspanel.hideAll': { es: 'ocultar todo', en: 'hide all' },
  'objectspanel.visible': { es: 'Mostrar {name}', en: 'Show {name}' },
  'objectspanel.backing.remote': { es: 'Leyendo la base de datos.', en: 'Reading the database.' },
  'objectspanel.backing.local': { es: 'No hay base de datos configurada; esto es lo que ha recogido este navegador.', en: 'No database configured; this is what this browser has collected.' },
  'objectspanel.notesCount': { es: 'notas dejadas en el taco · {count}', en: 'notes left on the pad · {count}' },
  'objectspanel.unhide': { es: 'mostrar', en: 'unhide' },
  'objectspanel.hide': { es: 'ocultar', en: 'hide' },
  'objectspanel.delete': { es: 'borrar', en: 'delete' },
  'objectspanel.nothingYet': { es: 'Todavía no hay nada.', en: 'Nothing yet.' },
  'objectspanel.growing': { es: 'el bancal · {count} creciendo', en: 'the plot · {count} growing' },
  'objectspanel.plantedAgo': { es: 'plantada hace {when}', en: 'planted {when} ago' },
  'objectspanel.wateredAgo': { es: 'regada hace {when} · {count}×', en: 'watered {when} ago · {count}×' },
  'objectspanel.pullUp': { es: 'arrancar', en: 'pull it up' },
  'objectspanel.noPlants': { es: 'Todavía no ha plantado nadie.', en: 'Nobody has planted anything yet.' },
  'objectspanel.questionsCount': { es: 'preguntas · {count}', en: 'questions · {count}' },
  'objectspanel.retire': { es: 'retirar', en: 'retire' },
  'objectspanel.bringBack': { es: 'recuperar', en: 'bring back' },
  'objectspanel.questionEs': { es: 'Pregunta en español', en: 'Question in Spanish' },
  'objectspanel.questionEn': { es: 'Pregunta en inglés', en: 'Question in English' },
  'objectspanel.add': { es: 'añadir', en: 'add' },
  'objectspanel.answersCount': { es: 'respuestas · {count}', en: 'answers · {count}' },
  'objectspanel.export': { es: 'exportar', en: 'export' },
  'objectspanel.decisionsCount': { es: 'la decisión · {count}', en: 'the one decision · {count}' },
  'objectspanel.cooperate': { es: 'COOPERAR', en: 'COOPERATE' },
  'objectspanel.betray': { es: 'TRAICIONAR', en: 'BETRAY' },
  'objectspanel.cooperatedPercent': { es: 'El {percent}% cooperó.', en: '{percent}% cooperated.' },
  'objectspanel.noDecisions': { es: 'Todavía no ha decidido nadie.', en: 'Nobody has decided anything yet.' },
  'objectspanel.resetExperiment': { es: 'reiniciar el experimento', en: 'reset the experiment' },
  'objectspanel.species.tomato': { es: 'Tomate', en: 'Tomato' },
  'objectspanel.species.pepper': { es: 'Pimiento', en: 'Pepper' },
  'objectspanel.species.carrot': { es: 'Zanahoria', en: 'Carrot' },
  'objectspanel.species.lettuce': { es: 'Lechuga', en: 'Lettuce' },
  'objectspanel.species.basil': { es: 'Albahaca', en: 'Basil' },
  'objectspanel.species.strawberry': { es: 'Fresa', en: 'Strawberry' },
  'objectspanel.species.sunflower': { es: 'Girasol', en: 'Sunflower' },
  'objectspanel.trait.draggable': { es: 'arrastrable', en: 'draggable' },
  'objectspanel.trait.physics': { es: 'física', en: 'physics' },
  'objectspanel.trait.gravity': { es: 'gravedad', en: 'gravity' },
  'objectspanel.trait.blackhole': { es: 'agujero negro', en: 'black hole' },
  'objectspanel.trait.paintable': { es: 'pintable', en: 'paintable' },
  'objectspanel.trait.capture': { es: 'fotografiable', en: 'capture' },
  'objectspanel.trait.heavy': { es: 'simulación', en: 'simulation' },
  'objectspanel.object.book': { es: 'libro', en: 'book' },
  'objectspanel.object.scholarship': { es: 'carta de beca', en: 'scholarship letter' },
  'objectspanel.object.notepad': { es: 'taco de papel', en: 'notepad' },
  'objectspanel.object.paintgun': { es: 'pistola de pintura', en: 'paint gun' },
  'objectspanel.object.petri': { es: 'placa de Petri', en: 'Petri dish' },
  'objectspanel.object.physarum': { es: 'physarum', en: 'physarum' },
  'objectspanel.object.coin': { es: 'moneda', en: 'coin' },
  'objectspanel.object.pcalamp': { es: 'flexo PCA', en: 'PCA lamp' },
  'objectspanel.object.hourglass': { es: 'reloj de arena', en: 'hourglass' },
  'objectspanel.object.blackhole': { es: 'agujero negro', en: 'black hole' },
  'objectspanel.object.telescope': { es: 'telescopio', en: 'telescope' },
  'objectspanel.object.passport': { es: 'pasaporte', en: 'passport' },
  'objectspanel.object.camera': { es: 'cámara', en: 'camera' },
  'objectspanel.object.die': { es: 'dado', en: 'die' },
  'objectspanel.object.life': { es: 'juego de la vida', en: 'Game of Life' },
  'objectspanel.object.lorenz': { es: 'taza de Lorenz', en: 'Lorenz cup' },
  'objectspanel.object.regression': { es: 'regresión', en: 'regression' },
  'objectspanel.object.garden': { es: 'semillero', en: 'garden' },
  'objectspanel.object.flower': { es: 'Venus atrapamoscas', en: 'Venus flytrap' },
  'objectspanel.object.donotpress': { es: 'botón', en: 'button' },
  'objectspanel.object.calculator': { es: 'calculadora', en: 'calculator' },
  'objectspanel.object.randomwalk': { es: 'paseo aleatorio', en: 'random walk' },
  'objectspanel.object.dilemma': { es: 'dilema', en: 'dilemma' },
  'objectspanel.object.curiosity': { es: 'máquina de curiosidad', en: 'curiosity machine' },
  'objectspanel.object.arcade': { es: 'arcade', en: 'arcade' },
  'objectspanel.object.montyhall': { es: 'Monty Hall', en: 'Monty Hall' },
  'objectspanel.object.descent': { es: 'descenso de gradiente', en: 'gradient descent' },
  'objectspanel.object.voronoi': { es: 'Voronoi', en: 'Voronoi' },
  'objectspanel.object.chloroplast': { es: 'cloroplasto', en: 'chloroplast' },
  'objectspanel.object.ferrofluid': { es: 'ferrofluido', en: 'ferrofluid' },
  'objectspanel.object.chladni': { es: 'placa de Chladni', en: 'Chladni plate' },
  'objectspanel.object.dunes': { es: 'dunas', en: 'dunes' },
  'objectspanel.object.uvswitch': { es: 'interruptor UV', en: 'UV switch' },

  // ---------------------------------------------------------------- messages
  'msg.saveFailed': { es: 'No se ha podido guardar.', en: 'Could not save.' },
  'msg.textSaveFailed': { es: 'No se ha podido guardar el texto. {detail}', en: 'Could not save the text. {detail}' },
  'msg.uploadFailed': { es: 'No se ha podido subir la foto.', en: 'Could not upload the photo.' },
  'msg.imageReadFailed': { es: 'No se ha podido leer la imagen.', en: 'Could not read the image.' },
  'msg.invalidMedia': {
    es: 'Solo se pueden subir imágenes AVIF, GIF, HEIC, HEIF, JPEG, PNG o WebP, o vídeos MP4, MOV, M4V y WebM.',
    en: 'Only AVIF, GIF, HEIC, HEIF, JPEG, PNG or WebP images, or MP4, MOV, M4V and WebM videos can be uploaded.',
  },
  'msg.image': { es: 'imagen', en: 'image' },
  'msg.video': { es: 'vídeo', en: 'video' },
  'msg.mediaTooLarge': { es: 'La {kind} supera el límite de {limit} MB.', en: 'The {kind} exceeds the {limit} MB limit.' },
  'msg.translated': { es: 'Traducidos {count} campos.', en: 'Translated {count} fields.' },
  'msg.translatedOne': { es: 'Traducido 1 campo.', en: 'Translated 1 field.' },
  'msg.nothingToTranslate': { es: 'No queda nada por traducir.', en: 'Nothing left to translate.' },
  'msg.translatorFailed': { es: 'No se ha podido contactar con el traductor.', en: 'The translator could not be reached.' },
  'msg.translatorQuota': {
    es: 'El traductor gratuito ha agotado su cuota de hoy. Prueba mañana, o cambia de traductor en «aspecto».',
    en: 'The free translator has spent today’s allowance. Try tomorrow, or change translator under “theme”.',
  },
  'msg.translatorPartial': {
    es: 'Traducidos {count} campos y luego falló: {detail}',
    en: 'Translated {count} fields, then it failed: {detail}',
  },
  'msg.unsavedLeave': {
    es: 'Hay cambios sin guardar.',
    en: 'There are unsaved changes.',
  },

  // ------------------------------------------------------------- the world
  //
  // Almost nothing out here says anything. What is written down is the two or
  // three words an object genuinely needs — a hint that only shows on hover, a
  // button somebody has to be able to find, an acknowledgement. Everything else
  // is meant to be found by touching it.
  'world.zeroG': { es: 'sin gravedad', en: 'no gravity' },
  'world.lost': { es: '{n} dentro del agujero · recuperar', en: '{n} inside the hole · get them back' },

  'world.tool.drop': { es: 'soltar', en: 'put it down' },
  'world.tool.paint': { es: 'pistola', en: 'paint gun' },
  'world.tool.paint.hint': { es: 'clic para disparar · ← → cambia el color', en: 'click to shoot · ← → change the colour' },
  'world.tool.paint.clear': { es: 'limpiar las manchas', en: 'clean up the paint' },
  'world.tool.camera': { es: 'cámara', en: 'camera' },
  'world.tool.camera.hint': { es: 'clic para hacer la foto', en: 'click to take the picture' },
  'world.tool.scope': { es: 'telescopio', en: 'telescope' },
  'world.tool.scope.hint': { es: 'mueve el ratón', en: 'move the mouse' },
  'world.tool.water': { es: 'regadera', en: 'watering can' },
  'world.tool.water.hint': { es: 'clic en tu planta', en: 'click your plant' },

  'world.coin.label': { es: 'una moneda', en: 'a coin' },
  'world.coin.hint': { es: 'lánzala', en: 'flip it' },
  'world.coin.posterior': { es: 'P(cara) ≈ {p}', en: 'P(heads) ≈ {p}' },
  'world.coin.doubt': { es: 'ya no me fío de esta moneda.', en: 'I don’t trust this coin anymore.' },

  'world.die.label': { es: 'un dado', en: 'a die' },
  'world.die.hint': { es: 'tíralo', en: 'roll it' },
  'world.die.go': { es: 'abrir {entry}', en: 'open {entry}' },
  'world.die.shrug': { es: 'no hay entradas', en: 'no entries yet' },

  'world.calc.label': { es: 'una calculadora', en: 'a calculator' },
  'world.calc.clear': { es: 'borrar', en: 'clear' },

  'world.press.label': { es: 'un botón', en: 'a button' },
  'world.press.aria': { es: 'el botón', en: 'the button' },
  'world.press.plate': { es: 'NO PULSAR', en: 'DO NOT PRESS' },

  'world.book.label': { es: 'un libro', en: 'a book' },
  'world.book.hint': { es: 'ábrelo', en: 'open it' },
  'world.book.close': { es: 'cerrar el libro', en: 'close the book' },
  'world.book.prev': { es: 'página anterior', en: 'previous page' },
  'world.book.next': { es: 'página siguiente', en: 'next page' },
  'world.book.coverTitle': { es: 'GUÍA DEL AUTOESTOPISTA', en: 'THE HITCHHIKER’S GUIDE' },
  'world.book.coverSub': { es: 'GALÁCTICO', en: 'TO THE GALAXY' },
  'world.book.panic': { es: 'NO ENTRES EN PÁNICO', en: 'DON’T PANIC' },
  'world.flower.label': { es: 'una Venus atrapamoscas', en: 'a Venus flytrap' },
  'world.flower.hint': { es: 'acércate o dale de comer', en: 'come closer or feed it' },
  'world.flower.digesting': { es: 'está haciendo la digestión', en: 'it is digesting' },
  'world.flower.aria': { es: 'Venus atrapamoscas; pulsa para darle una mosca', en: 'Venus flytrap; press to feed it a fly' },
  'world.flower.caught': { es: 'moscas · {count}', en: 'flies · {count}' },
  'world.uv.label': { es: 'un interruptor', en: 'a switch' },
  'world.uv.on': { es: 'échalo', en: 'throw it' },
  'world.uv.off': { es: 'vuelve a echarlo', en: 'throw it back' },
  'world.uv.crew': { es: 'el turno de noche', en: 'the night shift' },
  'world.uv.esc': { es: 'esc para volver', en: 'esc to come back' },
  'world.uv.bay': { es: 'PUESTO {n}', en: 'BAY {n}' },
  'world.uv.works': { es: 'EN OBRAS', en: 'UNDER REPAIR' },
  'world.uv.maint': { es: 'CUADRILLA · 14 OFICIOS', en: 'MAINT. CREW · 14 TRADES' },
  'world.book.start': { es: 'el principio', en: 'the beginning' },
  'world.book.answer': { es: 'la respuesta', en: 'the answer' },
  'world.book.end': { es: 'el final', en: 'the end' },

  'world.letter.label': { es: 'una carta', en: 'a letter' },
  'world.letter.hint': { es: 'ábrela', en: 'open it' },
  'world.letter.close': { es: 'cerrar carta', en: 'close letter' },
  'world.letter.title': { es: 'Beca Kareema a la Excelencia', en: 'Kareema Excellence Scholarship' },
  'world.letter.degree': { es: 'Máster en Ciencia de Datos y Aprendizaje Automático', en: 'MSc Data Science & Machine Learning' },

  'world.note.label': { es: 'un taco de papel', en: 'a pad of paper' },
  'world.note.hint': { es: 'déjame una nota', en: 'leave me a note' },
  'world.note.placeholder': { es: 'lo que quieras…', en: 'whatever you like…' },
  'world.note.send': { es: 'clavar', en: 'spike it' },
  'world.note.thanks': { es: 'recibida.', en: 'got it.' },
  'world.note.enough': { es: 'por hoy ya vale.', en: 'that’s enough for today.' },

  'world.gun.label': { es: 'una pistola de pintura', en: 'a paint gun' },
  'world.gun.hint': { es: 'pulsa para cogerla', en: 'click to pick up' },

  'world.glass.label': { es: 'un reloj de arena', en: 'an hourglass' },
  'world.glass.hint': { es: 'dale la vuelta', en: 'turn it over' },

  'world.cup.label': { es: 'una taza', en: 'a cup' },
  'world.cup.hint': { es: 'muévela', en: 'move it' },
  'world.lorenz.ask': { es: '¿qué es esto?', en: 'what is this?' },
  'world.lorenz.answer': { es: 'determinista ≠ predecible', en: 'deterministic ≠ predictable' },

  'world.scope.label': { es: 'un telescopio', en: 'a telescope' },
  'world.scope.hint': { es: 'mira por él', en: 'look through it' },
  'world.scope.saturn': { es: 'ahí está', en: 'there it is' },

  'world.pass.label': { es: 'un pasaporte', en: 'a passport' },
  'world.pass.hint': { es: 'ábrelo', en: 'open it' },
  'world.pass.close': { es: 'cerrar', en: 'close' },
  'world.pass.photo': { es: 'foto', en: 'photo' },
  'world.pass.addPhoto': { es: 'sin foto', en: 'no photo' },
  'world.pass.dropPhoto': { es: 'suelta o elige una foto', en: 'drop or choose a photo' },
  'world.pass.note': { es: 'lo que quieras contar de este sitio', en: 'whatever you want to say about this place' },
  'world.pass.code': { es: 'código', en: 'code' },
  'world.pass.place': { es: 'lugar', en: 'place' },
  'world.pass.year': { es: 'año', en: 'year' },
  'world.pass.city': { es: 'ciudad', en: 'city' },
  'world.pass.shape': { es: 'forma', en: 'shape' },
  'world.pass.shape.round': { es: 'redondo', en: 'round' },
  'world.pass.shape.rect': { es: 'rectangular', en: 'rectangular' },
  'world.pass.shape.oval': { es: 'ovalado', en: 'oval' },
  'world.pass.shape.shield': { es: 'escudo', en: 'shield' },
  'world.pass.page': { es: 'hoja', en: 'leaf' },
  'world.pass.ink': { es: 'tinta', en: 'ink' },
  'world.pass.ink.violet': { es: 'violeta', en: 'violet' },
  'world.pass.ink.teal': { es: 'verde azulado', en: 'teal' },
  'world.pass.ink.rust': { es: 'óxido', en: 'rust' },
  'world.pass.ink.ink': { es: 'azul tinta', en: 'ink blue' },
  'world.pass.ink.green': { es: 'verde', en: 'green' },
  'world.pass.ink.sapphire': { es: 'zafiro', en: 'sapphire' },
  'world.pass.ink.blue': { es: 'azul', en: 'blue' },
  'world.pass.ink.cyan': { es: 'cian', en: 'cyan' },
  'world.pass.ink.indigo': { es: 'índigo', en: 'indigo' },
  'world.pass.ink.plum': { es: 'ciruela', en: 'plum' },
  'world.pass.ink.magenta': { es: 'magenta', en: 'magenta' },
  'world.pass.ink.rose': { es: 'rosa', en: 'rose' },
  'world.pass.ink.coral': { es: 'coral', en: 'coral' },
  'world.pass.ink.orange': { es: 'naranja', en: 'orange' },
  'world.pass.ink.ochre': { es: 'ocre', en: 'ochre' },
  'world.pass.ink.olive': { es: 'oliva', en: 'olive' },
  'world.pass.ink.forest': { es: 'bosque', en: 'forest' },
  'world.pass.ink.mint': { es: 'menta', en: 'mint' },
  'world.pass.rotation': { es: 'giro', en: 'rotation' },
  'world.pass.drag': { es: 'arrastra el sello dentro de la hoja', en: 'drag the stamp inside the leaf' },
  'world.pass.invalidPhoto': { es: 'elige una imagen válida', en: 'choose a valid image' },
  'world.pass.uploadFailed': { es: 'no se ha podido añadir la foto', en: 'the photo could not be added' },
  'world.pass.remove': { es: 'quitar sello', en: 'remove stamp' },

  'world.cam.label': { es: 'una polaroid', en: 'a polaroid' },
  'world.cam.hint': { es: 'cógela', en: 'pick it up' },
  'world.cam.discard': { es: 'tirar la foto', en: 'bin the photo' },

  'world.petri.label': { es: 'una placa de petri', en: 'a petri dish' },
  'world.petri.hint': { es: 'toca dentro', en: 'touch inside' },
  'world.petri.dials': { es: 'parámetros', en: 'parameters' },
  'world.petri.reset': { es: 'limpiar', en: 'wipe it' },

  'world.slime.label': { es: 'algo amarillo', en: 'something yellow' },
  'world.slime.hint': { es: 'dale de comer', en: 'feed it' },

  'world.pca.label': { es: 'un flexo', en: 'a lamp' },
  'world.pca.hint': { es: 'gira la nube', en: 'turn the cloud' },

  'world.hole.hint': { es: 'no le tires nada. o sí.', en: 'don’t throw anything in. or do.' },

  'world.life.label': { es: 'una cuadrícula', en: 'a grid' },
  'world.life.hint': { es: 'pinta y pulsa espacio', en: 'draw, then press space' },
  'world.life.glider': { es: 'planeador', en: 'glider' },

  'world.fit.label': { es: 'una nube de puntos', en: 'a scatterplot' },
  'world.fit.hint': { es: 'arrastra un punto muy lejos', en: 'drag a point a long way' },
  'world.fit.robust': { es: 'Robusta', en: 'Robust' },

  'world.walk.label': { es: 'un papel y un lápiz', en: 'paper and a pencil' },
  'world.walk.hint': { es: 'déjalo dibujar', en: 'let it draw' },
  'world.walk.dials': { es: 'ajustes', en: 'settings' },
  'world.walk.start': { es: 'empezar', en: 'start' },
  'world.walk.stop': { es: 'parar', en: 'stop' },
  'world.walk.clear': { es: 'borrar', en: 'clear' },
  'world.walk.drift': { es: 'deriva', en: 'drift' },

  'world.game.label': { es: 'un dinosaurio', en: 'a dinosaur' },
  'world.game.hint': { es: 'salta los cactus', en: 'jump the cacti' },
  'world.game.start': { es: 'empezar', en: 'start' },
  'world.game.again': { es: 'otra vez', en: 'again' },
  'world.game.space': { es: 'espacio', en: 'space' },

  'world.monty.label': { es: 'tres puertas', en: 'three doors' },
  'world.monty.hint': { es: 'elige una', en: 'pick one' },
  'world.monty.door': { es: 'puerta {n}', en: 'door {n}' },
  'world.monty.stay': { es: 'me quedo', en: 'stay' },
  'world.monty.switch': { es: 'cambio', en: 'switch' },
  'world.monty.reset': { es: 'borrar la cuenta', en: 'clear the tally' },

  'world.descent.label': { es: 'un paisaje que aprende', en: 'a learning landscape' },
  'world.descent.hint': { es: 'toca la malla para soltar · arrastra para girar', en: 'tap the mesh to drop · drag to turn' },
  'world.descent.canvas': { es: 'paisaje de pérdida interactivo', en: 'interactive loss landscape' },
  'world.descent.rate': { es: 'ritmo de aprendizaje', en: 'learning rate' },
  'world.descent.momentum': { es: 'inercia', en: 'momentum' },
  'world.descent.land': { es: 'nuevo paisaje extraño', en: 'new strange landscape' },
  'world.descent.reset': { es: 'repetir este paisaje', en: 'replay this landscape' },
  'world.descent.learning': { es: 'aprendiendo', en: 'learning' },
  'world.descent.settled': { es: 'estable', en: 'settled' },

  'world.crystal.label': { es: 'una placa de cristal', en: 'a glass plate' },
  'world.crystal.hint': { es: 'mueve las semillas · dos toques para quitar', en: 'move the seeds · tap twice to remove' },
  'world.crystal.toggle': { es: 'cristal o armazón', en: 'crystal or wireframe' },

  'world.cell.label': { es: 'un porta con una célula', en: 'a slide with a cell' },
  'world.cell.hint': { es: 'alúmbrala', en: 'shine on it' },
  'world.cell.lamp': { es: 'intensidad de la luz', en: 'how bright' },

  'world.ferro.label': { es: 'un charco negro', en: 'a black puddle' },
  'world.ferro.hint': { es: 'acerca el imán', en: 'bring the magnet' },
  'world.ferro.magnet': { es: 'el imán · toca para girarlo', en: 'the magnet · tap to turn it' },

  'world.chladni.label': { es: 'una placa con arena', en: 'a plate with sand' },
  'world.chladni.hint': { es: 'gira el dial', en: 'turn the dial' },
  'world.chladni.dial': { es: 'frecuencia', en: 'frequency' },

  'world.dunes.label': { es: 'un desierto de bolsillo', en: 'a pocket desert' },
  'world.dunes.hint': { es: 'mueve el ventilador', en: 'move the fan' },
  'world.dunes.fan': { es: 'el ventilador · doble toque para pararlo', en: 'the fan · double tap to stop it' },
  'world.dunes.stone': { es: 'la piedra', en: 'the stone' },
  'world.dunes.rake': { es: 'rastrillar', en: 'rake' },

  'world.vote.label': { es: 'dos palancas', en: 'two levers' },
  'world.vote.plate': { es: 'ELIGE UNA', en: 'PICK ONE' },
  'world.vote.cooperate': { es: 'COOPERAR', en: 'COOPERATE' },
  'world.vote.betray': { es: 'TRAICIONAR', en: 'BETRAY' },
  'world.vote.yours': { es: 'elegiste {choice}', en: 'you chose {choice}' },
  'world.vote.cooperated': { es: 'cooperó', en: 'cooperated' },
  'world.vote.decisions': { es: 'en total', en: 'in total' },

  'world.ask.label': { es: 'una máquina', en: 'a machine' },
  'world.ask.hint': { es: 'tira de la palanca', en: 'pull the lever' },
  'world.ask.pull': { es: 'sacar una pregunta', en: 'get a question' },
  'world.ask.plate': { es: 'CURIOSIDAD', en: 'CURIOSITY' },
  'world.ask.placeholder': { es: 'tu respuesta…', en: 'your answer…' },
  'world.ask.send': { es: 'meter', en: 'post it' },
  'world.ask.another': { es: 'otra', en: 'another' },
  'world.ask.thanks': { es: 'guardada.', en: 'kept.' },
  'world.ask.enough': { es: 'por hoy ya vale.', en: 'that’s enough for today.' },

  'world.garden.label': { es: 'un semillero', en: 'a seed tray' },
  'world.garden.hint': { es: 'planta algo', en: 'plant something' },
  'world.garden.plant': { es: 'plantar', en: 'plant' },
  'world.garden.empty': { es: 'tierra', en: 'soil' },
  'world.garden.water': { es: 'regar', en: 'water it' },
  'world.garden.watered': { es: 'regada hace {when}', en: 'watered {when} ago' },
  'world.garden.yours': { es: 'tu {name}', en: 'your {name}' },
};

/** Every key, in a stable order, for the wording panel and the tests. */
export const UI_KEYS: string[] = Object.keys(CATALOGUE);

/** The panel groups keys by prefix so the owner sees the board's areas rather
 *  than a flat list of two hundred strings. */
export const UI_SECTIONS: Array<{ prefix: string; label: Entry }> = [
  { prefix: 'board.', label: { es: 'El tablero', en: 'The board' } },
  { prefix: 'jump.', label: { es: 'Los saltos', en: 'Jump buttons' } },
  { prefix: 'owner.', label: { es: 'Tu barra', en: 'Your bar' } },
  { prefix: 'cardmenu.', label: { es: 'Menú de la tarjeta', en: 'Card menu' } },
  { prefix: 'card.', label: { es: 'Las tarjetas', en: 'The cards' } },
  { prefix: 'dossier.', label: { es: 'La página del artículo', en: 'The article page' } },
  { prefix: 'ph.', label: { es: 'Textos de ejemplo', en: 'Placeholders' } },
  { prefix: 'block.', label: { es: 'Bloques', en: 'Blocks' } },
  { prefix: 'link.', label: { es: 'Enlaces en el texto', en: 'Inline links' } },
  { prefix: 'inv.', label: { es: 'Inventario', en: 'Inventory' } },
  { prefix: 'overflow.', label: { es: 'Lista completa', en: 'Full list' } },
  { prefix: 'login.', label: { es: 'Acceso', en: 'Sign in' } },
  { prefix: 'themepanel.', label: { es: 'Editor del aspecto', en: 'Theme editor' } },
  { prefix: 'tourpanel.', label: { es: 'Editor de la visita', en: 'Tour editor' } },
  { prefix: 'option.', label: { es: 'Opciones', en: 'Options' } },
  { prefix: 'tourbar.', label: { es: 'Barra de la visita', en: 'Tour bar' } },
  { prefix: 'wording.', label: { es: 'Este panel', en: 'This panel' } },
  { prefix: 'objectspanel.', label: { es: 'Gestor de objetos', en: 'Objects manager' } },
  { prefix: 'world.', label: { es: 'Los objetos', en: 'The objects' } },
  { prefix: 'msg.', label: { es: 'Avisos', en: 'Notices' } },
];

export function sectionLabel(prefix: string, lang: string): string {
  const section = UI_SECTIONS.find((item) => item.prefix === prefix);
  if (!section) return prefix;
  return section.label[lang as keyof Entry] ?? section.label.en;
}

/** The built-in text for one key in one language, ignoring any override. */
export function defaultUiText(key: string, lang: string, primary = lang): string {
  const entry = CATALOGUE[key];
  if (!entry) return '';
  const wanted = entry[lang as keyof Entry];
  if (typeof wanted === 'string' && wanted) return wanted;
  const base = entry[primary as keyof Entry];
  if (typeof base === 'string' && base) return base;
  return entry.en;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Read `site_settings['site.ui']` defensively: anything that is not a string
 *  or a string map is dropped rather than crashing the board. */
export function parseUiOverrides(value: unknown): UiOverrides {
  if (!isRecord(value)) return {};
  const out: UiOverrides = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'string') { out[key] = raw; continue; }
    if (!isRecord(raw)) continue;
    const map: Record<string, string> = {};
    for (const [lang, text] of Object.entries(raw)) {
      if (typeof text === 'string') map[lang] = text;
    }
    if (Object.keys(map).length > 0) out[key] = map;
  }
  return out;
}

/** Replace `{name}` with the caller's values. Unknown slots stay literal, so a
 *  wording the owner typed by hand can never blow up a render. */
export function fillVars(text: string, vars?: UiVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}

/** Write one language slot of one key, dropping the entry when the owner
 *  empties it so the built-in default comes back. */
export function setUiOverride(
  overrides: UiOverrides,
  key: string,
  lang: string,
  text: string,
): UiOverrides {
  const next = { ...overrides };
  const current = next[key];
  const map: Record<string, string> = typeof current === 'string'
    ? { [lang]: current }
    : { ...(current ?? {}) };
  if (text.trim()) map[lang] = text;
  else delete map[lang];
  if (Object.keys(map).length === 0) delete next[key];
  else next[key] = map;
  return next;
}

/** Drop every override written in one language, keeping the other languages. */
export function clearUiLanguage(overrides: UiOverrides, lang: string): UiOverrides {
  const next: UiOverrides = {};
  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === 'string') { next[key] = value; continue; }
    const map = { ...value };
    delete map[lang];
    if (Object.keys(map).length > 0) next[key] = map;
  }
  return next;
}

/** Is this key carrying an owner override for this language? */
export function hasUiOverride(overrides: UiOverrides, key: string, lang: string): boolean {
  const value = overrides[key];
  if (typeof value === 'string') return value.trim().length > 0;
  if (!isRecord(value)) return false;
  const slot = value[lang];
  return typeof slot === 'string' && slot.trim().length > 0;
}

/** The owner's raw override for one key and language, or '' when there is none.
 *  The panel shows this, not the resolved text, so an empty box always means
 *  "using the built-in wording". */
export function uiOverrideText(overrides: UiOverrides, key: string, lang: string): string {
  const value = overrides[key];
  if (typeof value === 'string') return value;
  if (!isRecord(value)) return '';
  const slot = value[lang];
  return typeof slot === 'string' ? slot : '';
}

/** Build the resolver a render tree uses.
 *
 *  An override is read from its own language slot and nowhere else. Prose falls
 *  back across languages on purpose — a half-translated article is better than
 *  a blank one — but a *label* must not: renaming `entries` to `artículos` in
 *  Spanish would otherwise put the Spanish word on the English board, which is
 *  worse than the built-in English it was hiding. A missing slot falls through
 *  to the built-in wording, which has a fallback chain of its own.
 *
 *  A plain string (only ever hand-written into the settings document; the panel
 *  always writes a map) is language-neutral and applies everywhere. */
export function makeUiText(overrides: UiOverrides, lang: string, primary = lang): UiText {
  return (key, vars) => {
    const override = overrides[key];
    if (typeof override === 'string') {
      if (override.trim()) return fillVars(override, vars);
    } else if (override) {
      const slot = override[lang];
      if (typeof slot === 'string' && slot.trim()) return fillVars(slot, vars);
    }
    const built = defaultUiText(key, lang, primary);
    return fillVars(built || key, vars);
  };
}
