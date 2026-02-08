import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api, type StoreStats } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

function formatDate(dateString: string, language: string): string {
  return new Date(dateString).toLocaleDateString(language === 'el' ? 'el-GR' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

type SortField = 'store' | 'chain' | 'current' | 'min' | 'avg' | 'max';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 50;

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();

  // State for table features
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('current');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const { data: product, loading, error } = useApi(
    () => api.getProduct(id!),
    [id]
  );

  const { data: stats } = useApi(
    () => api.getProductStats(id!),
    [id]
  );

  // Handle scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter and sort stores
  const filteredAndSortedStores = useMemo(() => {
    if (!stats?.byStore) return [];

    let result = [...stats.byStore];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (store) =>
          store.storeName.toLowerCase().includes(query) ||
          (store.storeChain?.toLowerCase().includes(query) ?? false)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'store':
          comparison = a.storeName.localeCompare(b.storeName);
          break;
        case 'chain':
          comparison = (a.storeChain || '').localeCompare(b.storeChain || '');
          break;
        case 'current':
          comparison = a.current - b.current;
          break;
        case 'min':
          comparison = a.min - b.min;
          break;
        case 'avg':
          comparison = a.avg - b.avg;
          break;
        case 'max':
          comparison = a.max - b.max;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [stats?.byStore, searchQuery, sortField, sortDirection]);

  const visibleStores = filteredAndSortedStores.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSortedStores.length;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return 'fa-sort';
    return sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!product) {
    return <div className="error">{t('product.notFound')}</div>;
  }

  const productName = product.name;
  const productNameAlt = product.nameEnglish;
  const categoryName = language === 'el' ? product.category?.name : product.category?.nameEnglish;

  const renderSortableHeader = (field: SortField, label: string, align: 'left' | 'right' = 'left') => (
    <th
      className="sortable"
      style={{ textAlign: align }}
      onClick={() => handleSort(field)}
    >
      {label}
      <i className={`fa-solid ${getSortIcon(field)} sort-icon`}></i>
    </th>
  );

  const renderStoreRow = (store: StoreStats) => {
    const isLowest = store.current === stats?.current?.min;
    const isHighest = store.current === stats?.current?.max;

    return (
      <tr key={store.storeId}>
        <td>{store.storeName}</td>
        <td style={{ color: 'var(--color-text-muted)' }}>{store.storeChain || '-'}</td>
        <td className={`price-cell ${isLowest ? 'price-lowest' : isHighest ? 'price-highest' : ''}`} style={{ textAlign: 'right' }}>
          €{store.current.toFixed(2)}
        </td>
        <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>€{store.min.toFixed(2)}</td>
        <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>€{store.avg.toFixed(2)}</td>
        <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>€{store.max.toFixed(2)}</td>
      </tr>
    );
  };

  const renderStoreCard = (store: StoreStats) => {
    const isLowest = store.current === stats?.current?.min;

    return (
      <div key={store.storeId} className={`store-card ${isLowest ? 'lowest' : ''}`}>
        <div className="store-card-header">
          <div>
            <div className="store-card-name">{store.storeName}</div>
            <div className="store-card-chain">{store.storeChain || '-'}</div>
          </div>
          <div className={`store-card-price ${isLowest ? 'lowest' : ''}`}>
            €{store.current.toFixed(2)}
          </div>
        </div>
        <div className="store-card-stats">
          <span>{t('product.min')}: €{store.min.toFixed(2)}</span>
          <span>{t('product.avg')}: €{store.avg.toFixed(2)}</span>
          <span>{t('product.max')}: €{store.max.toFixed(2)}</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
        <Link to="/categories">{t('nav.categories')}</Link>
        {product.category && (
          <>
            {' / '}
            <Link to={`/categories/${product.category.id}`}>{categoryName}</Link>
          </>
        )}
        {' / '}
        <span style={{ color: 'var(--color-text-muted)' }}>{productName}</span>
      </nav>

      <h1 style={{ marginBottom: '0.5rem' }}>{productName}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>{productNameAlt}</p>

      {/* Current Price Summary */}
      {stats?.current && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t('product.currentPriceSummary')}</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
            {t('product.basedOnStores')
              .replace('{count}', String(stats.current.storeCount))
              .replace('{date}', formatDate(stats.current.scrapedAt, language))}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{t('product.minPrice')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>
                €{stats.current.min?.toFixed(2) ?? '-'}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--color-bg)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{t('product.avgPrice')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                €{stats.current.avg?.toFixed(2) ?? '-'}
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{t('product.maxPrice')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-error)' }}>
                €{stats.current.max?.toFixed(2) ?? '-'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prices by District */}
      {stats?.byDistrict && stats.byDistrict.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t('product.pricesByDistrict')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            {stats.byDistrict.map((district) => {
              const isLowest = district.avg === Math.min(...stats.byDistrict.map(d => d.avg));
              const isHighest = district.avg === Math.max(...stats.byDistrict.map(d => d.avg));
              return (
                <div
                  key={district.district}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background: isLowest
                      ? 'rgba(34, 197, 94, 0.1)'
                      : isHighest
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{district.district}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>{t('product.avg')}:</span>
                    <span style={{ fontWeight: 600, color: isLowest ? 'var(--color-success)' : isHighest ? 'var(--color-error)' : undefined }}>
                      €{district.avg.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <span>€{district.min.toFixed(2)} - €{district.max.toFixed(2)}</span>
                    <span>{district.storeCount} {t('product.stores')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-Store Prices */}
      {stats?.byStore && stats.byStore.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{t('product.pricesByStore')}</h2>
            <div className="search-wrapper" style={{ width: '300px', maxWidth: '100%' }}>
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                className="input"
                placeholder={t('product.searchStores') || 'Search stores...'}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(ITEMS_PER_PAGE);
                }}
              />
            </div>
          </div>

          {/* Desktop Table */}
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {renderSortableHeader('store', t('product.store'))}
                  {renderSortableHeader('chain', t('product.chain'))}
                  {renderSortableHeader('current', t('product.current'), 'right')}
                  {renderSortableHeader('min', t('product.min'), 'right')}
                  {renderSortableHeader('avg', t('product.avg'), 'right')}
                  {renderSortableHeader('max', t('product.max'), 'right')}
                </tr>
              </thead>
              <tbody>
                {visibleStores.map(renderStoreRow)}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="store-cards-mobile">
            {visibleStores.map(renderStoreCard)}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="load-more">
              <button
                className="btn btn-secondary"
                onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
              >
                <i className="fa-solid fa-plus" style={{ marginRight: '0.5rem' }}></i>
                {t('product.loadMore') || 'Load More'} ({filteredAndSortedStores.length - visibleCount} remaining)
              </button>
            </div>
          )}

          {/* Results count */}
          {searchQuery && (
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              {filteredAndSortedStores.length} {t('product.stores')} found
            </p>
          )}
        </div>
      )}

      {/* No data state */}
      {(!stats?.current && !stats?.byStore?.length) && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>{t('product.noData')}</p>
        </div>
      )}

      {/* Back to Top Button */}
      <button
        className={`back-to-top ${showBackToTop ? '' : 'hidden'}`}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <i className="fa-solid fa-arrow-up"></i>
      </button>
    </div>
  );
}
