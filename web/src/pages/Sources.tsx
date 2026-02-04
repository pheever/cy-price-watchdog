import { useLanguage } from '../contexts/LanguageContext';

export default function Sources() {
  const { t } = useLanguage();

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>{t('sources.title')}</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          <i className="fa-solid fa-database" style={{ marginRight: '0.5rem', color: 'var(--color-primary)' }}></i>
          {t('sources.ekalathiTitle')}
        </h2>
        <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>
          {t('sources.ekalathiDesc')}
        </p>
        <a
          href="https://www.e-kalathi.gov.cy"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <i className="fa-solid fa-globe"></i>
          {t('sources.visitEkalathi')}
        </a>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          <i className="fa-solid fa-rotate" style={{ marginRight: '0.5rem', color: 'var(--color-primary)' }}></i>
          {t('sources.dataCollection')}
        </h2>
        <p style={{ lineHeight: 1.6 }}>
          {t('sources.dataCollectionDesc')}
        </p>
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
          <i className="fa-solid fa-scale-balanced" style={{ marginRight: '0.5rem', color: 'var(--color-primary)' }}></i>
          {t('sources.disclaimer')}
        </h2>
        <p style={{ lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
          {t('sources.disclaimerDesc')}
        </p>
      </div>
    </div>
  );
}
