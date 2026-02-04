import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

function formatDate(dateString: string, language: string): string {
  return new Date(dateString).toLocaleString(language === 'el' ? 'el-GR' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface StatCardProps {
  icon: string;
  label: string;
  value: number;
  to?: string;
}

function StatCard({ icon, label, value, to }: StatCardProps) {
  const content = (
    <>
      <div className="icon-wrapper">
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className={`stat-value ${value === 0 ? 'empty' : ''}`}>
          {value.toLocaleString()}
        </span>
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="card stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
        {content}
      </Link>
    );
  }

  return <div className="card stat-card">{content}</div>;
}

export default function Dashboard() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: stats, loading, error } = useApi(() => api.getStats(), []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/categories?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!stats) {
    return <div className="error">{t('common.noData')}</div>;
  }

  return (
    <div>
      {/* Header with Last Scraped Badge */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <div className="badge">
          <i className="fa-solid fa-circle" style={{ color: stats.lastScrapedAt ? 'var(--color-success)' : 'var(--color-text-muted)' }}></i>
          <span>{t('dashboard.lastScraped')}</span>
          <strong>{stats.lastScrapedAt ? formatDate(stats.lastScrapedAt, language) : t('dashboard.never')}</strong>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: '2rem' }}>
        <div className="search-wrapper">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            className="input"
            placeholder={t('dashboard.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </form>

      {/* Stats Cards */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard
          icon="fa-layer-group"
          label={t('dashboard.categories')}
          value={stats.counts.categories}
          to="/categories"
        />
        <StatCard
          icon="fa-box-open"
          label={t('dashboard.products')}
          value={stats.counts.products}
          to="/categories"
        />
        <StatCard
          icon="fa-store"
          label={t('dashboard.stores')}
          value={stats.counts.stores}
        />
        <StatCard
          icon="fa-tags"
          label={t('dashboard.priceRecords')}
          value={stats.counts.priceRecords}
        />
      </div>

      {/* Quick Browse */}
      <div className="card">
        <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
          {t('dashboard.browse')}
        </p>
        <Link
          to="/categories"
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <i className="fa-solid fa-arrow-right"></i>
          {t('dashboard.browseCategories')}
        </Link>
      </div>
    </div>
  );
}
