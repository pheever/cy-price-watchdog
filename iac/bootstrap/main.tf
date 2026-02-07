terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }


  }
  backend "gcs" {
    bucket = "cy-price-watchdog-prod-tfstate"
    prefix = "bootstrap"
  }
}

provider "google" {
  region = var.region
}

provider "github" {
  owner = split("/", var.github_repo)[0]
  token = var.github_token
}

provider "cloudflare" {
  api_key = var.cloudflare_api_key
  email   = var.cloudflare_email
}

resource "google_project" "this" {
  name            = var.project_name
  project_id      = var.project_id
  org_id          = var.org_id != "" ? var.org_id : null
  folder_id       = var.folder_id != "" ? var.folder_id : null
  billing_account = var.billing_account
  deletion_policy = "PREVENT"
}
