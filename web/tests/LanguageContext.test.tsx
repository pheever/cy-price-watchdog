import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import type { ReactNode } from 'react';

function wrapper({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

beforeEach(() => {
  localStorage.clear();
});

describe('LanguageProvider', () => {
  it('defaults to Greek (el)', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.language).toBe('el');
  });

  it('restores language from localStorage', () => {
    localStorage.setItem('language', 'en');

    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.language).toBe('en');
  });

  it('persists language changes to localStorage', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage('en');
    });

    expect(localStorage.getItem('language')).toBe('en');
  });

  it('switches language', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.language).toBe('el');

    act(() => {
      result.current.setLanguage('en');
    });

    expect(result.current.language).toBe('en');
  });
});

describe('t() translation function', () => {
  it('returns Greek translation by default', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.t('nav.categories')).toBe('Κατηγορίες');
  });

  it('returns English translation after switching', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => {
      result.current.setLanguage('en');
    });

    expect(result.current.t('nav.categories')).toBe('Categories');
  });

  it('returns key when translation is missing', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('translates navigation keys in both languages', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.t('nav.about')).toBe('Σχετικά');
    expect(result.current.t('nav.sources')).toBe('Πηγές');

    act(() => {
      result.current.setLanguage('en');
    });

    expect(result.current.t('nav.about')).toBe('About');
    expect(result.current.t('nav.sources')).toBe('Sources');
  });

  it('translates common keys', () => {
    localStorage.setItem('language', 'en');
    const { result } = renderHook(() => useLanguage(), { wrapper });

    expect(result.current.t('common.loading')).toBe('Loading...');
    expect(result.current.t('common.error')).toBe('Error');
  });
});

describe('useLanguage outside provider', () => {
  it('throws error when used outside LanguageProvider', () => {
    // Suppress React dev-mode error logging through jsdom's event dispatch and console.error
    const onError = (e: ErrorEvent) => e.preventDefault();
    window.addEventListener('error', onError);
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useLanguage());
    }).toThrow('useLanguage must be used within a LanguageProvider');

    spy.mockRestore();
    window.removeEventListener('error', onError);
  });
});
