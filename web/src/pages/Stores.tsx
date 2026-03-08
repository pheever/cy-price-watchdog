import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { api, type Store } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const districtLabels: Record<string, { el: string; en: string }> = {
  'ΛΕΥΚΩΣΙΑ': { el: 'Λευκωσία', en: 'Nicosia' },
  'ΛΕΜΕΣΟΣ':  { el: 'Λεμεσός',  en: 'Limassol' },
  'ΛΑΡΝΑΚΑ':  { el: 'Λάρνακα',  en: 'Larnaca' },
  'ΠΑΦΟΣ':    { el: 'Πάφος',    en: 'Paphos' },
  'ΑΜΜΟΧΩΣΤΟΣ': { el: 'Αμμόχωστος', en: 'Famagusta' },
};

function getDistrictLabel(district: string, language: string): string {
  const labels = districtLabels[district.trim()];
  if (!labels) return district.trim();
  return language === 'en' ? labels.en : labels.el;
}

interface ParsedLocation {
  address: string;
  coordsDisplay: string | null;
  lat: number | null;
  lng: number | null;
}

function dmsToDecimal(dms: string): number {
  const m = /^(\d+)°(\d+)'(\d+(?:\.\d+)?)"([NSEW])$/.exec(dms.trim());
  if (!m) return NaN;
  const dec = parseInt(m[1]!) + parseInt(m[2]!) / 60 + parseFloat(m[3]!) / 3600;
  return m[4] === 'S' || m[4] === 'W' ? -dec : dec;
}

function parseLocation(location: string | null): ParsedLocation | null {
  if (!location) return null;

  // DMS format: "Address (35°05'04.0"N, 33°52'40.3"E)"
  const dmsMatch = /^(.*?)\s*\((\d+°\d+'\d+(?:\.\d+)?"[NS]),\s*(\d+°\d+'\d+(?:\.\d+)?"[EW])\)$/.exec(location);
  if (dmsMatch) {
    const latDms = dmsMatch[2]!;
    const lngDms = dmsMatch[3]!;
    return {
      address: dmsMatch[1]?.trim() ?? '',
      coordsDisplay: `${latDms}, ${lngDms}`,
      lat: dmsToDecimal(latDms),
      lng: dmsToDecimal(lngDms),
    };
  }

  // Decimal format: "Address (35.1234, 33.5678)"
  const decMatch = /^(.*?)\s*\((-?\d+\.?\d*),\s*(-?\d+\.?\d*)\)$/.exec(location);
  if (decMatch) {
    const lat = parseFloat(decMatch[2]!);
    const lng = parseFloat(decMatch[3]!);
    return {
      address: decMatch[1]?.trim() ?? '',
      coordsDisplay: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      lat,
      lng,
    };
  }

  return { address: location.trim(), coordsDisplay: null, lat: null, lng: null };
}

function groupByDistrict(stores: Store[]): Record<string, Store[]> {
  return stores.reduce<Record<string, Store[]>>((acc, store) => {
    const key = store.district ?? '__none__';
    if (!acc[key]) acc[key] = [];
    acc[key].push(store);
    return acc;
  }, {});
}

export default function Stores() {
  const { t, language } = useLanguage();
  useDocumentTitle(t('stores.title'));
  const { data: stores, loading, error } = useApi(() => api.getStores(), []);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (loading) return <div className="loading">{t('common.loading')}</div>;
  if (error) return <div className="error">{error}</div>;
  if (!stores?.length) return <div className="error">{t('common.noData')}</div>;

  const grouped = groupByDistrict(stores);
  const districts = Object.keys(grouped).sort((a, b) => {
    if (a === '__none__') return 1;
    if (b === '__none__') return -1;
    return a.localeCompare(b);
  });

  const toggle = (district: string) => {
    setExpanded((prev) => ({ ...prev, [district]: !prev[district] }));
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>{t('stores.title')}</h1>

      {districts.map((district) => {
        const isOpen = expanded[district] ?? false;
        const label = district === '__none__'
          ? t('stores.unknownDistrict')
          : getDistrictLabel(district, language);
        const count = (grouped[district] ?? []).length;

        return (
          <div key={district} className="card" style={{ marginBottom: '1rem', padding: 0, overflow: 'hidden' }}>
            <button
              onClick={() => toggle(district)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <i className="fa-solid fa-location-dot" style={{ color: 'var(--color-primary)' }}></i>
                {label}
                <span style={{ fontWeight: 400, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  ({count})
                </span>
              </span>
              <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ color: 'var(--color-text-muted)' }}></i>
            </button>

            {isOpen && (
              <div style={{ padding: '0 1.25rem 1.25rem' }}>
                <div className="grid grid-3">
                  {(grouped[district] ?? []).map((store) => {
                    const loc = parseLocation(store.location);
                    const mapsUrl = loc?.lat != null && loc?.lng != null
                      ? `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
                      : null;
                    return (
                      <div key={store.id} className="card">
                        <div style={{ fontWeight: 500 }}>{store.name}</div>
                        {store.chain && (
                          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            {store.chain}
                          </div>
                        )}
                        {loc && (
                          <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {loc.address && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                <i className="fa-solid fa-house" style={{ marginRight: '0.35rem', opacity: 0.6 }}></i>
                                {loc.address}
                              </div>
                            )}
                            {mapsUrl && loc.coordsDisplay && (
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--color-primary)',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                              >
                                <i className="fa-solid fa-map-location-dot"></i>
                                {loc.coordsDisplay}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
