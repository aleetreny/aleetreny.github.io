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

  // ---------------------------------------------------------------- messages
  'msg.saveFailed': { es: 'No se ha podido guardar.', en: 'Could not save.' },
  'msg.textSaveFailed': { es: 'No se ha podido guardar el texto. {detail}', en: 'Could not save the text. {detail}' },
  'msg.uploadFailed': { es: 'No se ha podido subir la foto.', en: 'Could not upload the photo.' },
  'msg.imageReadFailed': { es: 'No se ha podido leer la imagen.', en: 'Could not read the image.' },
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
  { prefix: 'tourbar.', label: { es: 'Barra de la visita', en: 'Tour bar' } },
  { prefix: 'wording.', label: { es: 'Este panel', en: 'This panel' } },
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
