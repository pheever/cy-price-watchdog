import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'el' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  el: {
    // Navigation
    'nav.dashboard': 'Πίνακας',
    'nav.categories': 'Κατηγορίες',
    'nav.about': 'Σχετικά',
    'nav.sources': 'Πηγές',

    // Dashboard
    'dashboard.title': 'Πίνακας',
    'dashboard.lastScraped': 'Τελευταία ενημέρωση:',
    'dashboard.never': 'Ποτέ',
    'dashboard.categories': 'Κατηγορίες',
    'dashboard.products': 'Προϊόντα',
    'dashboard.stores': 'Καταστήματα',
    'dashboard.priceRecords': 'Εγγραφές τιμών',
    'dashboard.browse': 'Περιηγηθείτε στις κατηγορίες προϊόντων για να συγκρίνετε τιμές σε διάφορα καταστήματα της Κύπρου.',
    'dashboard.browseCategories': 'Περιήγηση κατηγοριών',
    'dashboard.searchPlaceholder': 'Αναζήτηση προϊόντων...',
    'dashboard.dataSource': 'Πηγή δεδομένων: e-Kalathi',
    'dashboard.viewOnGithub': 'Προβολή στο GitHub',

    // About
    'about.title': 'Σχετικά',
    'about.projectTitle': 'Cyprus Price Watchdog',
    'about.description': 'Το Cyprus Price Watchdog είναι ένα εργαλείο ανοιχτού κώδικα για την παρακολούθηση και σύγκριση τιμών σούπερ μάρκετ στην Κύπρο. Συλλέγει δεδομένα τιμών από την επίσημη κυβερνητική πλατφόρμα e-Kalathi και τα παρουσιάζει σε μια εύχρηστη διεπαφή.',
    'about.goal': 'Ο στόχος είναι να βοηθήσει τους καταναλωτές να λαμβάνουν τεκμηριωμένες αποφάσεις παρέχοντας διαφάνεια στις τιμές των προϊόντων σε διαφορετικά καταστήματα.',
    'about.openSource': 'Ανοιχτός Κώδικας',
    'about.openSourceDesc': 'Αυτό το έργο είναι ανοιχτού κώδικα και διαθέσιμο στο GitHub. Οι συνεισφορές είναι ευπρόσδεκτες.',
    'about.viewOnGithub': 'Προβολή στο GitHub',

    // Sources
    'sources.title': 'Πηγές Δεδομένων',
    'sources.ekalathiTitle': 'Πλατφόρμα e-Kalathi',
    'sources.ekalathiDesc': 'Όλα τα δεδομένα τιμών προέρχονται από την επίσημη πλατφόρμα e-Kalathi, η οποία συντηρείται από την κυβέρνηση της Κύπρου. Αυτή η πλατφόρμα δημιουργήθηκε για να παρέχει διαφάνεια τιμών για βασικά καταναλωτικά αγαθά στα σούπερ μάρκετ της Κύπρου.',
    'sources.visitEkalathi': 'Επισκεφθείτε το e-Kalathi',
    'sources.dataCollection': 'Συλλογή Δεδομένων',
    'sources.dataCollectionDesc': 'Τα δεδομένα τιμών συλλέγονται καθημερινά μέσω αυτοματοποιημένου scraper. Ο scraper ανακτά κατηγορίες προϊόντων, προϊόντα, πληροφορίες καταστημάτων και τρέχουσες τιμές από το API του e-Kalathi. Τα ιστορικά δεδομένα τιμών διατηρούνται για να επιτρέπουν την παρακολούθηση τιμών με την πάροδο του χρόνου.',
    'sources.disclaimer': 'Αποποίηση Ευθύνης',
    'sources.disclaimerDesc': 'Παρόλο που προσπαθούμε να διατηρούμε τα δεδομένα ακριβή και ενημερωμένα, οι τιμές μπορεί να αλλάξουν ανά πάσα στιγμή. Πάντα επαληθεύστε τις τιμές απευθείας με τον λιανοπωλητή πριν πάρετε αποφάσεις αγοράς. Αυτό το εργαλείο παρέχεται μόνο για ενημερωτικούς σκοπούς.',

    // Product
    'product.notFound': 'Το προϊόν δεν βρέθηκε',
    'product.currentPriceSummary': 'Σύνοψη Τρέχουσας Τιμής',
    'product.basedOnStores': 'Βάσει {count} καταστημάτων (ενημέρωση {date})',
    'product.minPrice': 'Ελάχιστη Τιμή',
    'product.avgPrice': 'Μέση Τιμή',
    'product.maxPrice': 'Μέγιστη Τιμή',
    'product.pricesByStore': 'Τιμές ανά Κατάστημα',
    'product.pricesByDistrict': 'Τιμές ανά Επαρχία',
    'product.store': 'Κατάστημα',
    'product.stores': 'καταστήματα',
    'product.chain': 'Αλυσίδα',
    'product.current': 'Τρέχουσα',
    'product.min': 'Ελάχ.',
    'product.avg': 'Μέση',
    'product.max': 'Μέγ.',
    'product.noData': 'Δεν υπάρχουν διαθέσιμα δεδομένα τιμών για αυτό το προϊόν.',
    'product.searchStores': 'Αναζήτηση καταστημάτων...',
    'product.loadMore': 'Φόρτωση περισσότερων',

    // Categories
    'categories.title': 'Κατηγορίες',
    'categories.products': 'Προϊόντα',
    'categories.subcategories': 'Υποκατηγορίες',
    'categories.allCategories': 'Όλες οι Κατηγορίες',
    'categories.cheapest': 'Φθηνότερα σε αυτή την κατηγορία',

    // Common
    'common.loading': 'Φόρτωση...',
    'common.error': 'Σφάλμα',
    'common.noData': 'Δεν υπάρχουν διαθέσιμα δεδομένα',
  },
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.categories': 'Categories',
    'nav.about': 'About',
    'nav.sources': 'Sources',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.lastScraped': 'Last Scraped:',
    'dashboard.never': 'Never',
    'dashboard.categories': 'Categories',
    'dashboard.products': 'Products',
    'dashboard.stores': 'Stores',
    'dashboard.priceRecords': 'Price Records',
    'dashboard.browse': 'Browse product categories to compare prices across different stores in Cyprus.',
    'dashboard.browseCategories': 'Browse Categories',
    'dashboard.searchPlaceholder': 'Search products...',
    'dashboard.dataSource': 'Data Source: e-Kalathi',
    'dashboard.viewOnGithub': 'View on GitHub',

    // About
    'about.title': 'About',
    'about.projectTitle': 'Cyprus Price Watchdog',
    'about.description': 'Cyprus Price Watchdog is an open-source tool for monitoring and comparing supermarket prices across Cyprus. It collects price data from the official government e-Kalathi platform and presents it in an easy-to-use interface.',
    'about.goal': 'The goal is to help consumers make informed decisions by providing transparency into product pricing across different stores.',
    'about.openSource': 'Open Source',
    'about.openSourceDesc': 'This project is open source and available on GitHub. Contributions are welcome.',
    'about.viewOnGithub': 'View on GitHub',

    // Sources
    'sources.title': 'Data Sources',
    'sources.ekalathiTitle': 'e-Kalathi Platform',
    'sources.ekalathiDesc': 'All price data is sourced from the official e-Kalathi platform, which is maintained by the Cyprus government. This platform was created to provide price transparency for basic consumer goods across supermarkets in Cyprus.',
    'sources.visitEkalathi': 'Visit e-Kalathi',
    'sources.dataCollection': 'Data Collection',
    'sources.dataCollectionDesc': 'Price data is collected daily through an automated scraper. The scraper fetches product categories, products, store information, and current prices from the e-Kalathi API. Historical price data is preserved to enable price tracking over time.',
    'sources.disclaimer': 'Disclaimer',
    'sources.disclaimerDesc': 'While we strive to keep the data accurate and up-to-date, prices may change at any time. Always verify prices directly with the retailer before making purchasing decisions. This tool is provided for informational purposes only.',

    // Product
    'product.notFound': 'Product not found',
    'product.currentPriceSummary': 'Current Price Summary',
    'product.basedOnStores': 'Based on {count} stores (scraped {date})',
    'product.minPrice': 'Min Price',
    'product.avgPrice': 'Avg Price',
    'product.maxPrice': 'Max Price',
    'product.pricesByStore': 'Prices by Store',
    'product.pricesByDistrict': 'Prices by District',
    'product.store': 'Store',
    'product.stores': 'stores',
    'product.chain': 'Chain',
    'product.current': 'Current',
    'product.min': 'Min',
    'product.avg': 'Avg',
    'product.max': 'Max',
    'product.noData': 'No price data available for this product yet.',
    'product.searchStores': 'Search stores...',
    'product.loadMore': 'Load More',

    // Categories
    'categories.title': 'Categories',
    'categories.products': 'Products',
    'categories.subcategories': 'Subcategories',
    'categories.allCategories': 'All Categories',
    'categories.cheapest': 'Cheapest in this category',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.noData': 'No data available',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'el';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
