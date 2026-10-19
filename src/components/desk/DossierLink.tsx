import { articleSlug } from '../../lib/rich-text';

/** Internal dossier references use the reader instead of an external window. */
export function DossierLink({ label, href, onOpenArticle }: {
  label: string;
  href: string;
  onOpenArticle: (slug: string) => void;
}) {
  const slug = articleSlug(href);
  return (
    <a
      href={slug ? `#article-${slug}` : href}
      target={slug ? undefined : '_blank'}
      rel={slug ? undefined : 'noreferrer'}
      data-nodrag
      onClick={slug ? (event) => { event.preventDefault(); onOpenArticle(slug); } : undefined}
    >{label} →</a>
  );
}
