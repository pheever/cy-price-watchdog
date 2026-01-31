package ekalathiapi

import (
	"fmt"
	"net/http"
	"net/url"
	"path"
)

const (
	APIHost                = "www.e-kalathi.gov.cy"
	APIRootPath            = "ekalathi-website-server/api"
	CategoriesEndpoint     = "fetch-product-categories"
	ProductsEndpoint       = "fetch-product-list"
	ProductEndpoint        = "fetch-product"
	RegionsEndpoint        = "fetch-regions"
	RetailBranchesEndpoint = "retail/fetch-retail-branch-list"
	CompaniesEndpoint      = "fetch-companies"
)

func newBaseRequest(method, endpoint string) (*http.Request, error) {
	apiURL := url.URL{
		Scheme: "https",
		Host:   APIHost,
		Path:   path.Join(APIRootPath, endpoint),
	}

	req, err := http.NewRequest(method, apiURL.String(), http.NoBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	return req, nil
}

func GetCategory(params CategoryRequest) (*http.Request, error) {
	req, err := newBaseRequest("GET", CategoriesEndpoint)
	if err != nil {
		return nil, err
	}

	// Add query parameters if needed
	query := req.URL.Query()
	if params.Page > 0 {
		query.Set("page", fmt.Sprintf("%d", params.Page))
	}
	if params.Size > 0 {
		query.Set("size", fmt.Sprintf("%d", params.Size))
	}
	if params.Sort != "" {
		query.Set("sort", params.Sort)
	}
	req.URL.RawQuery = query.Encode()

	return req, nil
}

func GetBranches(params RetailBranchRequest) (*http.Request, error) {
	req, err := newBaseRequest("GET", RetailBranchesEndpoint)
	if err != nil {
		return nil, err
	}

	// Add query parameters
	query := req.URL.Query()
	// Page is 0-indexed
	query.Set("page", fmt.Sprintf("%d", params.Page))
	if params.Size > 0 {
		query.Set("size", fmt.Sprintf("%d", params.Size))
	}
	if params.Sort != "" {
		query.Set("sort", params.Sort)
	}
	if params.ProductId > 0 {
		query.Set("productId", fmt.Sprintf("%d", params.ProductId))
	}
	// Always include regionIds and companyIds (even if empty)
	if len(params.RegionIds) == 0 {
		query.Set("regionIds", "")
	} else {
		for _, regionID := range params.RegionIds {
			query.Add("regionIds", fmt.Sprintf("%d", regionID))
		}
	}
	if len(params.CompanyIds) == 0 {
		query.Set("companyIds", "")
	} else {
		for _, companyID := range params.CompanyIds {
			query.Add("companyIds", fmt.Sprintf("%d", companyID))
		}
	}
	req.URL.RawQuery = query.Encode()

	return req, nil
}

func GetProducts(params ProductRequest) (*http.Request, error) {
	req, err := newBaseRequest("GET", ProductsEndpoint)
	if err != nil {
		return nil, err
	}

	// Add query parameters
	query := req.URL.Query()
	if params.ID > 0 {
		query.Set("id", fmt.Sprintf("%d", params.ID))
	}
	for _, categoryID := range params.CategoryIds {
		query.Add("categoryIds", fmt.Sprintf("%d", categoryID))
	}
	// Page is 0-indexed
	query.Set("page", fmt.Sprintf("%d", params.Page))
	if params.Size > 0 {
		query.Set("size", fmt.Sprintf("%d", params.Size))
	}
	if params.Sort != "" {
		query.Set("sort", params.Sort)
	}

	req.URL.RawQuery = query.Encode()

	return req, nil
}

func GetProduct(params ProductRequest) (*http.Request, error) {
	req, err := newBaseRequest("GET", ProductEndpoint)
	if err != nil {
		return nil, err
	}

	// Add query parameters
	query := req.URL.Query()
	if params.ID > 0 {
		query.Set("id", fmt.Sprintf("%d", params.ID))
	}
	req.URL.RawQuery = query.Encode()

	return req, nil
}

func GetRegions(params RegionRequest) (*http.Request, error) {
	req, err := newBaseRequest("GET", RegionsEndpoint)
	if err != nil {
		return nil, err
	}

	// Add query parameters if needed
	req.URL.RawQuery = req.URL.Query().Encode()

	return req, nil
}

func GetCompanies(params CompanyRequest) (*http.Request, error) {
	req, err := newBaseRequest("GET", CompaniesEndpoint)
	if err != nil {
		return nil, err
	}

	// Add query parameters if needed
	req.URL.RawQuery = req.URL.Query().Encode()

	return req, nil
}
