locals {
  secrets = toset([
    "postgres-admin-password",
    "data-writer-password",
    "data-reader-password",
    "metrics-db-password",
    "metrics-writer-password",
    "metrics-reader-password",
    "grafana-admin-password",
    "cloudflare-api-token",
    "cloudflare-tunnel-secret",
    "ghcr-token",
  ])

}

resource "google_secret_manager_secret" "secrets" {
  for_each  = local.secrets
  project   = google_project.this.project_id
  secret_id = each.value

  replication {
    auto {}
  }

  depends_on = [google_project_service.services]
}

resource "google_secret_manager_secret_version" "ghcr_token" {
  secret      = google_secret_manager_secret.secrets["ghcr-token"].id
  secret_data = var.ghcr_token
}
