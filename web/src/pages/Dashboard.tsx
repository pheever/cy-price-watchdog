import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';

export default function Dashboard() {
  const { data: stats, loading, error } = useApi(() => api.getStats(), []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!stats) {
    return <div className="error">No data available</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Dashboard</h1>

      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Categories</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.counts.categories}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Products</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.counts.products}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Stores</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.counts.stores}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Price Records</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.counts.priceRecords.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Price Statistics</h2>
          <dl style={{ display: 'grid', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <dt style={{ color: 'var(--color-text-muted)' }}>Average Price</dt>
              <dd style={{ fontWeight: 500 }}>
                {stats.priceRange.avg ? `€${parseFloat(stats.priceRange.avg).toFixed(2)}` : 'N/A'}
              </dd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <dt style={{ color: 'var(--color-text-muted)' }}>Min Price</dt>
              <dd style={{ fontWeight: 500 }}>
                {stats.priceRange.min ? `€${parseFloat(stats.priceRange.min).toFixed(2)}` : 'N/A'}
              </dd>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <dt style={{ color: 'var(--color-text-muted)' }}>Max Price</dt>
              <dd style={{ fontWeight: 500 }}>
                {stats.priceRange.max ? `€${parseFloat(stats.priceRange.max).toFixed(2)}` : 'N/A'}
              </dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Data Freshness</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Last scraped:{' '}
            {stats.lastScrapedAt
              ? new Date(stats.lastScrapedAt).toLocaleString()
              : 'Never'}
          </p>
          <Link
            to="/categories"
            className="btn btn-primary"
            style={{ marginTop: '1rem', display: 'inline-block' }}
          >
            Browse Categories
          </Link>
        </div>
      </div>
    </div>
  );
}
