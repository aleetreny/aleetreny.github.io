// Four works, newest first. Mapping Science is the UC3M master's thesis.
const text = (es, en) => ({ type: 'text', props: { text: { es, en } } });
const link = (es, en, href) => [{ es, en }, href];
const links = (...items) => ({ type: 'links', props: { items } });

export const RESEARCH_GROUP = { id: 'research', label: { es: 'Investigación', en: 'Research' } };
// The first release accidentally gave the TFM a second dossier. Keep its
// original Mapping Science identity and move the duplicate to recoverable trash.
export const RETIRED_RESEARCH_SLUGS = ['investigacion-tfm'];

export const RESEARCH_ITEMS = {
  'investigacion-articulo': {
    group: RESEARCH_GROUP.id, order: 0,
    kicker: { es: 'Artículo · arXiv', en: 'Article · arXiv' },
    when: { es: 'Octubre 2026', en: 'October 2026' }, where: { es: 'Preprint en arXiv', en: 'arXiv preprint' },
    title: { es: '¿Cuánto depende el mapa del modelo?', en: 'How much does the map depend on the model?' },
    lede: { es: 'Seguí tirando del hilo del TFM y acabó saliendo un paper.', en: 'I kept following the thread from my master’s thesis and it turned into a paper.' },
    blocks: [
      text('Después de Mapping Science me quedé con una duda: si cambio el modelo de embeddings, ¿cambia también lo que estoy viendo? Probé diez modelos sobre los mismos 500.000 papers. Los mapas generales se parecen bastante, pero al mirar los vecinos de cada artículo la cosa cambia mucho.', 'After Mapping Science I was left wondering: if I change the embedding model, does what I see change too? I tried ten models on the same 500,000 papers. The overall maps look quite similar, but look at each paper’s neighbours and things change a lot.'),
      text('Bueno, la duda dio para bastante y acabé publicándolo en arXiv. Me hace especial ilusión haber llegado hasta aquí. El código y los resultados están abiertos para quien quiera curiosear.', 'Well, that question went quite a long way and I ended up posting it on arXiv. I am particularly excited to have got this far. The code and results are open for anyone who wants to have a look.'),
      links(link('Leer el paper', 'Read the paper', 'https://arxiv.org/abs/2610.16639'), link('Código y resultados', 'Code and results', 'https://doi.org/10.5281/zenodo.22876602'), link('Mapping Science · el TFM', 'Mapping Science · the master’s thesis', 'article:mapping-science')),
    ],
  },
  'mapping-science': {
    id: '4339eddf-208b-5edf-a06d-700019dc03c8',
    group: RESEARCH_GROUP.id, order: 1,
    kicker: { es: 'TFM · UC3M', en: 'Master’s thesis · UC3M' },
    when: '2026', where: { es: 'Universidad Carlos III de Madrid', en: 'Universidad Carlos III de Madrid' },
    title: { es: 'Mapping Science', en: 'Mapping Science' },
    lede: { es: 'Mi TFM: comparar ciencias mirando la forma de sus nubes de papers.', en: 'My master’s thesis: comparing sciences through the shape of their paper clouds.' },
    blocks: [
      text('Este proyecto es mi TFM de la UC3M. Bueno, pensé que podríamos usar embeddings una vez más para cuantificar lo abstracto: convertir los papers de cada disciplina en una nube de puntos y comparar sus formas. Al final fueron más de 2,3 millones de artículos y unas cuantas pruebas hasta quedarme con ocho medidas.', 'This project is my master’s thesis at UC3M. Well, I thought we could use embeddings once again to quantify the abstract: turn each discipline’s papers into a cloud of points and compare their shapes. In the end it was over 2.3 million papers and quite a few attempts before settling on eight measures.'),
      text('Lo bonito es encontrar ciencias que hablan de cosas completamente distintas y aun así se parecen en forma. Además del código y la memoria, hice una web para pasearse por esas nubes. Tiene un enfoque más artístico que científico, pero se disfruta.', 'The lovely part is finding sciences that study completely different things and still have similar shapes. Besides the code and the thesis, I made a website to wander through those clouds. It is more artistic than scientific, but it is fun.'),
      text('Mi tutora fue María Luz Durbán, catedrática de Estadística en la UC3M. Ya me había encantado cómo daba Modelos de Regresión, relacionando las matemáticas con casos reales. Da gusto aprender de alguien así.', 'My supervisor was María Luz Durbán, Professor of Statistics at UC3M. I had already loved her Regression Models classes, connecting the maths with real cases. It is a pleasure to learn from someone like that.'),
      links(link('Leer el TFM', 'Read the thesis', 'https://aleetreny.github.io/trabajos-academicos/TFM-UC3M.pdf'), ['GitHub', 'https://github.com/aleetreny/Mapping-Science'], link('Pasearse por el mapa', 'Wander through the map', 'https://aleetreny.github.io/Mapping-Science/'), link('El paper que vino después', 'The paper that followed', 'article:investigacion-articulo'), ['María Luz Durbán · UC3M', 'https://researchportal.uc3m.es/display/inv18373']),
      { id: '0dcf739c-fdd9-4769-b3a2-801493de9e98', type: 'image', props: { alt: { es: 'Nube de publicaciones de Farmacología, Toxicología y Farmacia', en: 'Publication cloud for Pharmacology, Toxicology and Pharmaceutics' }, url: 'https://br-blue-dawn-ay0e37ed.storage.c-5.us-east-2.aws.neon.tech/portfolio-assets/d245e522-0791-420d-9454-04e3f0e7e34e/0115a4ca-9980-44dd-96c1-51db542c4bae-field__30__pharmacology_toxicology_and_pharmaceutics.png', caption: { es: 'Una de las nubes de Mapping Science.', en: 'One of the Mapping Science clouds.' } } },
    ],
  },
  'investigacion-ade': {
    group: RESEARCH_GROUP.id, order: 2,
    kicker: { es: 'TFG · ADE', en: 'Undergraduate thesis · Business' },
    when: '2025', where: { es: 'Universidad de Málaga · con Ignacio Ortiz Serratosa', en: 'University of Málaga · with Ignacio Ortiz Serratosa' },
    title: { es: 'Trabajar y seguir siendo pobre', en: 'Working and still being poor' },
    lede: { es: 'Tener trabajo no siempre te saca de la pobreza.', en: 'Having a job does not always get you out of poverty.' },
    blocks: [
      text('Este fue mi TFG de ADE, con Ignacio Ortiz Serratosa. Miramos la pobreza laboral en España usando la Encuesta de Condiciones de Vida de 2024. Nos salía que un 11,3 % de las personas ocupadas vivía bajo el umbral de pobreza. Lo de encontrar trabajo y tenerlo todo resuelto, pues no siempre.', 'This was my Business undergraduate thesis, with Ignacio Ortiz Serratosa. We looked at in-work poverty in Spain using the 2024 Living Conditions Survey. We found that 11.3% of employed people lived below the poverty threshold. So finding a job and having everything sorted, well, not always.'),
      text('Probamos regresiones logísticas y distintas formas de elegir las variables. Además del sueldo, importaba mucho qué pasaba en casa: cuántos trabajan, cuántos dependen de ellos... Son asociaciones, pero ayudan a ver por qué mirar solo el contrato se queda corto.', 'We tried logistic regressions and different ways of choosing the variables. Besides wages, what happened at home mattered a lot: how many people work, how many depend on them... These are associations, but they help explain why looking only at the contract is not enough.'),
      text('Contamos con Elena Bárcena, catedrática de Economía Aplicada en la UMA y experta en pobreza y desigualdad. Poder trabajar este tema con alguien que lo conoce tan de cerca fue un lujo.', 'We had support from Elena Bárcena, Professor of Applied Economics at UMA and an expert on poverty and inequality. Getting to work on this with someone who knows the subject so closely was a real privilege.'),
      links(link('Leer el TFG', 'Read the thesis', 'https://aleetreny.github.io/trabajos-academicos/TFG-ADE.pdf'), ['Elena Bárcena · UMA', 'https://www.uma.es/departamento-de-estadistica-y-econometria/info/78808/elena-barcena-martin/']),
    ],
  },
  'investigacion-economia': {
    group: RESEARCH_GROUP.id, order: 3,
    kicker: { es: 'TFG · Economía', en: 'Undergraduate thesis · Economics' },
    when: '2025', where: { es: 'Universidad de Málaga · con Ignacio Ortiz Serratosa', en: 'University of Málaga · with Ignacio Ortiz Serratosa' },
    title: { es: 'IA, automatización y sector público', en: 'AI, automation and the public sector' },
    lede: { es: 'Si las máquinas trabajan más, ¿qué hacemos con los impuestos y el empleo?', en: 'If machines do more of the work, what happens to taxes and jobs?' },
    blocks: [
      text('Para el TFG de Economía, Ignacio Ortiz Serratosa y yo nos metimos en un tema que me sigue interesando mucho: qué pasa con el empleo, la desigualdad y las cuentas públicas cuando automatizamos cada vez más cosas.', 'For our Economics undergraduate thesis, Ignacio Ortiz Serratosa and I got into a subject I am still very interested in: what happens to jobs, inequality and public finances as we automate more and more things.'),
      text('Fue una revisión de literatura y de propuestas, desde gravar robots hasta la renta básica. Muchas ideas suenan muy bien hasta que toca ver cómo se pagan y qué efectos tienen. Ahí estaba buena parte de la gracia.', 'It was a review of the literature and policy proposals, from taxing robots to basic income. Lots of ideas sound great until you have to work out how to pay for them and what effects they have. That was a big part of the interest.'),
      text('Nos tutorizó José Manuel Domínguez, catedrático de Hacienda Pública en la UMA y presidente de la Fundación Unicaja. Sabe una barbaridad de estos temas; fue una suerte poder aprender de él.', 'Our supervisor was José Manuel Domínguez, Professor of Public Finance at UMA and President of Fundación Unicaja. He knows an enormous amount about these subjects; we were lucky to learn from him.'),
      links(link('Leer el TFG', 'Read the thesis', 'https://aleetreny.github.io/trabajos-academicos/TFG-Economia.pdf'), ['José Manuel Domínguez · Fundación Unicaja', 'https://www.fundacionunicaja.com/event/presentacion-del-libro-enrique-fuentes-quintana-1924-2007-in-memoriam-en-el-centenario-de-su-nacimiento-de-la-academia-de-ciencias-sociales-y-medio-ambiente-de-andalucia/']),
    ],
  },
};
