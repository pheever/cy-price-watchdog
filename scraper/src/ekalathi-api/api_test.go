package ekalathiapi

import (
	"net/http"
	"testing"
)

func TestGetCategory(t *testing.T) {
	tests := []struct {
		name       string
		params     CategoryRequest
		wantQuery  map[string]string
		absentKeys []string
	}{
		{
			name:       "zero value request has no page/size/sort params",
			params:     CategoryRequest{},
			wantQuery:  map[string]string{},
			absentKeys: []string{"page", "size", "sort"},
		},
		{
			name:   "with page, size, and sort",
			params: CategoryRequest{Page: 2, Size: 10, Sort: "name,asc"},
			wantQuery: map[string]string{
				"page": "2",
				"size": "10",
				"sort": "name,asc",
			},
		},
		{
			name:   "only page set",
			params: CategoryRequest{Page: 1},
			wantQuery: map[string]string{
				"page": "1",
			},
			absentKeys: []string{"size", "sort"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, err := GetCategory(tt.params)
			if err != nil {
				t.Fatalf("GetCategory() error = %v", err)
			}

			assertRequest(t, req, "GET",
				"www.e-kalathi.gov.cy",
				"/ekalathi-website-server/api/fetch-product-categories",
			)

			for key, want := range tt.wantQuery {
				got := req.URL.Query().Get(key)
				if got != want {
					t.Errorf("query param %q = %q, want %q", key, got, want)
				}
			}

			for _, key := range tt.absentKeys {
				if req.URL.Query().Has(key) {
					t.Errorf("query param %q should be absent", key)
				}
			}
		})
	}
}

func TestGetProducts(t *testing.T) {
	tests := []struct {
		name          string
		params        ProductRequest
		wantQuery     map[string]string
		wantMulti     map[string][]string
		absentKeys    []string
	}{
		{
			name:   "with category IDs",
			params: ProductRequest{CategoryIds: []int{1, 2, 3}, Page: 0},
			wantQuery: map[string]string{
				"page": "0",
			},
			wantMulti: map[string][]string{
				"categoryIds": {"1", "2", "3"},
			},
		},
		{
			name:   "page is always set",
			params: ProductRequest{Page: 5},
			wantQuery: map[string]string{
				"page": "5",
			},
		},
		{
			name:   "with size and sort",
			params: ProductRequest{Page: 0, Size: 20, Sort: "price,desc"},
			wantQuery: map[string]string{
				"page": "0",
				"size": "20",
				"sort": "price,desc",
			},
		},
		{
			name:   "with ID param",
			params: ProductRequest{ID: 42, Page: 0},
			wantQuery: map[string]string{
				"id":   "42",
				"page": "0",
			},
		},
		{
			name:       "zero ID is not set",
			params:     ProductRequest{Page: 0},
			wantQuery:  map[string]string{"page": "0"},
			absentKeys: []string{"id"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, err := GetProducts(tt.params)
			if err != nil {
				t.Fatalf("GetProducts() error = %v", err)
			}

			assertRequest(t, req, "GET",
				"www.e-kalathi.gov.cy",
				"/ekalathi-website-server/api/fetch-product-list",
			)

			for key, want := range tt.wantQuery {
				got := req.URL.Query().Get(key)
				if got != want {
					t.Errorf("query param %q = %q, want %q", key, got, want)
				}
			}

			for key, wantValues := range tt.wantMulti {
				gotValues := req.URL.Query()[key]
				if len(gotValues) != len(wantValues) {
					t.Errorf("query param %q has %d values, want %d", key, len(gotValues), len(wantValues))
					continue
				}
				for i, want := range wantValues {
					if gotValues[i] != want {
						t.Errorf("query param %q[%d] = %q, want %q", key, i, gotValues[i], want)
					}
				}
			}

			for _, key := range tt.absentKeys {
				if req.URL.Query().Has(key) {
					t.Errorf("query param %q should be absent", key)
				}
			}
		})
	}
}

func TestGetBranches(t *testing.T) {
	tests := []struct {
		name      string
		params    RetailBranchRequest
		wantQuery map[string]string
		wantMulti map[string][]string
	}{
		{
			name: "with product ID and region/company IDs",
			params: RetailBranchRequest{
				Page:       0,
				ProductId:  99,
				RegionIds:  []int{1, 2},
				CompanyIds: []int{10},
			},
			wantQuery: map[string]string{
				"page":      "0",
				"productId": "99",
			},
			wantMulti: map[string][]string{
				"regionIds":  {"1", "2"},
				"companyIds": {"10"},
			},
		},
		{
			name:   "empty regionIds and companyIds still set as empty string",
			params: RetailBranchRequest{Page: 0},
			wantQuery: map[string]string{
				"page":       "0",
				"regionIds":  "",
				"companyIds": "",
			},
		},
		{
			name:   "page always set",
			params: RetailBranchRequest{Page: 3},
			wantQuery: map[string]string{
				"page": "3",
			},
		},
		{
			name: "with size and sort",
			params: RetailBranchRequest{
				Page: 0,
				Size: 50,
				Sort: "name,asc",
			},
			wantQuery: map[string]string{
				"page": "0",
				"size": "50",
				"sort": "name,asc",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, err := GetBranches(tt.params)
			if err != nil {
				t.Fatalf("GetBranches() error = %v", err)
			}

			assertRequest(t, req, "GET",
				"www.e-kalathi.gov.cy",
				"/ekalathi-website-server/api/retail/fetch-retail-branch-list",
			)

			for key, want := range tt.wantQuery {
				got := req.URL.Query().Get(key)
				if got != want {
					t.Errorf("query param %q = %q, want %q", key, got, want)
				}
			}

			for key, wantValues := range tt.wantMulti {
				gotValues := req.URL.Query()[key]
				if len(gotValues) != len(wantValues) {
					t.Errorf("query param %q has %d values, want %d", key, len(gotValues), len(wantValues))
					continue
				}
				for i, want := range wantValues {
					if gotValues[i] != want {
						t.Errorf("query param %q[%d] = %q, want %q", key, i, gotValues[i], want)
					}
				}
			}
		})
	}
}

func TestGetProduct(t *testing.T) {
	tests := []struct {
		name       string
		params     ProductRequest
		wantQuery  map[string]string
		absentKeys []string
	}{
		{
			name:   "ID param set",
			params: ProductRequest{ID: 123},
			wantQuery: map[string]string{
				"id": "123",
			},
		},
		{
			name:       "zero ID not set",
			params:     ProductRequest{},
			absentKeys: []string{"id"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, err := GetProduct(tt.params)
			if err != nil {
				t.Fatalf("GetProduct() error = %v", err)
			}

			assertRequest(t, req, "GET",
				"www.e-kalathi.gov.cy",
				"/ekalathi-website-server/api/fetch-product",
			)

			for key, want := range tt.wantQuery {
				got := req.URL.Query().Get(key)
				if got != want {
					t.Errorf("query param %q = %q, want %q", key, got, want)
				}
			}

			for _, key := range tt.absentKeys {
				if req.URL.Query().Has(key) {
					t.Errorf("query param %q should be absent", key)
				}
			}
		})
	}
}

func TestGetRegions(t *testing.T) {
	req, err := GetRegions(RegionRequest{})
	if err != nil {
		t.Fatalf("GetRegions() error = %v", err)
	}

	assertRequest(t, req, "GET",
		"www.e-kalathi.gov.cy",
		"/ekalathi-website-server/api/fetch-regions",
	)
}

func TestGetCompanies(t *testing.T) {
	req, err := GetCompanies(CompanyRequest{})
	if err != nil {
		t.Fatalf("GetCompanies() error = %v", err)
	}

	assertRequest(t, req, "GET",
		"www.e-kalathi.gov.cy",
		"/ekalathi-website-server/api/fetch-companies",
	)
}

// assertRequest checks method, host, and path of a request.
func assertRequest(t *testing.T, req *http.Request, method, host, path string) {
	t.Helper()
	if req.Method != method {
		t.Errorf("method = %q, want %q", req.Method, method)
	}
	if req.URL.Host != host {
		t.Errorf("host = %q, want %q", req.URL.Host, host)
	}
	if req.URL.Path != path {
		t.Errorf("path = %q, want %q", req.URL.Path, path)
	}
}
