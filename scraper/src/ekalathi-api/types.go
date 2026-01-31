package ekalathiapi

// --- Category Types ---
type CategoryRequest struct {
	Page        int    `json:"page"`
	Size        int    `json:"size"`
	Sort        string `json:"sort"`
	CategoryIds []int  `json:"categoryIds"`
}

type CategoryResponse struct {
	ID                       int                   `json:"id"`
	Code                     string                `json:"code"`
	Name                     string                `json:"name"`
	NameEnglish              string                `json:"nameEnglish"`
	ProductCategoryResponses []SubcategoryResponse `json:"productCategoryResponses"`
}

type SubcategoryRequest struct{}

type SubcategoryResponse struct {
	ID          int    `json:"id"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	NameEnglish string `json:"nameEnglish"`
}

// --- Region Types ---
type RegionRequest struct{}

type RegionResponse struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// --- Retail Branch Types ---
type RetailBranchRequest struct {
	Page       int    `json:"page"`
	Size       int    `json:"size"`
	Sort       string `json:"sort"`
	ProductId  int    `json:"productId"`
	RegionIds  []int  `json:"regionIds"`
	CompanyIds []int  `json:"companyIds"`
}

type RetailBranchResponse struct {
	ID                          int     `json:"id"`
	Name                        string  `json:"name"`
	LandPhone                   string  `json:"landPhone"`
	PostalAddress               string  `json:"postalAddress"`
	CompanyName                 string  `json:"companyName"`
	CompanyPhotoUrl             string  `json:"companyPhotoUrl"`
	CompanyPhotoFileName        string  `json:"companyPhotoFileName"`
	CompanyPhotoFileType        string  `json:"companyPhotoFileType"`
	CompanyPhotoFile            string  `json:"companyPhotoFile"`
	BranchLatitude              string  `json:"branchLatitude"`
	BranchLongitude             string  `json:"branchLongitude"`
	CloserBranchDistance        int     `json:"closerBranchDistance"`
	RetailerProductPrice        float64 `json:"retailerProductPrice"`
	RetailerInitialProductPrice float64 `json:"retailerInitialProductPrice"`
	RetailerBasketProducts      int     `json:"retailerBasketProducts"`
	IsInOfferOrDiscount         bool    `json:"isInOfferOrDiscount"`
}

// --- Company Types ---
type CompanyRequest struct{}

type CompanyResponse struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// --- Paginated Response Wrapper ---
type PaginatedResponse[T any] struct {
	Content       []T  `json:"content"`
	TotalElements int  `json:"totalElements"`
	TotalPages    int  `json:"totalPages"`
	Last          bool `json:"last"`
	First         bool `json:"first"`
	Empty         bool `json:"empty"`
}

// Paginated response type aliases
type ProductListResponse = PaginatedResponse[Product]
type RetailBranchListResponse = PaginatedResponse[RetailBranchResponse]

// --- Product Types ---
type ProductRequest struct {
	ID          int   `json:"id"`
	CategoryIds []int `json:"categoryIds"`
	Page        int   `json:"page"`
	Size        int   `json:"size"`
	Sort        string `json:"sort"`
}

type Product struct {
	ProductMasterId            int     `json:"productMasterId"`
	Code                       string  `json:"code"`
	Name                       string  `json:"name"`
	Discount                   bool    `json:"discount"`
	StartPrice                 float64 `json:"startPrice"`
	PreviousPrice              float64 `json:"previousPrice"`
	ProductCategoryName        string  `json:"productCategoryName"`
	ProductCategoryNameEnglish string  `json:"productCategoryNameEnglish"`
	NumberOfChains             int     `json:"numberOfChains"`
	Favorite                   bool    `json:"favorite"`
	Preferred                  bool    `json:"preferred"`
	ProductMainPhotoFileId     int     `json:"productMainPhotoFileId"`
	ProductMainPhotoFileType   string  `json:"productMainPhotoFileType"`
	NotifiedAbout              bool    `json:"notifiedAbout"`
	HasBeenPurchased           bool    `json:"hasBeenPurchased"`
	ToSendOffers               bool    `json:"toSendOffers"`
	ProductMainPhotoUrl        string  `json:"productMainPhotoUrl"`
}

type ProductResponse struct {
	Product
}

// --- Additional Types Based on Example Responses ---
type PriceHistory struct {
	Date  string  `json:"date"`
	Price float64 `json:"price"`
}

type ProductDetailsResponse struct {
	ProductID          int            `json:"productId"`
	Name               string         `json:"name"`
	Description        string         `json:"description"`
	Category           string         `json:"category"`
	PriceHistory       []PriceHistory `json:"priceHistory"`
	CurrentPrice       float64        `json:"currentPrice"`
	DiscountPercentage float64        `json:"discountPercentage"`
	ImageURL           string         `json:"imageUrl"`
}

type RetailerResponse struct {
	ID       int     `json:"id"`
	Name     string  `json:"name"`
	Location string  `json:"location"`
	Price    float64 `json:"price"`
}

type RetailerListResponse struct {
	ProductID int                `json:"productId"`
	Retailers []RetailerResponse `json:"retailers"`
}
