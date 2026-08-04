import type { PortfolioEntry } from '../types/content';
import { ContentBlocks } from './ContentBlocks';
import { EntryCard } from './EntryCard';

type PublicPortfolioProps = {
  entries: PortfolioEntry[];
  remoteDataEnabled: boolean;
};

function metadata(entry: PortfolioEntry, key: string): string {
  return typeof entry.metadata[key] === 'string' ? entry.metadata[key] : '';
}

export function PublicPortfolio({ entries, remoteDataEnabled }: PublicPortfolioProps) {
  const projects = entries.filter((entry) => entry.entryType === 'project' || entry.entryType === 'case-study');
  const experience = entries.filter((entry) => entry.entryType === 'experience');
  const education = entries.filter((entry) => entry.entryType === 'education');
  const notes = entries.filter((entry) => entry.entryType === 'note');

  return (
    <>
      <section className="hero" id="inicio">
        <p className="eyebrow">Estadística · datos · producto</p>
        <h1>Modelos rigurosos, decisiones que se pueden explicar.</h1>
        <p className="hero__lede">
          Soy Alejandro Treny. Trabajo en la intersección entre ciencia de datos, forecasting y
          optimización, convirtiendo preguntas abiertas en sistemas medibles y comprensibles.
        </p>
        <div className="hero__actions">
          <a className="button" href="#proyectos">Ver proyectos</a>
          <a className="button button--secondary" href="mailto:alejandrotreny100@gmail.com">Contactar</a>
        </div>
        <div className="runtime-badge">
          <span aria-hidden="true" />
          {remoteDataEnabled ? 'Contenido servido por Neon' : 'Portfolio reproducible desde GitHub'}
        </div>
      </section>

      <section className="portfolio-stats" aria-label="Resumen del portfolio">
        <div><strong>{projects.length}</strong><span>proyectos y casos</span></div>
        <div><strong>{experience.length}</strong><span>experiencias</span></div>
        <div><strong>{education.length}</strong><span>etapas formativas</span></div>
      </section>

      <section className="work" id="proyectos" aria-labelledby="work-title">
        <div className="section-heading">
          <p className="eyebrow">Trabajo seleccionado</p>
          <h2 id="work-title">Casos y proyectos</h2>
          <p>Una selección de problemas abordados con modelos, producto y criterio de negocio.</p>
        </div>
        <div className="entry-grid">
          {projects.map((entry) => <EntryCard entry={entry} key={entry.id} />)}
        </div>
      </section>

      {experience.length > 0 ? (
        <section className="timeline-section" id="experiencia" aria-labelledby="experience-title">
          <div className="section-heading">
            <p className="eyebrow">Trayectoria</p>
            <h2 id="experience-title">Experiencia</h2>
          </div>
          <div className="timeline">
            {experience.map((entry) => (
              <article className="timeline__item" key={entry.id}>
                <div className="timeline__meta">
                  <span>{metadata(entry, 'period')}</span>
                  <strong>{metadata(entry, 'organization')}</strong>
                </div>
                <div>
                  <h3>{entry.title}</h3>
                  <p>{entry.summary}</p>
                  <ContentBlocks blocks={entry.blocks} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {education.length > 0 ? (
        <section className="education-section" id="formacion" aria-labelledby="education-title">
          <div className="section-heading">
            <p className="eyebrow">Formación</p>
            <h2 id="education-title">Base académica</h2>
          </div>
          <div className="education-grid">
            {education.map((entry) => (
              <article key={entry.id}>
                <span>{metadata(entry, 'period')}</span>
                <h3>{entry.title}</h3>
                <p>{metadata(entry, 'organization')}</p>
                <p>{entry.summary}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {notes.map((entry) => (
        <section className="about-section" id="sobre-mi" key={entry.id}>
          <p className="eyebrow">Sobre mí</p>
          <h2>{entry.title}</h2>
          <p className="about-section__lede">{entry.summary}</p>
          <ContentBlocks blocks={entry.blocks} />
        </section>
      ))}

      <section className="contact-section" id="contacto">
        <p className="eyebrow">Contacto</p>
        <h2>¿Tienes un problema interesante entre datos y decisiones?</h2>
        <a className="button" href="mailto:alejandrotreny100@gmail.com">Hablemos</a>
      </section>
    </>
  );
}
