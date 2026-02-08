import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api, type Category, type Product } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

function SearchResults({ query }: { query: string }) {
  const { t } = useLanguage();
  const { data: products, loading, error } = useApi(
    () => api.getProducts({ search: query, limit: 50 }),
    [query]
  );

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <nav style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
        <Link to="/categories">{t('categories.allCategories')}</Link>
        {' / '}
        <span style={{ color: 'var(--color-text-muted)' }}>Search: "{query}"</span>
      </nav>

      <h1 style={{ marginBottom: '1.5rem' }}>
        {products?.length || 0} results for "{query}"
      </h1>

      {products && products.length > 0 ? (
        <div className="grid grid-2">
          {products.map((product: Product) => (
            <Link key={product.id} to={`/products/${product.id}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ fontWeight: 500 }}>{product.name}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{product.nameEnglish}</div>
              {product.unit && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', marginTop: '0.25rem' }}>
                  {product.unit}
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--color-text-muted)' }}>{t('common.noData')}</p>
      )}
    </div>
  );
}

function CategoryDetail({ id }: { id: string }) {
  const { t } = useLanguage();
  const { data: category, loading, error } = useApi(
    () => api.getCategory(id),
    [id]
  );
  const isSubcategory = category && (!category.children || category.children.length === 0);
  const { data: stats } = useApi(
    () => isSubcategory ? api.getCategoryStats(id) : Promise.resolve({ data: null, error: null, meta: null }),
    [id, isSubcategory]
  );

  if (loading) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!category) {
    return <div className="error">{t('common.noData')}</div>;
  }

  return (
    <div>
      <nav style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
        <Link to="/categories">{t('categories.allCategories')}</Link>
        {category.parent && (
          <>
            {' / '}
            <Link to={`/categories/${category.parent.id}`}>{category.parent.nameEnglish}</Link>
          </>
        )}
        {' / '}
        <span style={{ color: 'var(--color-text-muted)' }}>{category.nameEnglish}</span>
      </nav>

      <h1 style={{ marginBottom: '1.5rem' }}>{category.nameEnglish}</h1>

      {/* Cheapest Products */}
      {stats?.cheapest && stats.cheapest.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t('categories.cheapest')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.cheapest.map((item, index) => (
              <Link
                key={item.productId}
                to={`/products/${item.productId}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: index === 0 ? 'rgba(34, 197, 94, 0.1)' : 'var(--color-bg)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', minWidth: '1.5rem', textAlign: 'right' }}>
                  {index + 1}.
                </span>
                <span style={{ flex: 1, fontWeight: 500 }}>{item.name}</span>
                <span style={{ fontWeight: 700, color: index === 0 ? 'var(--color-success)' : undefined }}>
                  €{item.minPrice.toFixed(2)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {category.children && category.children.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t('categories.subcategories')}</h2>
          <div className="grid grid-3">
            {category.children.map((child: Category) => (
              <Link key={child.id} to={`/categories/${child.id}`} className="card" style={{ display: 'block' }}>
                <div style={{ fontWeight: 500 }}>{child.nameEnglish}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{child.name}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {category.products && category.products.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t('categories.products')}</h2>
          <div className="grid grid-2">
            {category.products.map((product: Product) => (
              <Link key={product.id} to={`/products/${product.id}`} className="card" style={{ display: 'block' }}>
                <div style={{ fontWeight: 500 }}>{product.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{product.nameEnglish}</div>
                {product.unit && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', marginTop: '0.25rem' }}>
                    {product.unit}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryList() {
  const { data: categories, loading, error } = useApi(
    () => api.getCategories(),
    []
  );

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Categories</h1>
      <div className="grid grid-3">
        {categories?.map((category: Category) => (
          <Link key={category.id} to={`/categories/${category.id}`} className="card" style={{ display: 'block' }}>
            <div style={{ fontWeight: 500 }}>{category.nameEnglish}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{category.name}</div>
            {category.children && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary)', marginTop: '0.5rem' }}>
                {category.children.length} subcategories
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Categories() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');

  if (searchQuery) {
    return <SearchResults query={searchQuery} />;
  }

  if (id) {
    return <CategoryDetail id={id} />;
  }

  return <CategoryList />;
}
