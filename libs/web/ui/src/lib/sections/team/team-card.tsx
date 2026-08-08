import type { TeamCardData } from './derive-team.js';

/**
 * One team-member card (a pure server component — no `useEditContext`, so the website ships zero client
 * islands for the roster). Avatar image when present, else a gradient-initial disc (F3). Optional
 * LinkedIn/GitHub pills. Tokens-only `.web-team-*`, logical properties (RTL, U6/U7).
 */
export function TeamCard({ card }: { card: TeamCardData }) {
  return (
    <div className="web-panel web-team-card">
      <div className="web-team-avatar">
        {card.avatarUrl ? (
          <img
            className="web-team-avatar-img"
            src={card.avatarUrl}
            alt={card.name}
          />
        ) : (
          <span className="web-team-avatar-fallback" aria-hidden="true">
            {card.initial}
          </span>
        )}
      </div>
      <h3 className="web-team-name">{card.name}</h3>
      {card.role ? <p className="web-team-role">{card.role}</p> : null}
      {card.linkedinUrl || card.githubUrl ? (
        <div className="web-team-social">
          {card.linkedinUrl ? (
            <a
              className="web-team-pill"
              href={card.linkedinUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              LinkedIn
            </a>
          ) : null}
          {card.githubUrl ? (
            <a
              className="web-team-pill"
              href={card.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              GitHub
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
