output "project_id" {
  description = "GCP project ID"
  value       = google_project.this.project_id
}

output "project_number" {
  description = "GCP project number"
  value       = google_project.this.number
}

output "tfstate_bucket" {
  description = "GCS bucket for Terraform remote state"
  value       = google_storage_bucket.tfstate.name
}

output "terraform_sa_email" {
  description = "Terraform service account email"
  value       = google_service_account.terraform.email
}

output "cloudrun_sa_email" {
  description = "Cloud Run scraper service account email"
  value       = google_service_account.cloudrun.email
}

output "github_actions_sa_email" {
  description = "GitHub Actions service account email"
  value       = google_service_account.github_actions.email
}

output "workload_identity_provider" {
  description = "Workload Identity Federation provider resource name"
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "secret_ids" {
  description = "Map of secret names to full resource IDs"
  value = {
    for name, secret in google_secret_manager_secret.secrets :
    name => secret.id
  }
}

output "cloudflare_terraform_token_id" {
  description = "ID of the scoped Cloudflare API token for Terraform"
  value       = cloudflare_api_token.terraform.id
}
