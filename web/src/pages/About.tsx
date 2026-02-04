import { useLanguage } from '../contexts/LanguageContext';

export default function About() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>{t('about.title')}</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          <i className="fa-solid fa-circle-info" style={{ marginRight: '0.5rem', color: 'var(--color-primary)' }}></i>
          {t('about.projectTitle')}
        </h2>
        <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
          {t('about.description')}
        </p>
        <p style={{ lineHeight: 1.6 }}>
          {t('about.goal')}
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          <i className="fa-solid fa-code" style={{ marginRight: '0.5rem', color: 'var(--color-primary)' }}></i>
          {t('about.openSource')}
        </h2>
        <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
          {t('about.openSourceDesc')}
        </p>
        <a
          href="https://github.com/pheever/cy-price-watchdog"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <i className="fa-brands fa-github"></i>
          {t('about.viewOnGithub')}
        </a>
      </div>
    </div>
  );
}
