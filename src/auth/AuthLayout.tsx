import type { ReactNode } from 'react';
import {
  APP_NAME,
  CREDITS,
  DESCRIPTION,
  FEATURES,
  HEADLINE,
  LOGO_SRC,
  SHOWCASE_IMAGES,
  SOURCE_URL,
  TECH_STACK,
  type FeatureIcon,
} from './content';
import { CloudIcon, GamepadIcon, GitHubIcon, TrophyIcon } from './icons';

const FEATURE_ICONS: Record<FeatureIcon, typeof TrophyIcon> = {
  trophy: TrophyIcon,
  gamepad: GamepadIcon,
  cloud: CloudIcon,
};

/**
 * One-page auth shell: a short overview of the project, the form in a card,
 * then the features and tech stack. Every auth screen renders inside it.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-page">
      <header className="auth-topbar">
        <div className="auth-brand">
          <img src={LOGO_SRC} alt="" width={36} height={36} className="auth-logo" />
          <span>{APP_NAME}</span>
        </div>
        <a className="auth-source" href={SOURCE_URL} target="_blank" rel="noreferrer">
          <GitHubIcon />
          <span>Source on GitHub</span>
        </a>
      </header>

      <main className="auth-main">
        <section className="auth-hero" aria-label={`About ${APP_NAME}`}>
          <div className="auth-fan">
            {SHOWCASE_IMAGES.map((img) => (
              <figure key={img.src} className={`auth-fan__card auth-fan__card--${img.kind}`}>
                <img src={img.src} alt={img.alt} />
              </figure>
            ))}
          </div>
          <p className="auth-headline">
            {/* Keep each sentence together so the line breaks after the full stop. */}
            {HEADLINE.split(/(?<=\.)\s+/).map((sentence, i) => (
              <span key={i}>
                {i > 0 && ' '}
                <span className="auth-headline__part">{sentence}</span>
              </span>
            ))}
          </p>
          <p className="auth-description">{DESCRIPTION}</p>
        </section>

        <section className="auth-card" aria-label="Your account">
          {children}
        </section>

        <section className="auth-overview" aria-labelledby="auth-overview-title">
          <h2 id="auth-overview-title" className="auth-section-title">
            What's inside
          </h2>
          <ul className="auth-features">
            {FEATURES.map((f) => {
              const Icon = FEATURE_ICONS[f.icon];
              return (
                <li key={f.title}>
                  <span className="auth-features__icon">
                    <Icon />
                  </span>
                  <strong>{f.title}</strong>
                  <span className="auth-features__text">{f.text}</span>
                </li>
              );
            })}
          </ul>
          <ul className="auth-chips" aria-label="Tech stack">
            {TECH_STACK.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="auth-footer">
        <span>{CREDITS}</span>
        <span aria-hidden="true">·</span>
        <a href={SOURCE_URL} target="_blank" rel="noreferrer">
          View the source on GitHub
        </a>
      </footer>
    </div>
  );
}
