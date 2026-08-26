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
  'world.coin.doubt': { es: 'ya no me fío de esta moneda.', en: 'I don’t trust this coin anymore.' },

  'world.die.label': { es: 'un dado', en: 'a die' },
  'world.die.hint': { es: 'tíralo', en: 'roll it' },
  'world.die.go': { es: 'abrir {entry}', en: 'open {entry}' },
  'world.die.shrug': { es: 'no hay entradas', en: 'no entries yet' },

  'world.calc.label': { es: 'una calculadora', en: 'a calculator' },
  'world.calc.clear': { es: 'borrar', en: 'clear' },

  'world.press.label': { es: 'un botón', en: 'a button' },
  'world.press.aria': { es: 'el botón', en: 'the button' },

  'world.book.label': { es: 'un libro', en: 'a book' },
  'world.book.hint': { es: 'ábrelo', en: 'open it' },
  'world.book.close': { es: 'cerrar el libro', en: 'close the book' },
  'world.book.prev': { es: 'página anterior', en: 'previous page' },
  'world.book.next': { es: 'página siguiente', en: 'next page' },
  'world.uv.label': { es: 'un interruptor', en: 'a switch' },
  'world.uv.on': { es: 'échalo', en: 'throw it' },
  'world.uv.off': { es: 'vuelve a echarlo', en: 'throw it back' },
  'world.uv.crew': { es: 'el turno de noche', en: 'the night shift' },
  'world.book.start': { es: 'el principio', en: 'the beginning' },
  'world.book.answer': { es: 'la respuesta', en: 'the answer' },
  'world.book.end': { es: 'el final', en: 'the end' },

  'world.letter.label': { es: 'una carta', en: 'a letter' },
  'world.letter.hint': { es: 'ábrela', en: 'open it' },
  'world.letter.close': { es: 'cerrar carta', en: 'close letter' },

  'world.note.label': { es: 'un taco de papel', en: 'a pad of paper' },
  'world.note.hint': { es: 'déjame una nota', en: 'leave me a note' },
  'world.note.placeholder': { es: 'lo que quieras…', en: 'whatever you like…' },
  'world.note.send': { es: 'clavar', en: 'spike it' },
  'world.note.thanks': { es: 'recibida.', en: 'got it.' },
  'world.note.enough': { es: 'por hoy ya vale.', en: 'that’s enough for today.' },

  'world.gun.label': { es: 'una pistola de pintura', en: 'a paint gun' },
  'world.gun.hint': { es: 'click to pick up', en: 'click to pick up' },

  'world.glass.label': { es: 'un reloj de arena', en: 'an hourglass' },
  'world.glass.hint': { es: 'dale la vuelta', en: 'turn it over' },

  'world.cup.label': { es: 'una taza', en: 'a cup' },
  'world.cup.hint': { es: 'muévela', en: 'move it' },
  'world.lorenz.ask': { es: '¿qué es esto?', en: 'what is this?' },

  'world.scope.label': { es: 'un telescopio', en: 'a telescope' },
  'world.scope.hint': { es: 'mira por él', en: 'look through it' },
  'world.scope.saturn': { es: 'ahí está', en: 'there it is' },

  'world.pass.label': { es: 'un pasaporte', en: 'a passport' },
  'world.pass.hint': { es: 'ábrelo', en: 'open it' },
  'world.pass.close': { es: 'cerrar', en: 'close' },
  'world.pass.photo': { es: 'foto', en: 'photo' },
  'world.pass.addPhoto': { es: 'sin foto', en: 'no photo' },
  'world.pass.note': { es: 'lo que quieras contar de este sitio', en: 'whatever you want to say about this place' },
  'world.pass.city': { es: 'ciudad', en: 'city' },
  'world.pass.page': { es: 'hoja', en: 'leaf' },
  'world.pass.ink': { es: 'tinta', en: 'ink' },
  'world.pass.rotation': { es: 'giro', en: 'rotation' },
  'world.pass.drag': { es: 'arrastra el sello dentro de la hoja', en: 'drag the stamp inside the leaf' },
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

  'world.fit.label': { es: 'una nube de puntos', en: 'a scatterplot' },
  'world.fit.hint': { es: 'arrastra un punto muy lejos', en: 'drag a point a long way' },

  'world.walk.label': { es: 'un papel y un lápiz', en: 'paper and a pencil' },
  'world.walk.hint': { es: 'déjalo dibujar', en: 'let it draw' },
  'world.walk.dials': { es: 'ajustes', en: 'settings' },

  'world.game.label': { es: 'un dinosaurio', en: 'a dinosaur' },
  'world.game.hint': { es: 'salta los cactus', en: 'jump the cacti' },
  'world.game.start': { es: 'empezar', en: 'start' },
  'world.game.again': { es: 'otra vez', en: 'again' },

  'world.monty.label': { es: 'tres puertas', en: 'three doors' },
  'world.monty.hint': { es: 'elige una', en: 'pick one' },
  'world.monty.door': { es: 'puerta {n}', en: 'door {n}' },
  'world.monty.stay': { es: 'me quedo', en: 'stay' },
  'world.monty.switch': { es: 'cambio', en: 'switch' },
  'world.monty.reset': { es: 'borrar la cuenta', en: 'clear the tally' },

  'world.descent.label': { es: 'una bandeja con una canica', en: 'a tray with a marble' },
  'world.descent.hint': { es: 'gira el plano · toca para soltarla', en: 'turn the plot · tap to drop it' },
  'world.descent.rate': { es: 'ritmo de aprendizaje', en: 'learning rate' },
  'world.descent.momentum': { es: 'inercia', en: 'momentum' },
  'world.descent.land': { es: 'otro paisaje', en: 'another landscape' },
  'world.descent.reset': { es: 'volver a empezar', en: 'start again' },

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
  'world.vote.yours': { es: 'elegiste {choice}', en: 'you chose {choice}' },
  'world.vote.cooperated': { es: 'cooperó', en: 'cooperated' },
  'world.vote.decisions': { es: 'en total', en: 'in total' },

  'world.ask.label': { es: 'una máquina', en: 'a machine' },
  'world.ask.hint': { es: 'tira de la palanca', en: 'pull the lever' },
  'world.ask.pull': { es: 'sacar una pregunta', en: 'get a question' },
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
  { prefix: 'tourbar.', label: { es: 'Barra de la visita', en: 'Tour bar' } },
  { prefix: 'wording.', label: { es: 'Este panel', en: 'This panel' } },
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
