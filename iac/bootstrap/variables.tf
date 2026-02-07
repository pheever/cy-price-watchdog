variable "project_id" {
  description = "GCP project ID (globally unique)"
  type        = string
}

variable "project_name" {
  description = "Human-readable project name"
  type        = string
  default     = "Cyprus Price Watchdog"
}

variable "org_id" {
  description = "GCP Organization ID (mutually exclusive with folder_id)"
  type        = string
  default     = ""
}

variable "folder_id" {
  description = "GCP Folder ID (mutually exclusive with org_id)"
  type        = string
  default     = ""
}

variable "billing_account" {
  description = "GCP Billing Account ID"
  type        = string
}

variable "region" {
  description = "Default GCP region"
  type        = string
  default     = "europe-west1"
}

variable "github_repo" {
  description = "GitHub repository for Workload Identity Federation"
  type        = string
  default     = "pheever/cy-price-watchdog"
}

variable "github_token" {
  description = "GitHub PAT with repo admin scope (for managing Actions secrets/variables)"
  type        = string
  sensitive   = true
}

variable "ghcr_token" {
  description = "GitHub classic PAT with read:packages scope (for pulling images from ghcr.io)"
  type        = string
  sensitive   = true
}

variable "cloudflare_api_key" {
  description = "Cloudflare Global API Key (Profile > API Tokens > Global API Key)"
  type        = string
  sensitive   = true
}

variable "cloudflare_email" {
  description = "Cloudflare account email"
  type        = string
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}
