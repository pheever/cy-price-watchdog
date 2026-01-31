import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApi } from '../hooks/useApi';
import { api } from '../lib/api';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: product, loading, error } = useApi(
    () => api.getProduct(id!),
    [id]
  );

  const { data: prices } = useApi(
    () => api.getProductPrices(id!, { limit: 50 }),
    [id]
  );

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!product) {
    return <div className="error">Product not found</div>;
  }

  // Prepare chart data
  const chartData = prices
    ?.slice()
    .reverse()
    .map((price) => ({
      date: new Date(price.scrapedAt).toLocaleDateString(),
      price: parseFloat(price.price),
      store: price.store?.nameEnglish || price.store?.name || 'Unknown',
    }));

  return (
    <div>
      <nav style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
        <Link to="/categories">Categories</Link>
        {product.category && (
          <>
            {' / '}
            <Link to={`/categories/${product.category.id}`}>{product.category.nameEnglish}</Link>
          </>
        )}
        {' / '}
        <span style={{ color: 'var(--color-text-muted)' }}>{product.nameEnglish}</span>
      </nav>

      <h1 style={{ marginBottom: '0.5rem' }}>{product.nameEnglish}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>{product.name}</p>

      {chartData && chartData.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Price History</h2>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(value: number) => `€${value.toFixed(2)}`} />
                <Tooltip
                  formatter={(value: number) => [`€${value.toFixed(2)}`, 'Price']}
                  labelFormatter={(label: string) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {product.prices && product.prices.length > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recent Prices</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem 0' }}>Store</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {product.prices.map((price) => (
                <tr key={price.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.5rem 0' }}>
                    {price.store?.nameEnglish || price.store?.name || 'Unknown'}
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.5rem 0', fontWeight: 500 }}>
                    €{parseFloat(price.price).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.5rem 0', color: 'var(--color-text-muted)' }}>
                    {new Date(price.scrapedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
