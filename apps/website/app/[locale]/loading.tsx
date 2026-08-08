/**
 * Default route-level loading affordance — a skeleton shaped like content (F2/F3), never a
 * blank flash. Shown while a server component's data resolves.
 */
export default function Loading() {
  return (
    <div className="site-content">
      <div className="site-state" aria-busy="true" aria-live="polite">
        <div className="site-skeleton site-skeleton--title" />
        <div className="site-skeleton site-skeleton--wide" />
        <div className="site-skeleton site-skeleton--wide" />
        <div className="site-skeleton" />
      </div>
    </div>
  );
}
