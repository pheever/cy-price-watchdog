import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
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
          <Link to="/" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-text)' }}>
            Cyprus Price Watchdog
          </Link>
          <nav style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/">Dashboard</Link>
            <Link to="/categories">Categories</Link>
          </nav>
        </div>
      </header>
      <main style={{ padding: '2rem 0' }}>
        <div className="container">
          <Outlet />
        </div>
      </main>
      <footer
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: '1rem 0',
          marginTop: '2rem',
          color: 'var(--color-text-muted)',
          fontSize: '0.875rem',
        }}
      >
        <div className="container">
          Data source:{' '}
          <a href="https://www.e-kalathi.gov.cy" target="_blank" rel="noopener noreferrer">
            eKalathi
          </a>
        </div>
      </footer>
    </div>
  );
}
