data "terraform_remote_state" "bootstrap" {
  backend = "gcs"
  config = {
    bucket = "cy-price-watchdog-prod-tfstate"
    prefix = "bootstrap"
  }
}

locals {
  bootstrap = data.terraform_remote_state.bootstrap.outputs

  project_id            = local.bootstrap.project_id
  region                = local.bootstrap.region
  cloudflare_account_id = local.bootstrap.cloudflare_account_id
  github_repo           = local.bootstrap.github_repo

}

data "google_secret_manager_secret_version" "cloudflare_api_token" {
  secret  = "cloudflare-api-token"
  project = local.project_id
}

data "cloudflare_zone" "main" {
  name = var.domain
}
