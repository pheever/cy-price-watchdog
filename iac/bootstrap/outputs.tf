output "project_id" {
  description = "GCP project ID"
  value       = google_project.this.project_id
}

output "region" {
  description = "GCP region"
  value       = var.region
}

output "cloudflare_account_id" {
  description = "Cloudflare account ID"
  value       = var.cloudflare_account_id
  sensitive   = true
}

output "github_repo" {
  description = "GitHub repository"
  value       = var.github_repo
}

