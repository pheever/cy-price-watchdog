import { Link, Outlet } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function Layout() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="layout">
      <header
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '1rem 0',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-text)', textDecoration: 'none' }}>
            <img src="/logo.png" alt="Cyprus Price Watchdog" style={{ height: '40px', width: 'auto' }} />
            <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span>Cyprus Price</span>
              <span style={{ color: 'var(--color-primary)' }}>Watchdog</span>
            </span>
          </Link>
          <nav style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
            <Link to="/categories">{t('nav.categories')}</Link>
            <Link to="/about">{t('nav.about')}</Link>
            <Link to="/sources">{t('nav.sources')}</Link>
          </nav>
          <a
            href="https://github.com/pheever/cy-price-watchdog"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
            }}
          >
            <i className="fa-brands fa-github" style={{ fontSize: '1.125rem' }}></i>
          </a>
          <button
            onClick={() => setLanguage(language === 'el' ? 'en' : 'el')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              background: 'var(--color-surface)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--color-text)',
            }}
            title={language === 'el' ? 'Switch to English' : 'Αλλαγή σε Ελληνικά'}
          >
            <i className="fa-solid fa-language"></i>
            <span>{language === 'el' ? 'EN' : 'ΕΛ'}</span>
          </button>
        </div>
      </header>
      <main style={{ padding: '2rem 0' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
