package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	ekalathiapi "github.com/pheever/cy-price-watchdog/scraper/src/ekalathi-api"
)

var logger *slog.Logger

func init() {
	logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
}

// Scraper holds the HTTP client and database pool
type Scraper struct {
	client *http.Client
	db     *pgxpool.Pool
}

func NewScraper(dbURL string) (*Scraper, error) {
	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &Scraper{
		client: &http.Client{
			Timeout: 120 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:          10,
				IdleConnTimeout:       60 * time.Second,
				DisableCompression:    false,
				DisableKeepAlives:     false,
				MaxIdleConnsPerHost:   5,
				ResponseHeaderTimeout: 120 * time.Second,
			},
		},
		db: pool,
	}, nil
}

func (s *Scraper) updateHeaders(req *http.Request) *http.Request {
	req.Header.Set("User-Agent", "cy-price-watchdog/1.0")
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Accept-Language", "el")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Referer", "https://www.e-kalathi.gov.cy/")
	// Note: Don't set Accept-Encoding manually - Go's transport handles gzip automatically
	return req
}

func (s *Scraper) Close() {
	s.db.Close()
}

// --- Category Methods ---

func (s *Scraper) fetchCategories() ([]ekalathiapi.CategoryResponse, error) {
	req, err := ekalathiapi.GetCategory(ekalathiapi.CategoryRequest{})
	if err != nil {
		return nil, fmt.Errorf("failed to create category request: %w", err)
	}

	req = s.updateHeaders(req)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch categories: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var categories []ekalathiapi.CategoryResponse
	if err := json.NewDecoder(resp.Body).Decode(&categories); err != nil {
		return nil, fmt.Errorf("failed to parse categories: %w", err)
	}

	return categories, nil
}

func (s *Scraper) upsertCategory(ctx context.Context, externalID int, code, name, nameEnglish string, parentID *string) (string, error) {
	var id string
	now := time.Now()

	err := s.db.QueryRow(ctx, `
		INSERT INTO "Category" (id, "externalId", code, name, "nameEnglish", "parentId", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
		ON CONFLICT ("externalId") DO UPDATE SET
			code = EXCLUDED.code,
			name = EXCLUDED.name,
			"nameEnglish" = EXCLUDED."nameEnglish",
			"parentId" = EXCLUDED."parentId",
			"updatedAt" = EXCLUDED."updatedAt"
		RETURNING id
	`, uuid.New().String(), externalID, code, name, nameEnglish, parentID, now).Scan(&id)

	if err != nil {
		return "", fmt.Errorf("failed to upsert category: %w", err)
	}

	return id, nil
}

func (s *Scraper) scrapeCategories(ctx context.Context) (map[int]string, error) {
	logger.Info("fetching categories")
	categories, err := s.fetchCategories()
	if err != nil {
		return nil, fmt.Errorf("failed to fetch categories: %w", err)
	}

	logger.Info("found parent categories", "count", len(categories))

	// Map external category ID to internal UUID
	categoryMap := make(map[int]string)

	for _, cat := range categories {
		parentID, err := s.upsertCategory(ctx, cat.ID, cat.Code, cat.Name, cat.NameEnglish, nil)
		if err != nil {
			logger.Error("error upserting parent category", "categoryID", cat.ID, "error", err)
			continue
		}
		categoryMap[cat.ID] = parentID
		logger.Debug("upserted parent category", "name", cat.Name, "nameEnglish", cat.NameEnglish)

		for _, subcat := range cat.ProductCategoryResponses {
			subcatID, err := s.upsertCategory(ctx, subcat.ID, subcat.Code, subcat.Name, subcat.NameEnglish, &parentID)
			if err != nil {
				logger.Error("error upserting subcategory", "subcategoryID", subcat.ID, "error", err)
				continue
			}
			categoryMap[subcat.ID] = subcatID
			logger.Debug("upserted subcategory", "name", subcat.Name, "nameEnglish", subcat.NameEnglish)
		}
	}

	return categoryMap, nil
}

// --- Product Methods ---

func (s *Scraper) fetchProductsPage(categoryID, page int) ([]ekalathiapi.Product, bool, error) {
	req, err := ekalathiapi.GetProducts(ekalathiapi.ProductRequest{
		CategoryIds: []int{categoryID},
		Page:        page,
		Size:        50,
	})
	if err != nil {
		return nil, false, fmt.Errorf("failed to create products request: %w", err)
	}

	req = s.updateHeaders(req)

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, false, fmt.Errorf("failed to fetch products: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, false, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var result ekalathiapi.ProductListResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, false, fmt.Errorf("failed to parse products: %w", err)
	}

	return result.Content, result.Last, nil
}

func (s *Scraper) fetchProducts(categoryID int) ([]ekalathiapi.Product, error) {
	var allProducts []ekalathiapi.Product
	page := 0

	for {
		products, isLast, err := s.fetchProductsPage(categoryID, page)
		if err != nil {
			return nil, err
		}

		allProducts = append(allProducts, products...)

		if isLast || len(products) == 0 {
			break
		}

		page++
		// Rate limiting between pages
		time.Sleep(100 * time.Millisecond)
	}

	return allProducts, nil
}

func (s *Scraper) upsertProduct(ctx context.Context, externalID int, code, name, nameEnglish string, categoryID string) (string, error) {
	var id string
	now := time.Now()

	err := s.db.QueryRow(ctx, `
		INSERT INTO "Product" (id, "externalId", code, name, "nameEnglish", "categoryId", "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
		ON CONFLICT ("externalId") DO UPDATE SET
			code = EXCLUDED.code,
			name = EXCLUDED.name,
			"nameEnglish" = EXCLUDED."nameEnglish",
			"categoryId" = EXCLUDED."categoryId",
			"updatedAt" = EXCLUDED."updatedAt"
		RETURNING id
	`, uuid.New().String(), externalID, code, name, nameEnglish, categoryID, now).Scan(&id)

	if err != nil {
		return "", fmt.Errorf("failed to upsert product: %w", err)
	}

	return id, nil
}

func (s *Scraper) getCategoryIDByName(ctx context.Context, categoryName string) (string, error) {
	var id string
	err := s.db.QueryRow(ctx, `
		SELECT id FROM "Category" WHERE name = $1 LIMIT 1
	`, categoryName).Scan(&id)

	if err != nil {
		return "", fmt.Errorf("failed to find category by name %s: %w", categoryName, err)
	}

	return id, nil
}

func (s *Scraper) scrapeProducts(ctx context.Context, categoryMap map[int]string) (map[int]string, error) {
	logger.Info("fetching products")

	// Map external product ID to internal UUID
	productMap := make(map[int]string)

	// Fetch products for each category
	for extCategoryID, categoryID := range categoryMap {
		products, err := s.fetchProducts(extCategoryID)
		if err != nil {
			logger.Error("error fetching products for category", "categoryID", extCategoryID, "error", err)
			continue
		}

		logger.Info("found products in category", "count", len(products), "categoryID", extCategoryID)

		for _, product := range products {
			// Use category name from product to find correct category
			prodCategoryID := categoryID
			if product.ProductCategoryName != "" {
				if foundID, err := s.getCategoryIDByName(ctx, product.ProductCategoryName); err == nil {
					prodCategoryID = foundID
				}
			}

			productID, err := s.upsertProduct(ctx, product.ProductMasterId, product.Code, product.Name, product.ProductCategoryNameEnglish, prodCategoryID)
			if err != nil {
				logger.Error("error upserting product", "productID", product.ProductMasterId, "error", err)
				continue
			}
			productMap[product.ProductMasterId] = productID
		}
	}

	logger.Info("scraped unique products", "count", len(productMap))
	return productMap, nil
}

// --- Store Methods ---

func (s *Scraper) fetchRetailBranchesPage(productID, page int) ([]ekalathiapi.RetailBranchResponse, bool, error) {
	req, err := ekalathiapi.GetBranches(ekalathiapi.RetailBranchRequest{
		Page:      page,
		Size:      10,
		ProductId: productID,
	})
	if err != nil {
		return nil, false, fmt.Errorf("failed to create branches request: %w", err)
	}

	req = s.updateHeaders(req)

	resp, err := s.client.Do(req)

	if err != nil {
		return nil, false, fmt.Errorf("failed to fetch branches: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, false, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	// Read full body first to handle large responses
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		//TODO: add retry logic for transient errors
		return nil, false, fmt.Errorf("failed to read branches response body: %w", err)
	}

	var result ekalathiapi.RetailBranchListResponse
	if err := json.NewDecoder(bytes.NewReader(body)).Decode(&result); err != nil {
		return nil, false, fmt.Errorf("failed to parse branches (body length: %d): %w", len(body), err)
	}

	return result.Content, result.Last, nil
}

func (s *Scraper) fetchRetailBranches(productID int) ([]ekalathiapi.RetailBranchResponse, error) {
	var allBranches []ekalathiapi.RetailBranchResponse
	page := 0

	for {
		branches, isLast, err := s.fetchRetailBranchesPage(productID, page)
		if err != nil {
			return nil, err
		}

		allBranches = append(allBranches, branches...)

		if isLast || len(branches) == 0 {
			break
		}

		page++
		time.Sleep(100 * time.Millisecond)
	}

	return allBranches, nil
}

func (s *Scraper) upsertStore(ctx context.Context, externalID int, name, chain, location string) (string, error) {
	var id string
	now := time.Now()

	err := s.db.QueryRow(ctx, `
		INSERT INTO "Store" (id, "externalId", name, chain, location, "createdAt", "updatedAt")
		VALUES ($1, $2, $3, $4, $5, $6, $6)
		ON CONFLICT ("externalId") DO UPDATE SET
			name = EXCLUDED.name,
			chain = EXCLUDED.chain,
			location = EXCLUDED.location,
			"updatedAt" = EXCLUDED."updatedAt"
		RETURNING id
	`, uuid.New().String(), externalID, name, chain, location, now).Scan(&id)

	if err != nil {
		return "", fmt.Errorf("failed to upsert store: %w", err)
	}

	return id, nil
}

func (s *Scraper) insertPrice(ctx context.Context, productID, storeID string, price float64) error {
	_, err := s.db.Exec(ctx, `
		INSERT INTO "Price" (id, "productId", "storeId", price, "scrapedAt")
		VALUES ($1, $2, $3, $4, $5)
	`, uuid.New().String(), productID, storeID, price, time.Now())

	if err != nil {
		return fmt.Errorf("failed to insert price: %w", err)
	}

	return nil
}

func (s *Scraper) scrapePrices(ctx context.Context, productMap map[int]string) error {
	logger.Info("fetching prices from retail branches")

	storeMap := make(map[int]string) // cache store IDs
	priceCount := 0

	for extProductID, productID := range productMap {
		branches, err := s.fetchRetailBranches(extProductID)
		if err != nil {
			logger.Error("error fetching branches for product", "productID", extProductID, "error", err)
			continue
		}

		for _, branch := range branches {
			// Upsert store if not cached
			storeID, exists := storeMap[branch.ID]
			if !exists {
				location := branch.PostalAddress
				if branch.BranchLatitude != "" && branch.BranchLongitude != "" {
					location = fmt.Sprintf("%s (%s, %s)", branch.PostalAddress, branch.BranchLatitude, branch.BranchLongitude)
				}

				storeID, err = s.upsertStore(ctx, branch.ID, branch.Name, branch.CompanyName, location)
				if err != nil {
					logger.Error("error upserting store", "storeID", branch.ID, "error", err)
					continue
				}
				storeMap[branch.ID] = storeID
			}

			// Insert price record
			if err := s.insertPrice(ctx, productID, storeID, branch.RetailerProductPrice); err != nil {
				logger.Error("error inserting price", "productID", extProductID, "storeID", branch.ID, "error", err)
				continue
			}
			priceCount++
		}

		// Rate limiting to be respectful to the API
		time.Sleep(500 * time.Millisecond)
	}

	logger.Info("inserted price records", "priceCount", priceCount, "storeCount", len(storeMap))
	return nil
}

// --- Main Run Method ---

func (s *Scraper) Run(ctx context.Context) error {
	logger.Info("starting scraper")

	// Step 1: Scrape categories
	categoryMap, err := s.scrapeCategories(ctx)
	if err != nil {
		return fmt.Errorf("failed to scrape categories: %w", err)
	}

	// Step 2: Scrape products
	productMap, err := s.scrapeProducts(ctx, categoryMap)
	if err != nil {
		return fmt.Errorf("failed to scrape products: %w", err)
	}

	// Step 3: Scrape prices from retail branches
	if err := s.scrapePrices(ctx, productMap); err != nil {
		return fmt.Errorf("failed to scrape prices: %w", err)
	}

	logger.Info("scraping completed successfully")
	return nil
}
